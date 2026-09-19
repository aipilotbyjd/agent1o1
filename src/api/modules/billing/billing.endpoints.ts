const base = (ws: string) => `/workspaces/${ws}/billing`;

export const BillingEndpoints = {
	overview: (ws: string) => base(ws),
	plans: (ws: string) => `${base(ws)}/plans`,

	subscription: (ws: string) => `${base(ws)}/subscription`,
	subscriptionCheckout: (ws: string) => `${base(ws)}/subscription/checkout`,
	subscriptionPreview: (ws: string) => `${base(ws)}/subscription/preview`,
	subscriptionCancel: (ws: string) => `${base(ws)}/subscription/cancel`,
	subscriptionResume: (ws: string) => `${base(ws)}/subscription/resume`,

	creditPacks: (ws: string) => `${base(ws)}/credit-packs`,
	creditPacksPurchased: (ws: string) => `${base(ws)}/credit-packs/purchased`,
	creditPacksCheckout: (ws: string) => `${base(ws)}/credit-packs/checkout`,

	credits: (ws: string) => `${base(ws)}/credits`,

	overage: (ws: string) => `${base(ws)}/overage`,
	creditNotifications: (ws: string) => `${base(ws)}/credit-notifications`,

	invoices: (ws: string) => `${base(ws)}/invoices`,
	invoicesUpcoming: (ws: string) => `${base(ws)}/invoices/upcoming`,
	invoice: (ws: string, invoiceId: string) => `${base(ws)}/invoices/${invoiceId}`,

	portal: (ws: string) => `${base(ws)}/portal`,

	// ── Ported from the old frontend ──────────────────────────
	// Old paths, kept as-is. `subscriptionPortal` is the old
	// `portal` entry, renamed only because `portal` above already
	// owns that key on the new contract.
	packCatalog: (ws: string) => `/workspaces/${ws}/billing/packs`,
	buyCredits: (ws: string) => `/workspaces/${ws}/billing/packs`,
	subscriptionPortal: (ws: string) => `/workspaces/${ws}/subscription/portal`,
} as const;
