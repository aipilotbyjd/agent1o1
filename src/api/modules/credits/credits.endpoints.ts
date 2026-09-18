export const CreditEndpoints = {
	balance: (ws: string) => `/workspaces/${ws}/credits/balance`,
	transactions: (ws: string) => `/workspaces/${ws}/credits/transactions`,
	packs: (ws: string) => `/workspaces/${ws}/credits/packs`,
} as const;
