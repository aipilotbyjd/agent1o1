import { useMemo } from 'react';
import { useNodes } from '@/api/modules/nodes';
import { useConnectorCredentials, useConnectors } from '@/api/modules/connectors';
import { isConnectorUnavailable } from '@/types/connector.type';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';
import { isListed, mapApiNodeToDefinition } from '../_helper/apiNodeCatalog.helper';
import {
	matchesMentionQuery as matches,
	type TPromptMentionItem,
	type TPromptMentionTrigger,
} from '../_helper/promptMentions.helper';

const MAX_PER_GROUP = 6;

/** `/` offers the node catalog; `@` offers connected accounts, then apps to connect. */
export const usePromptMentionItems = (
	workspaceId: string,
	trigger: TPromptMentionTrigger | null,
	query: string,
): TPromptMentionItem[] => {
	const { data: nodes } = useNodes(trigger === 'slash' ? workspaceId : '');
	const { data: credentials } = useConnectorCredentials(trigger === 'at' ? workspaceId : '');
	const { data: connectors } = useConnectors();

	return useMemo(() => {
		if (trigger === 'slash') {
			return (
				(nodes ?? [])
					.map((node) => mapApiNodeToDefinition(node))
					// The builder can't place a workspace's own `custom:` nodes.
					.filter(
						(node) =>
							isListed(node) &&
							!node.key.startsWith('custom:') &&
							matches(query, node.label, node.key),
					)
					.slice(0, MAX_PER_GROUP * 2)
					.map((node) => ({ kind: 'node' as const, id: `node:${node.key}`, node }))
			);
		}
		if (trigger !== 'at') return [];

		const byId = new Map((connectors ?? []).map((connector) => [connector.id, connector]));
		const accounts = (credentials ?? [])
			.map((credential) => ({
				credential,
				connector: credential.connector ?? byId.get(credential.connector_id),
			}))
			.filter(({ credential, connector }) =>
				matches(query, credential.name, credential.account_label, connector?.name),
			)
			.sort((a, b) => Number(a.credential.is_expired) - Number(b.credential.is_expired))
			.slice(0, MAX_PER_GROUP)
			.map(({ credential, connector }) => ({
				kind: 'credential' as const,
				id: `credential:${credential.id}`,
				credential,
				connector,
			}));

		const connected = new Set((credentials ?? []).map((credential) => credential.connector_id));
		const toConnect = (connectors ?? [])
			.filter(
				(connector) =>
					connector.is_active &&
					!isConnectorUnavailable(connector) &&
					!connected.has(connector.id) &&
					matches(query, connector.name, connector.key),
			)
			.sort(
				(a, b) =>
					Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order,
			)
			.slice(0, MAX_PER_GROUP)
			.map((connector) => ({
				kind: 'connect' as const,
				id: `connect:${connector.id}`,
				connector,
			}));

		return [...accounts, ...toConnect];
	}, [trigger, query, nodes, credentials, connectors]);
};

const MAX_SHORTCUTS = 3;

export type TPromptAppShortcut = { connector: TConnector; accounts: TConnectorCredential[] };

/** The apps shown as icons beside the prompt: connected ones first, then featured ones to connect. */
export const usePromptAppShortcuts = (workspaceId: string): TPromptAppShortcut[] => {
	const { data: credentials } = useConnectorCredentials(workspaceId);
	const { data: connectors } = useConnectors();

	return useMemo(() => {
		const usable = (connectors ?? []).filter(
			(connector) => connector.is_active && !isConnectorUnavailable(connector),
		);
		const accountsFor = (connector: TConnector) =>
			(credentials ?? []).filter((credential) => credential.connector_id === connector.id);
		const connected = usable
			.map((connector) => ({ connector, accounts: accountsFor(connector) }))
			.filter((shortcut) => shortcut.accounts.length > 0)
			.sort((a, b) => b.accounts.length - a.accounts.length);
		const featured = usable
			.filter((connector) => connector.is_featured && accountsFor(connector).length === 0)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((connector) => ({ connector, accounts: [] }));
		return [...connected, ...featured].slice(0, MAX_SHORTCUTS);
	}, [credentials, connectors]);
};
