import { useCallback } from 'react';
import { useConnectorCredentials } from '@/api/modules/connectors';
import { useCurrentUser } from '@/api/modules/user';
import type { TConnectorCredential } from '@/types/connector.type';
import type { TNodeDefinition } from '../_types/node.type';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';

const preferredOf = (candidates: TConnectorCredential[]) =>
	candidates.find((credential) => credential.is_default) ??
	(candidates.length === 1 ? candidates[0] : undefined);

/**
 * The account a node will actually run with, mirroring the backend's
 * `ConnectorCredentialResolver`: a pinned `credential_id` when it is still
 * usable, else the member's personal default (or sole personal account), else
 * the workspace's team default (or sole team account).
 */
export const useCredentialResolver = () => {
	const { state } = useWorkflowEditor();
	const { data: credentials } = useConnectorCredentials(state.workflow.workspaceId ?? '');
	const { data: user } = useCurrentUser();
	const userId = user?.id;

	const resolve = useCallback(
		(def: TNodeDefinition | undefined, values: Record<string, unknown>) => {
			const field = def?.fields.find((item) => item.kind === 'credential');
			if (!field?.credentialType) return undefined;
			const usable = (credentials ?? []).filter(
				(credential) =>
					credential.connector?.key === field.credentialType &&
					(credential.scope === 'team' || credential.created_by === userId),
			);
			const pinned = values[field.key];
			if (typeof pinned === 'string' && pinned !== '') {
				return usable.find((credential) => credential.id === pinned);
			}
			return (
				preferredOf(usable.filter((credential) => credential.scope === 'personal')) ??
				preferredOf(usable.filter((credential) => credential.scope === 'team'))
			);
		},
		[credentials, userId],
	);

	const isMissing = useCallback(
		(def: TNodeDefinition | undefined, values: Record<string, unknown>) =>
			credentials !== undefined && Boolean(def?.requiresCredential) && !resolve(def, values),
		[credentials, resolve],
	);

	return { resolve, isMissing };
};
