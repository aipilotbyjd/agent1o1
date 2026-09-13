import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import classNames from 'classnames';
import { useResetPassword } from '@/api/modules/auth';
import pages from '@/Routes/pages';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import Progress from '@/components/ui/Progress';
import List, { Li } from '@/components/ui/List';
import Alert from '@/components/ui/Alert';
import { TColors } from '@/types/colors.type';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';

interface IResetPasswordFormValues {
	password: string;
	password_confirmation: string;
}

const passwordChecks = (password: string) => ({
	hasMinLength: password.length >= 8,
	hasUppercase: /[A-Z]/.test(password),
	hasLowercase: /[a-z]/.test(password),
	hasNumber: /\d/.test(password),
	hasSymbol: /[^A-Za-z0-9]/.test(password),
});

const validationSchema = Yup.object().shape({
	password: Yup.string()
		.required('Password is required')
		.min(8, 'Must be at least 8 characters')
		.matches(/[A-Z]/, 'Must contain at least one uppercase letter')
		.matches(/[a-z]/, 'Must contain at least one lowercase letter')
		.matches(/\d/, 'Must contain at least one number')
		.matches(/[^A-Za-z0-9]/, 'Must contain at least one symbol'),
	password_confirmation: Yup.string()
		.required('Please confirm your password')
		.oneOf([Yup.ref('password')], 'Passwords must match'),
});

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const resetPassword = useResetPassword();

	const token = searchParams.get('token') ?? '';
	const email = searchParams.get('email') ?? '';

	const [isSuccess, setIsSuccess] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const formik = useFormik<IResetPasswordFormValues>({
		initialValues: { password: '', password_confirmation: '' },
		validationSchema,
		onSubmit: async (values) => {
			try {
				await resetPassword.mutateAsync({
					token,
					email,
					password: values.password,
					password_confirmation: values.password_confirmation,
				});
				setIsSuccess(true);
			} catch (error) {
				applyApiFieldErrors(error, formik);
			}
		},
	});

	const checks = passwordChecks(formik.values.password);
	const passedCount = Object.values(checks).filter(Boolean).length;
	const colorMap: { [key: number]: TColors } = {
		0: 'red',
		1: 'red',
		2: 'amber',
		3: 'amber',
		4: 'blue',
	};
	const passwordStrengthColor: TColors = colorMap[passedCount] ?? 'violet';

	const isTokenMissing = !token || !email;

	return (
		<div className='relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0b0f] text-white lg:flex-row'>
			{/* Ambient Purple Glowing Gradient */}
			<div className='pointer-events-none absolute -top-44 -left-44 h-[700px] w-[700px] rounded-full bg-purple-600/25 blur-[170px]' />
			<div className='pointer-events-none absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[150px]' />

			{/* Decorative Corner Outline */}
			<div className='pointer-events-none absolute top-12 right-0 hidden h-64 w-48 rounded-l-[40px] border-y border-l border-purple-500/20 lg:block' />

			{/* ─── Left Panel: Hero Showcase (Purple Theme & Agent1o1 Tagline) ─── */}
			<div className='relative z-10 flex flex-1 flex-col justify-between p-8 sm:p-12 lg:p-16'>
				<div>
					<div className='inline-flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/15 px-3.5 py-1 text-[11px] font-bold tracking-wider text-purple-300 uppercase'>
						<span className='size-1.5 rounded-full bg-purple-400 animate-pulse' />
						RESET PASSWORD
					</div>

					<h1 className='mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]'>
						Build <br />
						<span className='font-serif italic text-purple-400'>Autonomous.</span> <br />
						AI Agents.
					</h1>
				</div>

				{/* 3 Feature Boxes */}
				<div className='my-10 flex max-w-md flex-col gap-3.5'>
					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Autonomous agent workflows
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								Connect LLMs, memory, and tools to automate complex tasks.
							</div>
						</div>
					</div>

					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
								<path d='m9 12 2 2 4-4' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Enterprise-ready isolation
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								Role-based access, credential vaults, and full audit trails.
							</div>
						</div>
					</div>

					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M3 3v18h18' />
								<path d='m19 9-5 5-4-4-3 3' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Execution at planetary scale
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								High-throughput orchestration with millisecond latency.
							</div>
						</div>
					</div>
				</div>

				{/* Social Proof */}
				<div className='flex items-center gap-4 pt-2'>
					<div className='flex -space-x-2.5'>
						<img
							src={Avatar1}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
						<img
							src={Avatar2}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
						<img
							src={Avatar3}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
					</div>
					<div>
						<div className='text-[10px] font-bold tracking-widest text-purple-300/80 uppercase'>
							TRUSTED BY BUILDERS
						</div>
						<div className='text-xs font-bold tracking-tight text-white'>
							JOIN 5,000+ TOP-TIER AI DEVELOPERS
						</div>
					</div>
				</div>
			</div>

			{/* ─── Right Panel: Floating Card ───────────────────────────── */}
			<div className='relative z-10 flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12'>
				<div className='w-full max-w-[460px] rounded-[32px] border border-white/80 bg-white p-8 sm:p-10 shadow-2xl shadow-purple-950/20'>
					{/* Wordmark */}
					<div className='mb-6 flex items-center justify-between'>
						<Link to='/' className='flex items-center gap-2 group'>
							<div className='flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 transition-transform group-hover:scale-105'>
								<svg
									className='size-5'
									viewBox='0 0 24 24'
									fill='currentColor'>
									<path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
								</svg>
							</div>
							<div className='flex items-baseline'>
								<span className='text-xl font-black tracking-tight text-zinc-900'>
									agent
								</span>
								<span className='text-xl font-black tracking-tight text-purple-600'>
									1o1
								</span>
							</div>
						</Link>

						<Link
							to={pages.pagesExamples.login.to}
							className='text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline'>
							Back to sign in
						</Link>
					</div>

					{isSuccess ? (
						<div className='grid gap-y-5 text-center'>
							<div>
								<h2 className='text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl'>
									Password reset!
								</h2>
								<p className='mt-2 text-xs font-medium text-zinc-500'>
									Your password has been reset successfully. Previous active
									sessions have been signed out.
								</p>
							</div>

							<Alert color='emerald' variant='soft' icon='CheckmarkCircle02' className='text-left text-xs'>
								You can now sign in with your new credentials.
							</Alert>

							<Link to={pages.pagesExamples.login.to}>
								<button
									type='button'
									className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-purple-600/25 transition-all hover:bg-purple-700'>
									SIGN IN NOW ›
								</button>
							</Link>
						</div>
					) : isTokenMissing ? (
						<div className='grid gap-y-5 text-center'>
							<div>
								<h2 className='text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl'>
									Invalid reset link
								</h2>
								<p className='mt-2 text-xs font-medium text-zinc-500'>
									This password reset link is missing required parameters or has
									expired.
								</p>
							</div>

							<Alert color='red' variant='soft' icon='Alert02' className='text-left text-xs'>
								Reset links are valid for 60 minutes and can only be used once.
							</Alert>

							<Link to={pages.pagesExamples.forgotPassword.to}>
								<button
									type='button'
									className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-purple-600/25 transition-all hover:bg-purple-700'>
									REQUEST A NEW LINK ›
								</button>
							</Link>
						</div>
					) : (
						<>
							<div>
								<h2 className='text-3xl font-extrabold tracking-tight text-zinc-900'>
									Set new password
								</h2>
								<p className='mt-1 text-xs font-medium text-zinc-500'>
									Resetting password for{' '}
									<span className='font-bold text-zinc-900'>{email}</span>
								</p>
							</div>

							<form className='mt-5 grid gap-y-3.5' onSubmit={formik.handleSubmit}>
								{/* New Password */}
								<div>
									<label
										htmlFor='password'
										className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
										NEW PASSWORD
									</label>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-purple-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/15'>
										<Icon icon='SquareLockPassword' className='size-4 text-zinc-400 shrink-0' />
										<input
											type={showPassword ? 'text' : 'password'}
											className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='password'
											name='password'
											autoComplete='new-password'
											value={formik.values.password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Enter new password'
										/>
										<button
											type='button'
											onClick={() => setShowPassword(!showPassword)}
											tabIndex={-1}
											className='cursor-pointer text-zinc-400 hover:text-zinc-600 focus:outline-none'>
											<Icon
												icon={showPassword ? 'View' : 'ViewOffSlash'}
												className='size-4'
											/>
										</button>
									</div>
									{formik.touched.password && formik.errors.password && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.password}
										</p>
									)}
								</div>

								{/* Confirm Password */}
								<div>
									<label
										htmlFor='password_confirmation'
										className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
										CONFIRM PASSWORD
									</label>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-purple-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/15'>
										<Icon icon='SquareLockPassword' className='size-4 text-zinc-400 shrink-0' />
										<input
											type={showConfirm ? 'text' : 'password'}
											className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='password_confirmation'
											name='password_confirmation'
											autoComplete='new-password'
											value={formik.values.password_confirmation}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Confirm new password'
										/>
										<button
											type='button'
											onClick={() => setShowConfirm(!showConfirm)}
											tabIndex={-1}
											className='cursor-pointer text-zinc-400 hover:text-zinc-600 focus:outline-none'>
											<Icon
												icon={showConfirm ? 'View' : 'ViewOffSlash'}
												className='size-4'
											/>
										</button>
									</div>
									{formik.touched.password_confirmation &&
										formik.errors.password_confirmation && (
											<p className='mt-1 text-xs text-red-500'>
												{formik.errors.password_confirmation}
											</p>
										)}
								</div>

								{/* Strength meter */}
								<div className='mt-1 flex flex-col gap-1.5'>
									<div className='grid grid-cols-5 gap-1.5'>
										{[0, 1, 2, 3, 4].map((step) => (
											<Progress
												key={step}
												value={passedCount > step ? 100 : 0}
												color={passwordStrengthColor}
											/>
										))}
									</div>
									<List type='list-none' className='mt-1 grid grid-cols-2 gap-x-2 text-[11px] text-zinc-500'>
										<Li
											iconProps={{
												icon: checks.hasMinLength ? 'Tick02' : 'Cancel01',
												color: checks.hasMinLength ? 'emerald' : 'red',
											}}
											className={classNames({
												'text-emerald-600 font-medium': checks.hasMinLength,
											})}>
											8+ chars
										</Li>
										<Li
											iconProps={{
												icon: checks.hasUppercase ? 'Tick02' : 'Cancel01',
												color: checks.hasUppercase ? 'emerald' : 'red',
											}}
											className={classNames({
												'text-emerald-600 font-medium': checks.hasUppercase,
											})}>
											Uppercase
										</Li>
										<Li
											iconProps={{
												icon: checks.hasLowercase ? 'Tick02' : 'Cancel01',
												color: checks.hasLowercase ? 'emerald' : 'red',
											}}
											className={classNames({
												'text-emerald-600 font-medium': checks.hasLowercase,
											})}>
											Lowercase
										</Li>
										<Li
											iconProps={{
												icon: checks.hasNumber ? 'Tick02' : 'Cancel01',
												color: checks.hasNumber ? 'emerald' : 'red',
											}}
											className={classNames({
												'text-emerald-600 font-medium': checks.hasNumber,
											})}>
											Number
										</Li>
									</List>
								</div>

								{/* Submit Button */}
								<button
									type='submit'
									disabled={resetPassword.isPending || passedCount < 5}
									className='mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-purple-600/25 transition-all hover:bg-purple-700 active:bg-purple-800 disabled:pointer-events-none disabled:opacity-50'>
									{resetPassword.isPending && <Spinner className='size-4' />}
									RESET PASSWORD ›
								</button>
							</form>

							<p className='mt-5 text-center text-xs text-zinc-500'>
								Back to{' '}
								<Link
									to={pages.pagesExamples.login.to}
									className='font-bold text-purple-600 transition-colors hover:text-purple-700'>
									Sign in
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default ResetPasswordPage;
