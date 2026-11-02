import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { ReferralService } from '@/api/modules/referrals';
import { ApiError } from '@/api/core';
import {
	clearStoredReferral,
	getStoredReferral,
	readReferralParams,
	storeReferral,
} from '@/utils/referral.util';

/**
 * Records a landing on any `?ref=` URL and keeps the code for signup.
 * A code the API rejects (unknown, expired, used up) is dropped; a
 * network failure keeps the code without a visitor id, which signup
 * can still send.
 */
const useReferralCapture = () => {
	const { search } = useLocation();

	useEffect(() => {
		const params = readReferralParams(search);
		if (!params) return;

		const stored = getStoredReferral();
		if (stored?.code === params.code && stored.visitor_id) return;

		ReferralService.visit({
			code: params.code,
			visitor_id: stored?.visitor_id ?? null,
			landing_url: window.location.href.slice(0, 2048),
			referrer_url: document.referrer ? document.referrer.slice(0, 2048) : null,
			utm: params.utm,
		})
			.then((visit) => storeReferral(visit.code, visit.visitor_id))
			.catch((error: unknown) => {
				if (ApiError.is(error) && error.status === 404) {
					clearStoredReferral();
					return;
				}
				storeReferral(params.code, null);
			});
	}, [search]);
};

export default useReferralCapture;
