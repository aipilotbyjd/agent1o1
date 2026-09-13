import type {
	TDashboardWindowParams,
	TRunStatsParams,
	TPendingApprovalParams,
} from '@/types/dashboard.type';

// ============================================================
// Dashboard Query Keys
// ------------------------------------------------------------
// Params are part of the key because the window is a filter, not
// a refetch: switching 30d → 7d should show the cached 7d answer
// instantly and revalidate, not blank the screen.
// ============================================================
export const dashboardKeys = {
	all: (ws: string) => ['dashboard', ws] as const,
	overview: (ws: string, params?: TDashboardWindowParams) =>
		['dashboard', ws, 'overview', params ?? {}] as const,
	runStats: (ws: string, params?: TRunStatsParams) =>
		['dashboard', ws, 'run-stats', params ?? {}] as const,
	creditUsage: (ws: string, params?: TDashboardWindowParams) =>
		['dashboard', ws, 'credit-usage', params ?? {}] as const,
	pendingApprovals: (ws: string, params?: TPendingApprovalParams) =>
		['dashboard', ws, 'pending-approvals', params ?? {}] as const,
};
