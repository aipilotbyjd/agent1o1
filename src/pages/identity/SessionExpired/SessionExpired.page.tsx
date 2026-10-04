import { Link } from 'react-router';
import { motion } from 'framer-motion';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';

const SessionExpiredPage = () => (
	<AuthLayout badge='SESSION EXPIRED'>
		<AuthCardHeader
			right={
				<span className='flex items-center gap-1.5'>
					<span className='font-medium text-zinc-400'>Need an account?</span>
					<Link
						to={pages.identity.signup.to}
						className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
						Create one
					</Link>
				</span>
			}
		/>

		<div className='flex flex-col items-center gap-6 text-center'>
			<motion.div
				animate={{ rotate: [0, 360] }}
				transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
				className='flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-600'>
				<Icon icon='Clock01' className='size-10' />
			</motion.div>

			<div>
				<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
					Session expired
				</h2>
				<p className='mt-1 text-xs font-medium text-zinc-500'>
					Your session timed out for security. Sign in again to pick up where you left
					off.
				</p>
			</div>

			<div className='w-full rounded-2xl border border-amber-100 bg-amber-50 p-5'>
				<div className='flex items-start gap-3'>
					<Icon icon='AlertCircle' className='mt-0.5 size-4 shrink-0 text-amber-500' />
					<div className='text-left'>
						<p className='text-sm font-bold text-amber-800'>Your session has expired</p>
						<p className='mt-1 text-xs font-medium text-amber-700'>
							Sessions expire after a period of inactivity to keep your account
							secure. Any unsaved work may need to be re-entered.
						</p>
					</div>
				</div>
			</div>

			<Link to={pages.identity.login.to} className='w-full'>
				<button
					type='button'
					className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all'>
					SIGN IN AGAIN ›
				</button>
			</Link>
		</div>
	</AuthLayout>
);

export default SessionExpiredPage;
