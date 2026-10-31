import type { TConnector, TConnectorCredential } from '@/types/connector.type';
import type { TBuilderMessageContext } from '@/types/workflow-builder.type';
import type { TNodeDefinition } from '../_types/node.type';

export type TPromptMentionTrigger = 'slash' | 'at';

/** What a chip in the prompt stands for: sent along so the builder gets ids, not prose. */
export type TPromptMention =
	| { kind: 'node'; token: string; key: string }
	| { kind: 'credential'; token: string; id: string };

export type TPromptMentionItem =
	| { kind: 'node'; id: string; node: TNodeDefinition }
	| { kind: 'credential'; id: string; credential: TConnectorCredential; connector?: TConnector }
	| { kind: 'connect'; id: string; connector: TConnector };

export const nodeMentionToken = (node: TNodeDefinition) => `[${node.label}]`;

export const credentialMentionToken = (
	credential: TConnectorCredential,
	connector?: TConnector,
) => {
	const app = connector?.name;
	if (!app || credential.name === app) return `@${credential.name}`;
	return `@${app} (${credential.name})`;
};

/** The picked steps and accounts, as the builder message's `context`. */
export const mentionContext = (mentions: TPromptMention[]): TBuilderMessageContext | undefined => {
	const nodes = [
		...new Set(mentions.flatMap((mention) => (mention.kind === 'node' ? [mention.key] : []))),
	];
	const credentials = [
		...new Set(
			mentions.flatMap((mention) => (mention.kind === 'credential' ? [mention.id] : [])),
		),
	];
	if (!nodes.length && !credentials.length) return undefined;
	return {
		...(nodes.length ? { nodes } : {}),
		...(credentials.length ? { credentials } : {}),
	};
};

// A query has no spaces (it ends at one), so "sendemail" should still find "Gmail: Send Email".
const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const matchesMentionQuery = (query: string, ...values: (string | null | undefined)[]) => {
	const needle = squash(query);
	return !needle || values.some((value) => value != null && squash(value).includes(needle));
};

// Brand colours like GitHub's near-black vanish on a dark prompt: those use the toolbar's grey.
export const readableColor = (hex: string) => {
	const value = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
	if (Number.isNaN(value)) return undefined;
	const luminance =
		(0.299 * ((value >> 16) & 255) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) /
		255;
	return luminance < 0.25 ? undefined : hex;
};
