import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { apiConfig } from '@/api/core';
import pages from '@/Routes/pages';
import type { TOAuthCompleteMessage } from '@/api/modules/connectors';

/**
 * Where an app-integration OAuth redirect lands.
 *
 * The backend's own callback (`GET /api/oauth/connectors/callback`) answers with
 * JSON instead of redirecting, so the browser has to make that call itself. This
 * page is the `redirect_uri` we hand the provider: it takes the `code` and
 * `state` off the query string, exchanges them, and reports the outcome back to
 * whoever started the flow.
 *
 * Usually that is the popup opened by `connectOAuthConnector`, in which case the
 * result goes back over `postMessage` and the window closes itself. If there is
 * no opener — popup blocked, or the user finished in a fresh tab — it falls back
 * to redirecting into the Apps page with the same `?oauth=…` params the old
 * frontend used.
 *
 * Not to be confused with `identity/OAuthCallback` — that one is social sign-in.
 */

/**
 * The connector callback sits outside the versioned API (`/api/oauth/...`, not
 * `/api/v1/oauth/...`), so trim the version segment off the configured base.
 */
const callbackUrl = (state: string, code: string) => {
	const root = apiConfig.baseUrl.replace(/\/v\d+\/?$/, '');
	const params = new URLSearchParams({ state, code });
	return `${root}/oauth/connectors/callback?${params.toString()}`;
};

const OAuthCompletePage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [failure, setFailure] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const finish = (result: TOAuthCompleteMessage) => {
			if (cancelled) return;

			if (window.opener) {
				window.opener.postMessage(result, window.location.origin);
				window.close();
				return;
			}

			// No opener: fall back to a same-window return. AppsList reads these
			// params on mount and toasts accordingly.
			const target = new URL(pages.workspace.subPages!.apps.to, window.location.origin);
			if (result.success) {
				target.searchParams.set('oauth', 'success');
				if (result.credentialId) target.searchParams.set('credential_id', result.credentialId);
				if (result.connectorKey) target.searchParams.set('type', result.connectorKey);
			} else {
				target.searchParams.set('oauth', 'error');
				if (result.error) target.searchParams.set('message', result.error);
			}

			// The apps path is a `/:workspaceId/...` template and this route is
			// outside the workspace tree, so only show the failure inline when we
			// cannot resolve it.
			if (target.pathname.includes(':workspaceId')) {
				setFailure(result.success ? null : (result.error ?? 'Authorization failed.'));
				if (!result.success) return;
			}

			navigate(target.pathname + target.search, { replace: true });
		};

		const exchange = async () => {
			// The provider reports a refusal on the query string rather than by
			// failing the redirect.
			const denied = searchParams.get('error');
			if (denied) {
				finish({
					type: 'OAUTH_COMPLETE',
					success: false,
					error: searchParams.get('error_description') ?? denied,
				});
				return;
			}

			const code = searchParams.get('code');
			const state = searchParams.get('state');

			if (!code || !state) {
				finish({
					type: 'OAUTH_COMPLETE',
					success: false,
					error: 'The authorization response was missing its code or state.',
				});
				return;
			}

			try {
				// Deliberately plain `fetch`: this route is public and sits outside
				// the axios client's versioned base URL.
				const response = await fetch(callbackUrl(state, code), {
					headers: { Accept: 'application/json' },
				});
				const body = await response.json().catch(() => null);

				if (!response.ok) {
					finish({
						type: 'OAUTH_COMPLETE',
						success: false,
						error: body?.message ?? 'Could not complete the connection.',
					});
					return;
				}

				const credential = body?.data?.connector_credential;
				finish({
					type: 'OAUTH_COMPLETE',
					success: true,
					credentialId: credential?.id,
					connectorKey: credential?.connector?.key,
				});
			} catch {
				finish({
					type: 'OAUTH_COMPLETE',
					success: false,
					error: 'Could not reach the server to complete the connection.',
				});
			}
		};

		void exchange();

		return () => {
			cancelled = true;
		};
	}, [navigate, searchParams]);

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-zinc-950'>
			<div>
				<p className='text-sm font-black tracking-widest text-slate-900 uppercase dark:text-white'>
					{failure ? 'Connection failed' : 'Completing connection'}
				</p>
				<p className='mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
					{failure ?? 'You can close this window if it does not close automatically.'}
				</p>
			</div>
		</div>
	);
};

export default OAuthCompletePage;
