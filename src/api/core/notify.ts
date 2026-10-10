import { createElement } from 'react';
import { toast } from 'react-toastify';
import { ApiError } from './errors';

// ============================================================
// Notify
// ------------------------------------------------------------
// The only place in the API layer that imports `react-toastify`
// directly. Interceptors and services never call this — display is
// owned by `query-client.ts` via `meta.errorMessage` / `meta.silent`.
// ============================================================

type TNotifyAction = { label: string; onClick: () => void };

type TNotifyAdapter = {
	success: (msg: string) => void;
	error: (msg: string) => void;
	info: (msg: string) => void;
	warn: (msg: string) => void;
	/** A message with one button — e.g. "Key removed · Undo". */
	withAction: (msg: string, action: TNotifyAction) => void;
};

/** Long enough to read the message and reach the button. */
const ACTION_TOAST_MS = 10_000;

const actionToast = (msg: string, action: TNotifyAction) =>
	toast.info(
		({ closeToast }) =>
			createElement(
				'div',
				{ className: 'flex items-center justify-between gap-3' },
				createElement('span', null, msg),
				createElement(
					'button',
					{
						type: 'button',
						className: 'shrink-0 text-sm font-bold underline underline-offset-2',
						onClick: () => {
							action.onClick();
							closeToast();
						},
					},
					action.label,
				),
			),
		{ autoClose: ACTION_TOAST_MS },
	);

const toastAdapter: TNotifyAdapter = {
	success: (msg) => toast.success(msg),
	error: (msg) => toast.error(msg),
	info: (msg) => toast.info(msg),
	warn: (msg) => toast.warn(msg),
	withAction: actionToast,
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

export const notify: TNotifyAdapter & {
	fromError: (fallback: string) => (error: unknown) => void;
} = {
	success: (msg) => adapter.success(msg),
	error: (msg) => adapter.error(msg),
	info: (msg) => adapter.info(msg),
	warn: (msg) => adapter.warn(msg),
	withAction: (msg, action) => adapter.withAction(msg, action),
	fromError: (fallback) => (error) => adapter.error(messageFromError(error, fallback)),
};

export const messageFromError = (error: unknown, fallback: string): string =>
	ApiError.is(error) ? error.message : fallback;
