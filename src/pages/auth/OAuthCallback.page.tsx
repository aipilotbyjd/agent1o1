import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { useExchangeSocialCode } from '@/api/modules/auth';
import { messageFromError } from '@/api/core';
import useAfterAuthRedirect from '@/hooks/useAfterAuthRedirect';
import { LogoDark } from '@/assets/images';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

// ============================================================
// OAuth Callback
// ------------------------------------------------------------
// Landing spot for the social sign-in round trip. The provider goes
// to the backend, which redirects here with a single-use exchange
// code (valid ~60s) or an `error` message — see
// AuthController::handleProviderCallback.
// ============================================================

const OAuthCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const redirectAfterAuth = useAfterAuthRedirect();
	const exchange = useExchangeSocialCode();

	const code = searchParams.get('code');
	const providerError = searchParams.get('error');

	const [error, setError] = useState<string | null>(providerError);
	// The code burns on first use, and StrictMode runs effects twice in dev.
	const hasExchanged = useRef(false);

	useEffect(() => {
		if (providerError) return;
		if (!code) {
			navigate(pages.auth.login.to, { replace: true });
			return;
		}
		if (hasExchanged.current) return;
		hasExchanged.current = true;

		exchange.mutate(
			{ code },
			{
				onSuccess: () => {
					void redirectAfterAuth();
				},
				onError: (err) =>
					setError(messageFromError(err, 'Sign-in could not be completed.')),
			},
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [code, providerError]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100'>
			<motion.img
				src={LogoDark}
				alt='Agent1o1'
				className='h-16'
				animate={error ? undefined : { opacity: [0.4, 1, 0.4] }}
				transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
			/>

			{error ? (
				<>
					<div className='flex flex-col items-center gap-2 text-center'>
						<p className='text-sm font-black tracking-widest text-slate-950 uppercase'>
							Sign in failed
						</p>
						<p className='max-w-sm text-xs font-medium text-slate-500'>{error}</p>
					</div>
					<Link
						to={pages.auth.login.to}
						className='text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 text-xs font-bold transition-colors'>
						<Icon icon='ArrowLeft01' className='h-3.5 w-3.5' />
						Back to sign in
					</Link>
				</>
			) : (
				<>
					<div className='flex flex-col items-center gap-2 text-center'>
						<p className='text-sm font-black tracking-widest text-slate-950 uppercase'>
							Completing sign in
						</p>
						<p className='text-xs font-medium text-slate-500'>
							Please wait while we verify your credentials...
						</p>
					</div>
					<div className='flex gap-1.5'>
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								className='bg-primary-400 h-2 w-2 rounded-full'
								animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
								transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default OAuthCallbackPage;
