import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TClaimReferralDto,
	TRecordReferralVisitDto,
	TReferralVisitResult,
} from '@/types/referral.type';
import { ReferralEndpoints } from './referrals.endpoints';

export const ReferralService = {
	visit: (payload: TRecordReferralVisitDto) =>
		axiosClient
			.post<TApiResponse<TReferralVisitResult>>(ReferralEndpoints.visit, payload)
			.then(unwrap<TReferralVisitResult>),

	/** After a signup that couldn't carry the code (social login). */
	claim: (payload: TClaimReferralDto) =>
		axiosClient.post(ReferralEndpoints.claim, payload).then(() => undefined),
};
