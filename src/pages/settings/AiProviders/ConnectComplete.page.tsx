import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { apiConfig } from '@/api/core';
import pages from '@/Routes/pages';
import type { TAiProviderConnectMessage } from '@/api/modules/ai-providers';

/**
 * Where a one-click AI provider sign-in lands (`AI_PROVIDER_CONNECT_PATH`).
 *
 * The backend's public callback (`GET /api/oauth/ai-providers/callback`)
 * answers with JSON, so this page takes the `code` and `state` off the query
 * string, makes that call, and reports the outcome to the popup's opener over
 * `postMessage`, then closes. With no opener (popup blocked, or finished in a
 * new tab) it goes to the workspace's AI Providers settings with
 * `?ai_connected=` or `?ai_error=`, which that page turns into a toast.
 */

/** The callback sits outside the versioned API (`/api/oauth/...`). */
const callbackUrl = (state: string, code: string) => {
	const root = apiConfig.baseUrl.replace(/\/v\d+\/?$/, '');
	const params = new URLSearchParams({ state, code });
	return `${root}/oauth/ai-providers/callback?${params.toString()}`;
};

type TOutcome = TAiProviderConnectMessage & { workspaceId?: string };

const AiProviderConnectCompletePage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [failure, setFailure] = useState<string | null>(null);
	const pendingExchange = useRef<{ url: string; response: Promise<Response> } | null>(null);

	useEffect(() => {
		let cancelled = false;

		const finish = ({ workspaceId, ...result }: TOutcome) => {
			if (cancelled) return;

			if (window.opener) {
				window.opener.postMessage(result, window.location.origin);
				window.close();
				return;
			}

			if (!workspaceId) {
				setFailure(result.success ? null : (result.error ?? 'Connection failed.'));
				if (!result.success) return;
				navigate('/', { replace: true });
				return;
			}

			const path = pages.settings.subPages!.aiProviders.to.replace(
				':workspaceId',
				workspaceId,
			);
			const params = new URLSearchParams(
				result.success
					? { ai_connected: result.providerLabel ?? result.provider ?? '' }
					: { ai_error: result.error ?? 'Connection failed.' },
			);
			navigate(`${path}?${params.toString()}`, { replace: true });
		};

		const exchange = async () => {
			// The provider reports a refusal ("Deny") on the query string.
			const denied = searchParams.get('error');
			if (denied) {
				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
					success: false,
					error: searchParams.get('error_description') ?? 'You cancelled the sign-in.',
				});
				return;
			}

			const code = searchParams.get('code');
			const state = searchParams.get('state');

			if (!code || !state) {
				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
					success: false,
					error: 'The sign-in response was missing its code or state.',
				});
				return;
			}

			try {
				// Plain `fetch`: this route is public and outside the axios client's base URL.
				const url = callbackUrl(state, code);
				// Reuse the exchange if the effect runs twice: codes are single-use.
				if (pendingExchange.current?.url !== url) {
					pendingExchange.current = {
						url,
						response: fetch(url, { headers: { Accept: 'application/json' } }),
					};
				}
				const response = await pendingExchange.current.response;
				const body = await response
					.clone()
					.json()
					.catch(() => null);

				if (!response.ok) {
					finish({
						type: 'AI_PROVIDER_CONNECT_COMPLETE',
						success: false,
						error: body?.message ?? 'Could not complete the connection.',
					});
					return;
				}

				const credential = body?.data?.ai_provider_credential;
				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
					success: true,
					provider: credential?.execution_provider,
					providerLabel: credential?.provider_label,
					scope: credential?.scope,
					workspaceId: credential?.workspace_id,
				});
			} catch {
				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
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
					{failure ? 'Connection failed' : 'Connecting your AI provider'}
				</p>
				<p className='mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
					{failure ?? 'You can close this window if it does not close automatically.'}
				</p>
			</div>
		</div>
	);
};

export default AiProviderConnectCompletePage;
