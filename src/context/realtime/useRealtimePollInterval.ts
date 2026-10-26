import { useRealtime } from './useRealtime';

const LIVE_POLL_FACTOR = 5;

/**
 * The poll interval for a query that live events also refresh: stretched while
 * the socket is up, as a safety net, and as given once it is not.
 */
export const useRealtimePollInterval = (intervalMs: number) => {
	const { status } = useRealtime();

	return status === 'connected' ? intervalMs * LIVE_POLL_FACTOR : intervalMs;
};
