export const billingKeys = {
	overview: (ws: string) => ['billing', ws, 'overview'] as const,
	plans: (ws: string) => ['billing', ws, 'plans'] as const,
	subscription: (ws: string) => ['billing', ws, 'subscription'] as const,
	subscriptionPreview: (ws: string, planId: string, interval: string) =>
		['billing', ws, 'subscription', 'preview', planId, interval] as const,
	creditPacks: (ws: string) => ['billing', ws, 'credit-packs'] as const,
	creditPacksPurchased: (ws: string) => ['billing', ws, 'credit-packs', 'purchased'] as const,
	credits: (ws: string, params?: { page?: number; per_page?: number }) =>
		['billing', ws, 'credits', params ?? {}] as const,
	invoices: (ws: string, params?: { per_page?: number; cursor?: string }) =>
		['billing', ws, 'invoices', params ?? {}] as const,
	invoicesUpcoming: (ws: string) => ['billing', ws, 'invoices', 'upcoming'] as const,
	invoice: (ws: string, invoiceId: string) => ['billing', ws, 'invoices', invoiceId] as const,
};
