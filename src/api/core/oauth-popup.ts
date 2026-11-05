import { ApiError } from './errors';

// ============================================================
// OAuth popup driver
// ------------------------------------------------------------
// Shared by every "sign in at the provider" flow (app connectors, one-click
// AI provider connect). The consent screen opens in a popup that ends on one
// of our own completion pages; that page finishes the exchange with the
// backend and posts the outcome back here over `postMessage`.
// ============================================================

const OAUTH_POPUP_FEATURES = 'width=600,height=700,left=400,top=100,scrollbars=yes,resizable=yes';

/** Matches the backend's sign-in state TTL (10 minutes), with slack. */
const OAUTH_TIMEOUT_MS = 15 * 60 * 1000;

const OAUTH_POPUP_POLL_MS = 500;

export type TOAuthPopupMessage = {
	type: string;
	success: boolean;
	error?: string;
};

/**
 * Opens the popup (during the user's click, before awaiting anything, so popup
 * blockers don't treat it as unsolicited), asks `start` for the provider's
 * authorize URL, sends the popup there, and resolves with the `messageType`
 * message the completion page posts back. Rejects if the popup is blocked,
 * closed before finishing, reports a failure, or never answers.
 */
export const runOAuthPopup = async <TMessage extends TOAuthPopupMessage>(
	messageType: TMessage['type'],
	start: () => Promise<string>,
): Promise<TMessage> => {
	const popup = window.open('about:blank', `oauth_${messageType}`, OAUTH_POPUP_FEATURES);
	if (!popup) {
		throw new ApiError(undefined, 'Popup blocked. Allow popups for this site and try again.');
	}

	let authorizeUrl: string;
	try {
		authorizeUrl = await start();
		if (popup.closed)
			throw new ApiError(undefined, 'Authorization window was closed before it finished.');
	} catch (cause) {
		popup.close();
		throw cause;
	}

	return new Promise<TMessage>((resolve, reject) => {
		let settled = false;

		const cleanup = () => {
			settled = true;
			window.removeEventListener('message', onMessage);
			window.clearInterval(closedPoll);
			window.clearTimeout(timeout);
		};

		function onMessage(event: MessageEvent) {
			// Only ever trust our own origin: the popup navigates through the
			// provider's domain before landing back on us.
			if (event.origin !== window.location.origin || event.source !== popup) return;
			const data = event.data as TMessage | undefined;
			if (data?.type !== messageType) return;

			cleanup();
			popup?.close();

			if (data.success) resolve(data);
			else reject(new ApiError(undefined, data.error || 'Authorization failed.'));
		}

		const closedPoll = window.setInterval(() => {
			if (settled || !popup.closed) return;
			cleanup();
			reject(new ApiError(undefined, 'Authorization window was closed before it finished.'));
		}, OAUTH_POPUP_POLL_MS);

		const timeout = window.setTimeout(() => {
			if (settled) return;
			cleanup();
			popup.close();
			reject(new ApiError(undefined, 'Authorization timed out. Please try again.'));
		}, OAUTH_TIMEOUT_MS);

		window.addEventListener('message', onMessage);
		try {
			popup.location.href = authorizeUrl;
		} catch (cause) {
			cleanup();
			popup.close();
			reject(cause);
		}
	});
};
