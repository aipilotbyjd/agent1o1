export const planKeys = {
	all: () => ['plans'] as const,
	list: () => ['plans', 'list'] as const,
	subscription: (ws: string) => ['plans', 'subscription', ws] as const,
	usageSnapshots: (ws: string, params?: Record<string, string>) =>
		['plans', 'usage-snapshots', ws, params] as const,
};
