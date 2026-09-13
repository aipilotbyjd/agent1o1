import { axiosClient } from '@/api/client';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TDashboardOverview,
	TDashboardWindowParams,
	TRunStats,
	TRunStatsParams,
	TCreditUsage,
	TPendingApproval,
} from '@/types/dashboard.type';
import { DashboardEndpoints as E } from './dashboard.endpoints';

export const DashboardService = {
	overview: (ws: string, params?: TDashboardWindowParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TDashboardOverview>>(E.overview(ws), { params, signal })
			.then((r) => r.data.data),

	runStats: (ws: string, params?: TRunStatsParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TRunStats>>(E.runStats(ws), { params, signal })
			.then((r) => r.data.data),

	creditUsage: (ws: string, params?: TDashboardWindowParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCreditUsage>>(E.creditUsage(ws), { params, signal })
			.then((r) => r.data.data),

	// Paginated — `data` sits flat in the envelope, `meta` alongside it.
	pendingApprovals: (
		ws: string,
		params?: { page?: number; per_page?: number },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TPendingApproval[]> & { meta: TPaginationMeta }>(
				E.pendingApprovals(ws),
				{
					params,
					signal,
				},
			)
			.then((r) => ({ approvals: r.data.data, meta: r.data.meta })),
};
