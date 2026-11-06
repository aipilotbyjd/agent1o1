import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/api/core';
import pages from '@/Routes/pages';
import { AiProviderService } from '@/api/modules/ai-providers';
import type { TAiProviderConnectMessage } from '@/api/modules/ai-providers';
import type { TAiProviderConnectResult } from '@/types/ai-provider.type';

/**
 * Where a one-click AI provider sign-in lands (`AI_PROVIDER_CONNECT_PATH`).
 *
 * This page takes the `code` and `state` off the query string and finishes the
 * connection with the backend, signed in (`AiProviderService.completeConnect`):
 * only the member who started it can finish it, so a sign-in link sent to
 * someone else can't put a key on their account into another workspace. It
 * reports the outcome to the popup's opener over `postMessage`, then closes.
 * With no opener (popup blocked, or finished in a new tab) it goes to the
 * workspace's AI Providers settings with `?ai_connected=` or `?ai_error=`,
 * which that page turns into a toast.
 */

type TOutcome = TAiProviderConnectMessage & { workspaceId?: string };

const AiProviderConnectCompletePage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [failure, setFailure] = useState<string | null>(null);
	const pendingExchange = useRef<{
		key: string;
		result: Promise<TAiProviderConnectResult>;
	} | null>(null);

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
				// Reuse the exchange if the effect runs twice: codes are single-use.
				const key = `${state}:${code}`;
				if (pendingExchange.current?.key !== key) {
					pendingExchange.current = {
						key,
						result: AiProviderService.completeConnect(state, code),
					};
				}
				const credential = await pendingExchange.current.result;

				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
					success: true,
					provider: credential.execution_provider,
					providerLabel: credential.provider_label,
					scope: credential.scope,
					workspaceId: credential.workspace_id,
				});
			} catch (error) {
				finish({
					type: 'AI_PROVIDER_CONNECT_COMPLETE',
					success: false,
					error:
						error instanceof ApiError
							? error.isAuth
								? 'Sign in to finish connecting, then start the connection again.'
								: error.message
							: 'Could not reach the server to complete the connection.',
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
