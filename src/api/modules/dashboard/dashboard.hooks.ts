import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type {
	TDashboardWindowParams,
	TRunStatsParams,
	TPendingApprovalParams,
} from '@/types/dashboard.type';
import { DashboardService } from './dashboard.service';
import { dashboardKeys } from './dashboard.keys';

// ============================================================
// Dashboard Hooks
// ------------------------------------------------------------
// The overview polls: `in_flight` and `pending_approvals` are
// current-state, so a dashboard left open would otherwise sit on
// a stale count of running work. The interval pauses while the
// tab is unfocused (react-query's default), so an abandoned tab
// costs nothing.
//
// `keepPreviousData` on the window-scoped reads is what makes the
// 7d/30d/90d switch feel instant — the old window stays on screen
// while the new one loads instead of the page blanking.
// ============================================================

export const useDashboardOverview = (ws: string, params?: TDashboardWindowParams) =>
	useQuery({
		queryKey: dashboardKeys.overview(ws, params),
		queryFn: ({ signal }) => DashboardService.overview(ws, params, signal),
		enabled: !!ws,
		staleTime: 60_000,
		refetchInterval: 60_000,
		placeholderData: keepPreviousData,
	});

export const useRunStats = (ws: string, params?: TRunStatsParams) =>
	useQuery({
		queryKey: dashboardKeys.runStats(ws, params),
		queryFn: ({ signal }) => DashboardService.runStats(ws, params, signal),
		enabled: !!ws,
		staleTime: 60_000,
		placeholderData: keepPreviousData,
	});

/** Requires `BillingView`. The overview's `credits` block degrades to null
 *  for a viewer without it, but this endpoint 403s — gate the call rather
 *  than letting the cache-level error toast fire on every dashboard load. */
export const useCreditUsage = (
	ws: string,
	params?: TDashboardWindowParams,
	options?: { enabled?: boolean },
) =>
	useQuery({
		queryKey: dashboardKeys.creditUsage(ws, params),
		queryFn: ({ signal }) => DashboardService.creditUsage(ws, params, signal),
		enabled: !!ws && (options?.enabled ?? true),
		staleTime: 60_000,
		placeholderData: keepPreviousData,
	});

export const usePendingApprovals = (ws: string, params?: TPendingApprovalParams) =>
	useQuery({
		queryKey: dashboardKeys.pendingApprovals(ws, params),
		queryFn: ({ signal }) => DashboardService.pendingApprovals(ws, params, signal),
		enabled: !!ws,
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
