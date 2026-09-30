import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TClaimReferralDto,
	TClaimReferralResult,
	TRecordReferralVisitDto,
	TReferralProfile,
	TReferralProgramTerms,
	TReferralReward,
	TReferralStats,
	TReferralVisitResult,
	TReferredUser,
	TUpdateReferralProfileDto,
} from '@/types/referral.type';
import { ReferralEndpoints as E } from './referrals.endpoints';

type TPageParams = { page?: number; per_page?: number };

export const ReferralService = {
	/** Public — called when someone lands on a `?ref=` link, before they have an account. */
	recordVisit: (payload: TRecordReferralVisitDto) =>
		axiosClient
			.post<TApiResponse<TReferralVisitResult>>(E.visit, payload)
			.then(unwrap<TReferralVisitResult>),

	/** Links a fresh social signup to the referrer whose link it arrived through. */
	claim: (payload: TClaimReferralDto) =>
		axiosClient
			.post<TApiResponse<TClaimReferralResult>>(E.claim, payload)
			.then(unwrap<TClaimReferralResult>),

	me: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TReferralProfile>>(E.me, { signal })
			.then(unwrap<TReferralProfile>),

	updateMe: (payload: TUpdateReferralProfileDto) =>
		axiosClient
			.patch<TApiResponse<TReferralProfile>>(E.me, payload)
			.then(unwrap<TReferralProfile>),

	program: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TReferralProgramTerms>>(E.program, { signal })
			.then(unwrap<TReferralProgramTerms>),

	stats: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TReferralStats>>(E.stats, { signal })
			.then(unwrap<TReferralStats>),

	list: (params?: TPageParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TReferredUser[]> & { meta: TPaginationMeta }>(E.list, {
				params,
				signal,
			})
			.then((r) => ({ referrals: r.data.data, meta: r.data.meta })),

	rewards: (params?: TPageParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TReferralReward[]> & { meta: TPaginationMeta }>(E.rewards, {
				params,
				signal,
			})
			.then((r) => ({ rewards: r.data.data, meta: r.data.meta })),
};
