import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { LogoDark } from '@/assets/images';
import pages from '@/Routes/pages';
import { useExchangeSocialCode } from '@/api';

const OAuthCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const exchangeSocialCode = useExchangeSocialCode();
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;

		const code = searchParams.get('code');
		const error = searchParams.get('error');

		if (error) {
			navigate(`${pages.pagesExamples.login.to}?error=oauth_failed`, { replace: true });
			return;
		}

		if (!code) {
			navigate(pages.pagesExamples.login.to, { replace: true });
			return;
		}

		exchangeSocialCode.mutateAsync(code).then(
			() => navigate('/customer', { replace: true }),
			() => navigate(`${pages.pagesExamples.login.to}?error=oauth_failed`, { replace: true }),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
