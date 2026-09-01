import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import * as Yup from 'yup';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';
import { useResetPassword } from '@/api';

const validationSchema = Yup.object().shape({
	password: Yup.string()
		.required('Password is required')
		.min(8, 'Must be at least 8 characters')
		.matches(/[A-Z]/, 'Must contain at least one uppercase letter')
		.matches(/[a-z]/, 'Must contain at least one lowercase letter')
		.matches(/[\d\W]/, 'Must contain at least one number or symbol'),
	confirmPassword: Yup.string()
		.required('Please confirm your password')
		.oneOf([Yup.ref('password')], 'Passwords must match'),
});

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') ?? '';
	const email = searchParams.get('email') ?? '';
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [done, setDone] = useState(false);
	const { mutateAsync: resetPassword } = useResetPassword();

	const formik = useFormik({
		initialValues: { password: '', confirmPassword: '' },
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values) => {
			try {
				await resetPassword({
					token,
					email,
					password: values.password,
					password_confirmation: values.confirmPassword,
				});
				setDone(true);
			} catch {
				// handled by hook notify
			}
		},
	});

	return (
		<AuthShell
			badge='Set new password'
			title={<span className='text-slate-950'>Reset password</span>}
			subtitle="Choose a strong password you haven't used before."
			mobileTitle='Create a new password'
			mobileSubtitle='Make it strong and unique to keep your account safe.'
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
			<AnimatePresence mode='wait'>
				{done ? (
					<motion.div
						key='done'
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className='flex flex-col items-center gap-6 py-4 text-center'>
						<div className='flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
							<Icon icon='CheckmarkCircle01' className='h-10 w-10' />
						</div>
						<div className='space-y-2'>
							<h3 className='text-xl font-black tracking-tight text-slate-950'>
								Password updated
							</h3>
							<p className='text-sm font-medium text-slate-500'>
								Your password has been reset successfully. You can now sign in with
								your new password.
							</p>
						</div>
						<Link
							to={pages.pagesExamples.login.to}
							className='group bg-primary-400 hover:bg-primary-500 inline-flex items-center gap-3 rounded-[32px] px-8 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300'>
							Sign in now
							<Icon
								icon='ArrowRight01'
								className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
							/>
						</Link>
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
								htmlFor='password'>
								New password
							</label>
							<div className='group relative'>
								<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
									<Icon
										icon='AiLock'
										className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
									/>
								</div>
								<input
									id='password'
									name='password'
									type={showPassword ? 'text' : 'password'}
									autoComplete='new-password'
									placeholder='Create a strong password'
									value={formik.values.password}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-11 text-base font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
								/>
								<button
									type='button'
									onClick={() => setShowPassword((v) => !v)}
									className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700'>
									<Icon
										icon={showPassword ? 'ViewOff' : 'View'}
										className='h-5 w-5'
									/>
								</button>
							</div>
							<AnimatePresence>
								{formik.touched.password && formik.errors.password && (
									<motion.p
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className='ml-1 text-[10px] font-medium text-red-500'>
										{formik.errors.password}
									</motion.p>
								)}
							</AnimatePresence>
						</div>

						<div className='space-y-2'>
							<label
								className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
								htmlFor='confirmPassword'>
								Confirm password
							</label>
							<div className='group relative'>
								<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
									<Icon
										icon='AiLock'
										className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
									/>
								</div>
								<input
									id='confirmPassword'
									name='confirmPassword'
									type={showConfirm ? 'text' : 'password'}
									autoComplete='new-password'
									placeholder='Repeat your password'
									value={formik.values.confirmPassword}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-11 text-base font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
								/>
								<button
									type='button'
									onClick={() => setShowConfirm((v) => !v)}
									className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700'>
									<Icon
										icon={showConfirm ? 'ViewOff' : 'View'}
										className='h-5 w-5'
									/>
								</button>
							</div>
							<AnimatePresence>
								{formik.touched.confirmPassword &&
									formik.errors.confirmPassword && (
										<motion.p
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className='ml-1 text-[10px] font-medium text-red-500'>
											{formik.errors.confirmPassword}
										</motion.p>
									)}
							</AnimatePresence>
						</div>

						<button
							type='submit'
							disabled={!formik.isValid || formik.isSubmitting}
							className='group bg-primary-400 hover:bg-primary-500 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
							<span>{formik.isSubmitting ? 'Resetting...' : 'Reset password'}</span>
							<Icon
								icon='ArrowRight01'
								className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
							/>
						</button>
					</motion.form>
				)}
			</AnimatePresence>
		</AuthShell>
	);
};

export default ResetPasswordPage;
