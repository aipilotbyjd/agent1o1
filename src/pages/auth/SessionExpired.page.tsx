import { Link } from 'react-router';
import { motion } from 'framer-motion';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const SessionExpiredPage = () => {
	return (
		<AuthShell
			badge='Session expired'
			title={<span className='text-slate-950'>Session expired</span>}
			subtitle='Your session timed out for security. Sign in again to pick up where you left off.'
			mobileTitle='You were signed out'
			mobileSubtitle='Your session expired. Sign back in to continue.'
			footer={
				<div className='flex items-center justify-center gap-2'>
					<span className='font-medium tracking-wide text-zinc-400'>
						Need an account?
					</span>
					<Link
						to={pages.pagesExamples.signup.to}
						className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
						Create one
					</Link>
				</div>
			}>
			<div className='flex flex-col items-center gap-8 py-4 text-center'>
				<motion.div
					animate={{ rotate: [0, 360] }}
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
					className='flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-600'>
					<Icon icon='Clock01' className='h-12 w-12' />
				</motion.div>

				<div className='w-full rounded-2xl border border-amber-100 bg-amber-50 p-5'>
					<div className='flex items-start gap-3'>
						<Icon
							icon='AlertCircle'
							className='mt-0.5 h-4 w-4 shrink-0 text-amber-500'
						/>
						<div className='text-left'>
							<p className='text-sm font-bold text-amber-800'>
								Your session has expired
							</p>
							<p className='mt-1 text-xs font-medium text-amber-700'>
								Sessions expire after a period of inactivity to keep your account
								secure. Any unsaved work may need to be re-entered.
							</p>
						</div>
					</div>
				</div>

				<Link
					to={pages.pagesExamples.login.to}
					className='group bg-primary-400 hover:bg-primary-500 flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98]'>
					Sign in again
					<Icon
						icon='ArrowRight01'
						className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
					/>
				</Link>
			</div>
		</AuthShell>
	);
};

export default SessionExpiredPage;
