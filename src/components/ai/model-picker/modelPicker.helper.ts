import type { TModelCatalogEntry, TModelSpeed } from '@/types/catalog.type';
import pages from '@/Routes/pages';
import { buildPath } from '@/Routes/paths';

export type TModelFilter =
	| 'own_key'
	| 'available'
	| 'vision'
	| 'tools'
	| 'long_context'
	| 'fast'
	| 'low_cost';

export type TModelRequirements = {
	/** How many tools the thing being configured uses: a model without tool use can't call them. */
	tools?: number;
	/** Whether it needs to read images. */
	vision?: boolean;
};

export const LONG_CONTEXT_TOKENS = 500_000;

export const filterLabels: Record<TModelFilter, string> = {
	available: 'Available',
	own_key: 'Your key',
	tools: 'Tools',
	vision: 'Vision',
	long_context: 'Long context',
	fast: 'Fast',
	low_cost: 'Low cost',
};

const brandLabels: Record<string, string> = {
	anthropic: 'Anthropic',
	openai: 'OpenAI',
	google: 'Google',
	xai: 'xAI',
	mistral: 'Mistral',
	deepseek: 'DeepSeek',
	meta: 'Meta',
	moonshot: 'Moonshot',
	zhipu: 'Zhipu',
	minimax: 'MiniMax',
	alibaba: 'Alibaba',
	nvidia: 'NVIDIA',
};

export const brandLabel = (brand: string) =>
	brandLabels[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);

export const speedLabels: Record<TModelSpeed, string> = {
	fast: 'Fast',
	balanced: 'Balanced',
	thorough: 'Thorough',
};

export const costTierLabel = (tier: number | null) => (tier ? '$'.repeat(tier) : null);

export const formatContext = (tokens?: number) => {
	if (!tokens) return null;
	if (tokens >= 1_000_000) return `${+(tokens / 1_000_000).toFixed(1)}M`;
	return `${Math.round(tokens / 1000)}K`;
};

export const matchesFilter = (model: TModelCatalogEntry, filter: TModelFilter) => {
	switch (filter) {
		case 'available':
			return model.is_available;
		case 'own_key':
			return !!model.own_key;
		case 'tools':
			return !!model.capabilities?.tool_use;
		case 'vision':
			return !!model.capabilities?.vision;
		case 'long_context':
			return (model.capabilities?.context_window ?? 0) >= LONG_CONTEXT_TOKENS;
		case 'fast':
			return model.speed === 'fast';
		case 'low_cost':
			return model.cost_tier === 1 || !!model.own_key;
	}
};

export const matchesSearch = (model: TModelCatalogEntry, query: string) => {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return [
		model.display_name,
		model.slug,
		brandLabel(model.brand),
		model.description ?? '',
		model.speed ? speedLabels[model.speed] : '',
		model.own_key ? 'your key own key' : '',
		model.capabilities?.vision ? 'vision images' : '',
		model.capabilities?.tool_use ? 'tools' : '',
		...model.strengths,
	]
		.join(' ')
		.toLowerCase()
		.includes(q);
};

/** What the model lacks that the thing being configured needs. */
export const missingRequirements = (
	model: TModelCatalogEntry,
	requirements?: TModelRequirements,
): string[] => {
	if (!requirements) return [];
	const missing: string[] = [];
	if ((requirements.tools ?? 0) > 0 && !model.capabilities?.tool_use) missing.push('tools');
	if (requirements.vision && !model.capabilities?.vision) missing.push('images');
	return missing;
};

export const isRecommended = (model: TModelCatalogEntry, requirements?: TModelRequirements) =>
	!!requirements &&
	((requirements.tools ?? 0) > 0 || !!requirements.vision) &&
	model.is_available &&
	missingRequirements(model, requirements).length === 0;

/** "a Mistral key", "an OpenRouter key". */
const aKeyFor = (labels: string) => `${/^[AEIOU]/i.test(labels) ? 'an' : 'a'} ${labels} key`;

export const unavailableText = (model: TModelCatalogEntry): string | null => {
	const providers = aKeyFor(model.connect_providers.map((p) => p.label).join(' or '));
	switch (model.unavailable_reason) {
		case 'not_allowed':
			return 'Not allowed in this workspace';
		case 'needs_key':
			return `Needs ${providers}`;
		case 'policy_needs_key':
			return `Workspace uses only its own keys: needs ${providers}`;
		case 'unavailable':
			return 'Not available right now';
		default:
			return null;
	}
};

export const connectProviderPath = (ws: string, provider: string) =>
	`${buildPath(pages.settings.subPages!.aiProviders.to, { workspaceId: ws })}?connect=${encodeURIComponent(provider)}`;

export const isRetiring = (model: TModelCatalogEntry) => !!model.retires_at;

export const MAX_COMPARE = 3;
