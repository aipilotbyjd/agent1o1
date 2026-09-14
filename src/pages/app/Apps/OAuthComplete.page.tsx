import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import pages from '@/Routes/pages';

const OAuthCompletePage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		// Backend redirects with: ?oauth=success|error&credential_id=uuid&type=github_oauth2&message=...
		// Legacy format:           ?success=true&credential_type=github_oauth2&state_token=...
		const oauthParam = searchParams.get('oauth');
		const isNewFormat = oauthParam !== null;

		const result = {
			type: 'OAUTH_COMPLETE',
			success: isNewFormat
				? oauthParam === 'success'
				: searchParams.get('success') === 'true',
			credentialId: searchParams.get('credential_id'),
			credentialType: isNewFormat
				? searchParams.get('type')
				: searchParams.get('credential_type'),
			stateToken: searchParams.get('state_token'),
			error: isNewFormat ? (searchParams.get('message') ?? null) : searchParams.get('error'),
		};

		if (window.opener) {
			window.opener.postMessage(result, window.location.origin);
			window.close();
			return;
		}

		// No opener — same-window redirect. Pass params through to the apps page.
		const target = new URL(pages.app.subPages.apps.to, window.location.origin);
		if (result.success) {
			target.searchParams.set('oauth', 'success');
			if (result.credentialId) target.searchParams.set('credential_id', result.credentialId);
			if (result.credentialType) target.searchParams.set('type', result.credentialType);
		} else {
			target.searchParams.set('oauth', 'error');
			if (result.error) target.searchParams.set('message', result.error);
		}
		navigate(target.pathname + target.search, { replace: true });
	}, [navigate, searchParams]);

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-zinc-950'>
			<div>
				<p className='text-sm font-black tracking-widest text-slate-900 uppercase dark:text-white'>
					Completing connection
				</p>
				<p className='mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
					You can close this window if it does not close automatically.
				</p>
			</div>
		</div>
	);
};

export default OAuthCompletePage;
