import type { TConnectorCredential, TConnectorCredentialUsage } from '@/types/connector.type';
import type { IConnectedApp } from '../_types/apps.type';

/** Manual keys with an end date start warning this far ahead. */
const EXPIRY_WARNING_DAYS = 7;

const DAY_MS = 86_400_000;

export const formatRelativeTime = (iso: string) => {
	const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
	if (Math.abs(seconds) < 60) return 'just now';
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31536000],
		['month', 2592000],
		['week', 604800],
		['day', 86400],
		['hour', 3600],
		['minute', 60],
	];
	const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
	const [unit, size] = units.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds)!;
	return formatter.format(-Math.trunc(seconds / size), unit);
};

export type TCredentialAttention = {
	level: 'expired' | 'expiring';
	label: string;
};

/**
 * `is_expired` already means "can't be used, even after a refresh". An OAuth
 * `expires_at` is only the access token's, which renews itself, so the
 * early warning applies to manually entered keys alone.
 */
export const getCredentialAttention = (
	credential: TConnectorCredential,
	isOAuth: boolean,
): TCredentialAttention | null => {
	if (credential.is_expired) return { level: 'expired', label: 'Expired' };
	if (isOAuth || !credential.expires_at) return null;

	const msLeft = new Date(credential.expires_at).getTime() - Date.now();
	if (msLeft > EXPIRY_WARNING_DAYS * DAY_MS) return null;

	const daysLeft = Math.ceil(msLeft / DAY_MS);
	return {
		level: 'expiring',
		label: daysLeft <= 1 ? 'Expires within a day' : `Expires in ${daysLeft} days`,
	};
};

/** "Used by 2 workflows and 1 agent" — for the disconnect confirmation too. */
export const describeUsage = (usage: TConnectorCredentialUsage) => {
	const parts = [
		[usage.workflows.length, 'workflow', 'workflows'],
		[usage.agents.length, 'agent', 'agents'],
		[usage.knowledge_sources.length, 'knowledge source', 'knowledge sources'],
	] as const;
	const named = parts
		.filter(([count]) => count > 0)
		.map(([count, one, many]) => `${count} ${count === 1 ? one : many}`);
	if (named.length <= 1) return named.join('');
	return `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`;
};

export type TAttentionItem = {
	app: IConnectedApp;
	credential: TConnectorCredential;
	attention: TCredentialAttention;
};

export const collectAttentionItems = (apps: IConnectedApp[]): TAttentionItem[] =>
	apps
		.flatMap((app) =>
			app.credentials.map((credential) => ({
				app,
				credential,
				attention: getCredentialAttention(credential, app.isOAuth),
			})),
		)
		.filter((item): item is TAttentionItem => item.attention !== null)
		.sort(
			(a, b) =>
				Number(b.attention.level === 'expired') - Number(a.attention.level === 'expired'),
		);
