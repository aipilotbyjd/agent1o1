import type { TDashboardWindowParams, TRunStatsParams } from '@/types/dashboard.type';

export const dashboardKeys = {
	overview: (ws: string, params?: TDashboardWindowParams) =>
		['dashboard', ws, 'overview', params ?? {}] as const,
	runStats: (ws: string, params?: TRunStatsParams) =>
		['dashboard', ws, 'run-stats', params ?? {}] as const,
	creditUsage: (ws: string, params?: TDashboardWindowParams) =>
		['dashboard', ws, 'credit-usage', params ?? {}] as const,
	pendingApprovals: (ws: string, params?: { page?: number; per_page?: number }) =>
		['dashboard', ws, 'pending-approvals', params ?? {}] as const,
};
