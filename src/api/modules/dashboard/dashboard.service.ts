import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TDashboardOverview,
	TRunStats,
	TCreditUsage,
	TPendingApproval,
	TDashboardWindowParams,
	TRunStatsParams,
	TPendingApprovalParams,
} from '@/types/dashboard.type';
import { DashboardEndpoints as E } from './dashboard.endpoints';

// ============================================================
// Dashboard Service
// ------------------------------------------------------------
// These endpoints answer with `ApiResponse::success([...])`, so the
// payload sits flat in `data` — `unwrap`, not `unwrapKey`. The one
// exception is the approvals queue, which paginates and therefore
// carries `meta` alongside `data`, the same shape `GET /runs` uses.
// ============================================================
export const DashboardService = {
	overview: (ws: string, params?: TDashboardWindowParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TDashboardOverview>>(E.overview(ws), { params, signal })
			.then(unwrap<TDashboardOverview>),

	runStats: (ws: string, params?: TRunStatsParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TRunStats>>(E.runStats(ws), { params, signal })
			.then(unwrap<TRunStats>),

	creditUsage: (ws: string, params?: TDashboardWindowParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCreditUsage>>(E.creditUsage(ws), { params, signal })
			.then(unwrap<TCreditUsage>),

	pendingApprovals: (ws: string, params?: TPendingApprovalParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TPendingApproval[]> & { meta: TPaginationMeta }>(
				E.pendingApprovals(ws),
				{ params, signal },
			)
			.then((r) => ({ approvals: r.data.data, meta: r.data.meta })),
};
