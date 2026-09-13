const base = (ws: string) => `/workspaces/${ws}/dashboard`;

export const DashboardEndpoints = {
	overview: (ws: string) => base(ws),
	runStats: (ws: string) => `${base(ws)}/run-stats`,
	creditUsage: (ws: string) => `${base(ws)}/credit-usage`,
	pendingApprovals: (ws: string) => `${base(ws)}/pending-approvals`,
} as const;
