import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { ReferralService } from '@/api/modules/referrals';
import { ApiError } from '@/api/core';
import {
	clearReferralAttribution,
	getReferralAttribution,
	saveReferralAttribution,
} from '@/utils/referralAttribution.util';

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

/**
 * Picks up `?ref=CODE` on any route, records the visit, and remembers the
 * code for signup. An unknown or switched-off code clears what was stored,
 * so a dead link never gets sent at signup. Runs once per code per page
 * load — StrictMode's double effect and re-renders don't double-count.
 */
const useReferralCapture = () => {
	const location = useLocation();
	const recorded = useRef<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const code = params.get('ref')?.trim();

		if (!code || recorded.current === code) return;
		recorded.current = code;

		const utm = Object.fromEntries(
			UTM_KEYS.flatMap((key) => {
				const value = params.get(`utm_${key}`);
				return value ? [[key, value]] : [];
			}),
		);

		const previous = getReferralAttribution();

		ReferralService.recordVisit({
			code,
			visitor_id: previous?.visitor_id,
			landing_url: window.location.href,
			referrer_url: document.referrer || undefined,
			utm: Object.keys(utm).length ? utm : undefined,
		})
			.then((result) => saveReferralAttribution(result.code, result.visitor_id))
			.catch((error: unknown) => {
				if (ApiError.is(error) && error.status === 404) clearReferralAttribution();
			});
	}, [location.search]);
};

export default useReferralCapture;
