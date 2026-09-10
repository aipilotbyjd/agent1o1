import { Link } from 'react-router';
import { motion } from 'framer-motion';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const AccountLockedPage = () => {
	return (
		<AuthShell
			badge='Account locked'
			title={<span className='text-slate-950'>Account locked</span>}
			subtitle='Too many failed sign-in attempts. Your account has been temporarily locked.'
			mobileTitle='Account locked'
			mobileSubtitle='Too many failed attempts. Please wait or contact support.'
			footer={
				<div className='flex items-center justify-center gap-2'>
					<Link
						to={pages.pagesExamples.login.to}
						className='text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 font-bold transition-colors'>
						<Icon icon='ArrowLeft01' className='h-3.5 w-3.5' />
						Back to sign in
					</Link>
				</div>
			}>
			<div className='flex flex-col items-center gap-8 py-4 text-center'>
				<motion.div
					animate={{ rotate: [0, -5, 5, 0] }}
					transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
					className='flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600'>
					<Icon icon='AiLock' className='h-12 w-12' />
				</motion.div>

				<div className='w-full space-y-4'>
					<div className='rounded-2xl border border-red-100 bg-red-50 p-5'>
						<div className='flex items-start gap-3'>
							<Icon
								icon='AlertCircle'
								className='mt-0.5 h-4 w-4 shrink-0 text-red-500'
							/>
							<div className='text-left'>
								<p className='text-sm font-bold text-red-800'>
									Account temporarily locked
								</p>
								<p className='mt-1 text-xs font-medium text-red-600'>
									For your security, we lock accounts after 5 failed sign-in
									attempts. Your account will be automatically unlocked after 30
									minutes.
								</p>
							</div>
						</div>
					</div>

					<div className='rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left'>
						<p className='mb-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase'>
							What you can do
						</p>
						<ul className='space-y-2'>
							{[
								'Wait 30 minutes and try again',
								'Reset your password via email',
								'Contact support if you need immediate access',
							].map((item) => (
								<li
									key={item}
									className='flex items-start gap-2 text-xs font-medium text-slate-600'>
									<Icon
										icon='CheckmarkCircle01'
										className='text-primary-600 mt-0.5 h-3.5 w-3.5 shrink-0'
									/>
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className='flex w-full flex-col gap-3'>
					<Link
						to={pages.auth.forgotPassword.to}
						className='group bg-primary-400 hover:bg-primary-500 flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98]'>
						Reset password
						<Icon
							icon='ArrowRight01'
							className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
						/>
					</Link>
					<a
						href='mailto:support@agent1o1.com'
						className='flex w-full items-center justify-center gap-2 rounded-[32px] border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50'>
						<Icon icon='AiMail' className='h-4 w-4' />
						Contact support
					</a>
				</div>
			</div>
		</AuthShell>
	);
};

export default AccountLockedPage;
