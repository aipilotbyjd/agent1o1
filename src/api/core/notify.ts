import { toast } from 'react-toastify';
import { ApiError } from './errors';

// ============================================================
// Notify
// ------------------------------------------------------------
// The only place in the API layer that imports `react-toastify`
// directly. Interceptors and services never call this — display is
// owned by `query-client.ts` via `meta.errorMessage` / `meta.silent`.
// ============================================================

type TNotifyAdapter = {
	success: (msg: string) => void;
	error: (msg: string) => void;
	info: (msg: string) => void;
	warn: (msg: string) => void;
};

const toastAdapter: TNotifyAdapter = {
	success: (msg) => toast.success(msg),
	error: (msg) => toast.error(msg),
	info: (msg) => toast.info(msg),
	warn: (msg) => toast.warn(msg),
};

let adapter: TNotifyAdapter = toastAdapter;

/**
 * Lets a screen with its own notification surface swap the display
 * mechanism without the API layer knowing routes exist. Call the
 * returned function to restore the default toast adapter.
 */
export const setNotifyAdapter = (next: TNotifyAdapter) => {
	adapter = next;
	return () => {
		adapter = toastAdapter;
	};
};

export const notify: TNotifyAdapter = {
	success: (msg) => adapter.success(msg),
	error: (msg) => adapter.error(msg),
	info: (msg) => adapter.info(msg),
	warn: (msg) => adapter.warn(msg),
};

export const messageFromError = (error: unknown, fallback: string): string =>
	ApiError.is(error) ? error.message : fallback;
