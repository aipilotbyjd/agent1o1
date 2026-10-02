import { Link } from 'react-router';
import { motion } from 'framer-motion';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';

const WHAT_YOU_CAN_DO = [
	'Wait 30 minutes and try again',
	'Reset your password via email',
	'Contact support if you need immediate access',
];

const AccountLockedPage = () => (
	<AuthLayout badge='ACCOUNT LOCKED'>
		<AuthCardHeader
			right={
				<Link
					to={pages.identity.login.to}
					className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
					Back to sign in
				</Link>
			}
		/>

		<div className='flex flex-col items-center gap-6 text-center'>
			<motion.div
				animate={{ rotate: [0, -5, 5, 0] }}
				transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
				className='flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600'>
				<Icon icon='AiLock' className='size-10' />
			</motion.div>

			<div>
				<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
					Account locked
				</h2>
				<p className='mt-1 text-xs font-medium text-zinc-500'>
					Too many failed sign-in attempts. Your account has been temporarily locked.
				</p>
			</div>

			<div className='w-full space-y-3'>
				<div className='rounded-2xl border border-red-100 bg-red-50 p-5'>
					<div className='flex items-start gap-3'>
						<Icon icon='AlertCircle' className='mt-0.5 size-4 shrink-0 text-red-500' />
						<div className='text-left'>
							<p className='text-sm font-bold text-red-800'>
								Account temporarily locked
							</p>
							<p className='mt-1 text-xs font-medium text-red-600'>
								For your security, we lock accounts after 5 failed sign-in attempts.
								Your account will be automatically unlocked after 30 minutes.
							</p>
						</div>
					</div>
				</div>

				<div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-left'>
					<p className='mb-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase'>
						What you can do
					</p>
					<ul className='space-y-2'>
						{WHAT_YOU_CAN_DO.map((item) => (
							<li
								key={item}
								className='flex items-start gap-2 text-xs font-medium text-zinc-600'>
								<Icon
									icon='CheckmarkCircle01'
									className='text-primary-600 mt-0.5 size-3.5 shrink-0'
								/>
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className='grid w-full gap-y-2.5'>
				<Link to={pages.identity.forgotPassword.to}>
					<button
						type='button'
						className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all'>
						RESET PASSWORD ›
					</button>
				</Link>
				<a
					href='mailto:support@agent1o1.com'
					className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold tracking-wider text-zinc-700 uppercase shadow-2xs hover:bg-zinc-50'>
					<Icon icon='AiMail' className='size-4' />
					CONTACT SUPPORT
				</a>
			</div>
		</div>
	</AuthLayout>
);

export default AccountLockedPage;
