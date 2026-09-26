export const HISTORY_LIMIT = 40;
export const AUTOSAVE_DEBOUNCE_MS = 700;

export const CATEGORY_META = {
	trigger: { label: 'Triggers', order: 0, color: 'amber' },
	input: { label: 'Inputs', order: 1, color: 'sky' },
	ai: { label: 'AI', order: 2, color: 'violet' },
	scrape: { label: 'Scrape', order: 3, color: 'emerald' },
	extract: { label: 'Extract', order: 4, color: 'fuchsia' },
	data: { label: 'Data', order: 5, color: 'amber' },
	storage: { label: 'Storage', order: 5.5, color: 'cyan' },
	logic: { label: 'Logic', order: 6, color: 'rose' },
	loop: { label: 'Loop', order: 7, color: 'indigo' },
	integration: { label: 'Integrations', order: 8, color: 'cyan' },
	output: { label: 'Outputs', order: 9, color: 'green' },
	note: { label: 'Notes', order: 10, color: 'zinc' },
	utility: { label: 'Utilities', order: 11, color: 'zinc' },
} as const;

export const HUE_TO_CLASSES: Record<
	string,
	{
		bg: string;
		text: string;
		border: string;
		darkBg: string;
		darkText: string;
		darkBorder: string;
	}
> = {
	sky: {
		bg: 'bg-sky-50',
		text: 'text-sky-700',
		border: 'border-sky-300',
		darkBg: 'dark:bg-sky-950/50',
		darkText: 'dark:text-sky-300',
		darkBorder: 'dark:border-sky-700',
	},
	violet: {
		bg: 'bg-primary-50',
		text: 'text-primary-700',
		border: 'border-primary-300',
		darkBg: 'dark:bg-primary-950/50',
		darkText: 'dark:text-primary-300',
		darkBorder: 'dark:border-primary-700',
	},
	emerald: {
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		border: 'border-emerald-300',
		darkBg: 'dark:bg-emerald-950/50',
		darkText: 'dark:text-emerald-300',
		darkBorder: 'dark:border-emerald-700',
	},
	fuchsia: {
		bg: 'bg-fuchsia-50',
		text: 'text-fuchsia-700',
		border: 'border-fuchsia-300',
		darkBg: 'dark:bg-fuchsia-950/50',
		darkText: 'dark:text-fuchsia-300',
		darkBorder: 'dark:border-fuchsia-700',
	},
	amber: {
		bg: 'bg-amber-50',
		text: 'text-amber-700',
		border: 'border-amber-300',
		darkBg: 'dark:bg-amber-950/50',
		darkText: 'dark:text-amber-300',
		darkBorder: 'dark:border-amber-700',
	},
	rose: {
		bg: 'bg-rose-50',
		text: 'text-rose-700',
		border: 'border-rose-300',
		darkBg: 'dark:bg-rose-950/50',
		darkText: 'dark:text-rose-300',
		darkBorder: 'dark:border-rose-700',
	},
	indigo: {
		bg: 'bg-primary-50',
		text: 'text-primary-700',
		border: 'border-primary-300',
		darkBg: 'dark:bg-primary-950/50',
		darkText: 'dark:text-primary-300',
		darkBorder: 'dark:border-primary-700',
	},
	cyan: {
		bg: 'bg-cyan-50',
		text: 'text-cyan-700',
		border: 'border-cyan-300',
		darkBg: 'dark:bg-cyan-950/50',
		darkText: 'dark:text-cyan-300',
		darkBorder: 'dark:border-cyan-700',
	},
	green: {
		bg: 'bg-green-50',
		text: 'text-green-700',
		border: 'border-green-300',
		darkBg: 'dark:bg-green-950/50',
		darkText: 'dark:text-green-300',
		darkBorder: 'dark:border-green-700',
	},
	zinc: {
		bg: 'bg-zinc-50',
		text: 'text-zinc-700',
		border: 'border-zinc-300',
		darkBg: 'dark:bg-zinc-900/50',
		darkText: 'dark:text-zinc-300',
		darkBorder: 'dark:border-zinc-700',
	},
};

export const PORT_TYPE_COLOR: Record<string, string> = {
	string: '#0ea5e9',
	number: '#f59e0b',
	boolean: '#f43f5e',
	list: '#8b5cf6',
	file: '#10b981',
	json: '#d946ef',
	any: '#71717a',
};

/**
 * Placeholder per-category credit estimates — there's no real per-node pricing
 * data from the backend yet, so this is a rough stand-in (AI/scrape/extract cost
 * more than simple logic/utility nodes) until real numbers are wired in.
 * A node definition's own `creditCost` always wins over this default.
 */
export const CATEGORY_CREDIT_COST: Partial<Record<string, number>> = {
	ai: 5,
	scrape: 3,
	extract: 3,
	'http-apis': 2,
	integration: 2,
	data: 2,
	storage: 2,
	communication: 2,
	loop: 1,
	logic: 1,
	'flow-control': 1,
	trigger: 1,
	input: 1,
	output: 1,
	utility: 1,
	debug: 0,
	note: 0,
};

const DEFAULT_CREDIT_COST = 1;

/** Estimated credits this node charges per run — its own value, or the category default. */
export const getNodeCreditCost = (def?: { category?: string; creditCost?: number }): number =>
	def?.creditCost ?? CATEGORY_CREDIT_COST[def?.category ?? ''] ?? DEFAULT_CREDIT_COST;
