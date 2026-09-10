import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { LogoDark } from '@/assets/images';
import pages from '@/Routes/pages';

const OAuthCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		const code = searchParams.get('code');
		const error = searchParams.get('error');

		if (error) {
			navigate(`${pages.auth.login.to}?error=oauth_failed`, { replace: true });
			return;
		}

		if (!code) {
			navigate(pages.auth.login.to, { replace: true });
			return;
		}

		// Exchange code for token via API (mocked for development/testing)
		const exchangeCode = async () => {
			try {
				console.log('OAuth code:', code);
				// Simulate API call delay
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Set mock token credentials
				import('@/api/core/token-manager').then(({ setToken }) => {
					setToken('mock_oauth_access_token', 3600, true, 'mock_oauth_refresh_token');
					navigate(pages.app.subPages.dashboard.to, { replace: true });
				});
			} catch (err) {
				console.error('OAuth exchange error:', err);
				navigate(`${pages.auth.login.to}?error=oauth_failed`, { replace: true });
			}
		};

		exchangeCode();
	}, [searchParams, navigate]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100'>
			<motion.img
				src={LogoDark}
				alt='Agent1o1'
				className='h-16'
				animate={{ opacity: [0.4, 1, 0.4] }}
				transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
			/>
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
		</div>
	);
};

export default OAuthCallbackPage;
