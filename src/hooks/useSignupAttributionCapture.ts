import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { captureSignupAttribution } from '@/utils/signupAttribution.util';

/**
 * Keeps where a visitor first came from until they sign up: see
 * `signupAttribution.util`. Runs on every route; only the first visit
 * that carries campaign tags, a referrer or a template is kept.
 */
const useSignupAttributionCapture = () => {
	const location = useLocation();

	useEffect(() => {
		captureSignupAttribution(location.search, location.pathname);
	}, [location.search, location.pathname]);
};

export default useSignupAttributionCapture;
