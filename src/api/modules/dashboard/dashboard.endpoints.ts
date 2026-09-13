// ============================================================
// Dashboard Endpoints
// ------------------------------------------------------------
// `overview` is the whole home screen in one read; the three
// drill-downs return the same numbers with the detail a chart
// needs. All four are workspace-scoped and window-aware.
// ============================================================
export const DashboardEndpoints = {
	overview: (ws: string) => `/workspaces/${ws}/dashboard`,
	runStats: (ws: string) => `/workspaces/${ws}/dashboard/run-stats`,
	creditUsage: (ws: string) => `/workspaces/${ws}/dashboard/credit-usage`,
	pendingApprovals: (ws: string) => `/workspaces/${ws}/dashboard/pending-approvals`,
} as const;
