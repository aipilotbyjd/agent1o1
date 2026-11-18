import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	TDashboardOverview,
	TDashboardWindowParams,
	TGettingStartedMilestoneKey,
	TRunStatsParams,
} from '@/types/dashboard.type';
import { notify } from '@/api/core';
import { billingKeys } from '@/api/modules/billing/billing.keys';
import { DashboardService } from './dashboard.service';
import { dashboardKeys } from './dashboard.keys';

export const useDashboardOverview = (ws: string, params?: TDashboardWindowParams) =>
	useQuery({
		queryKey: dashboardKeys.overview(ws, params),
		queryFn: ({ signal }) => DashboardService.overview(ws, params, signal),
		enabled: !!ws,
	});

export const useRunStats = (ws: string, params?: TRunStatsParams) =>
	useQuery({
		queryKey: dashboardKeys.runStats(ws, params),
		queryFn: ({ signal }) => DashboardService.runStats(ws, params, signal),
		enabled: !!ws,
	});

export const useCreditUsage = (ws: string, params?: TDashboardWindowParams) =>
	useQuery({
		queryKey: dashboardKeys.creditUsage(ws, params),
		queryFn: ({ signal }) => DashboardService.creditUsage(ws, params, signal),
		enabled: !!ws,
	});

export const usePendingApprovals = (ws: string, params?: { page?: number; per_page?: number }) =>
	useQuery({
		queryKey: dashboardKeys.pendingApprovals(ws, params),
		queryFn: ({ signal }) => DashboardService.pendingApprovals(ws, params, signal),
		enabled: !!ws,
	});

/**
 * Hides the getting-started checklist for the viewer. The cached overviews
 * are patched in place (every `days` window carries the same flag) so the card
 * leaves at once instead of after a refetch.
 */
export const useDismissGettingStarted = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => DashboardService.dismissGettingStarted(ws),
		onSuccess: () =>
			qc.setQueriesData<TDashboardOverview>(
				{ queryKey: dashboardKeys.overviews(ws) },
				(overview) =>
					overview?.getting_started
						? {
								...overview,
								getting_started: { ...overview.getting_started, dismissed: true },
							}
						: overview,
			),
		meta: { errorMessage: 'Failed to dismiss the checklist' },
	});
};

/** Claims a milestone's credits; the checklist and the credit balance update in place. */
export const useClaimGettingStartedReward = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (milestone: TGettingStartedMilestoneKey) =>
			DashboardService.claimGettingStartedReward(ws, milestone),
		onSuccess: ({ credits, getting_started }) => {
			qc.setQueriesData<TDashboardOverview>(
				{ queryKey: dashboardKeys.overviews(ws) },
				(overview) => (overview ? { ...overview, getting_started } : overview),
			);
			qc.invalidateQueries({ queryKey: billingKeys.all(ws) });
			notify.success(`${credits} credits added to your workspace.`);
		},
		meta: { errorMessage: 'Could not claim the reward' },
	});
};
