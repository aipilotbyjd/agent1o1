import { useState } from 'react';
import { Link } from 'react-router';
import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import * as Yup from 'yup';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const validationSchema = Yup.object().shape({
	email: Yup.string().email('Enter a valid email address').required('Email is required'),
});

const MagicLinkPage = () => {
	const [sent, setSent] = useState(false);

	const formik = useFormik({
		initialValues: { email: '' },
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values) => {
			try {
				// Simulate API loading delay
				await new Promise((resolve) => setTimeout(resolve, 1500));
				console.log('magic link sent to:', values.email);
				setSent(true);
			} catch (err) {
				console.error('Magic link request failed:', err);
			}
		},
	});

	return (
		<AuthShell
			badge='Passwordless login'
			title={<span className='text-slate-950'>Sign in with magic link</span>}
			subtitle='Enter your email and we send you a one-click sign-in link. No password needed.'
			mobileTitle='Magic link login'
			mobileSubtitle='Sign in without a password — just click the link we send you.'
			footer={
				<div className='flex items-center justify-center gap-4'>
					<Link
						to={pages.pagesExamples.login.to}
						className='text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 font-bold transition-colors'>
						<Icon icon='AiLock' className='h-3.5 w-3.5' />
						Use password instead
					</Link>
				</div>
			}>
			<AnimatePresence mode='wait'>
				{sent ? (
					<motion.div
						key='sent'
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className='flex flex-col items-center gap-6 py-4 text-center'>
						<motion.div
							animate={{ y: [0, -8, 0] }}
							transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
							className='bg-primary-100 text-primary-700 flex h-24 w-24 items-center justify-center rounded-full'>
							<Icon icon='AiMail' className='h-12 w-12' />
						</motion.div>
						<div className='space-y-2'>
							<h3 className='text-xl font-black tracking-tight text-slate-950'>
								Magic link sent!
							</h3>
							<p className='text-sm font-medium text-slate-500'>
								We sent a sign-in link to{' '}
								<span className='font-bold text-slate-950'>
									{formik.values.email}
								</span>
								. The link expires in 15 minutes.
							</p>
						</div>
						<button
							type='button'
							onClick={() => setSent(false)}
							className='text-primary-600 hover:text-primary-700 text-xs font-bold transition-colors'>
							Resend link
						</button>
					</motion.div>
				) : (
					<motion.form
						key='form'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='space-y-6'
						onSubmit={formik.handleSubmit}>
						<div className='space-y-2'>
							<label
								className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
								htmlFor='email'>
								Email address
							</label>
							<div className='group relative'>
								<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
									<Icon
										icon='AiMail'
										className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
									/>
								</div>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									placeholder='name@company.com'
									value={formik.values.email}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-11 text-base font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
								/>
							</div>
							<AnimatePresence>
								{formik.touched.email && formik.errors.email && (
									<motion.p
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className='ml-1 text-[10px] font-medium text-red-500'>
										{formik.errors.email}
									</motion.p>
								)}
							</AnimatePresence>
						</div>

						<button
							type='submit'
							disabled={!formik.isValid || formik.isSubmitting}
							className='group bg-primary-400 hover:bg-primary-500 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
							<span>{formik.isSubmitting ? 'Sending...' : 'Send magic link'}</span>
							<Icon icon='AiMail' className='h-5 w-5' />
						</button>
					</motion.form>
				)}
			</AnimatePresence>
		</AuthShell>
	);
};

export default MagicLinkPage;
