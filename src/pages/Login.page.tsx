import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLogin, useSocialRedirectUrl, useVerifyTwoFactor } from '@/api/modules/auth';
import { isTwoFactorChallenge, type TSocialProvider } from '@/types/auth.type';
import { useAuth } from '@/context/authContext';
import useAfterAuthRedirect, { AFTER_AUTH_PATH } from '@/hooks/useAfterAuthRedirect';
import pages from '@/Routes/pages';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';

interface ILoginFormValues {
	email: string;
	password: string;
	rememberMe: boolean;
}

interface ITwoFactorFormValues {
	code: string;
}

const loginSchema = Yup.object().shape({
	email: Yup.string().email('Enter a valid email address').required('Email is required'),
	password: Yup.string().required('Password is required'),
});

const twoFactorSchema = Yup.object().shape({
	code: Yup.string()
		.required('Enter the code we sent you')
		.min(6, 'The code is 6 characters long'),
});

type TChallenge = { token: string; rememberMe: boolean };

const GoogleIcon = () => (
	<svg className='size-4' viewBox='0 0 46 47' fill='none'>
		<path
			d='M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z'
			fill='#4285F4'
		/>
		<path
			d='M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z'
			fill='#34A853'
		/>
		<path
			d='M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z'
			fill='#FBBC05'
		/>
		<path
			d='M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z'
			fill='#EB4335'
		/>
	</svg>
);

const GithubIcon = () => (
	<svg className='size-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
		<path d='M12 .5C5.73.5.99 5.24.99 11.51c0 4.87 3.16 9 7.54 10.46.55.1.75-.24.75-.53v-2.06c-3.07.67-3.72-1.3-3.72-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.59 1.21 3.22.93.1-.72.39-1.21.7-1.49-2.45-.28-5.03-1.23-5.03-5.46 0-1.21.43-2.2 1.14-2.97-.11-.28-.49-1.4.11-2.92 0 0 .93-.3 3.05 1.14a10.5 10.5 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.52.22 2.64.11 2.92.71.77 1.14 1.76 1.14 2.97 0 4.24-2.58 5.18-5.04 5.45.4.34.75 1.02.75 2.06v3.05c0 .29.2.64.76.53 4.38-1.46 7.53-5.59 7.53-10.46C23.01 5.24 18.27.5 12 .5Z' />
	</svg>
);

const LoginPage = () => {
	const location = useLocation();
	const { isAuthenticated, isLoading } = useAuth();
	const redirectAfterAuth = useAfterAuthRedirect();

	const login = useLogin();
	const verifyTwoFactor = useVerifyTwoFactor();
	const socialRedirect = useSocialRedirectUrl();

	const [challenge, setChallenge] = useState<TChallenge | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const from = (location.state as { from?: string } | null)?.from ?? AFTER_AUTH_PATH;

	const formik = useFormik<ILoginFormValues>({
		initialValues: { email: '', password: '', rememberMe: true },
		validationSchema: loginSchema,
		onSubmit: async (values) => {
			try {
				const { res } = await login.mutateAsync({
					email: values.email,
					password: values.password,
					rememberMe: values.rememberMe,
				});

				if (isTwoFactorChallenge(res.data)) {
					setChallenge({
						token: res.data.two_factor_challenge,
						rememberMe: values.rememberMe,
					});
					return;
				}

				await redirectAfterAuth(from);
			} catch (error) {
				applyApiFieldErrors(error, formik);
			}
		},
	});

	const twoFactorFormik = useFormik<ITwoFactorFormValues>({
		initialValues: { code: '' },
		validationSchema: twoFactorSchema,
		onSubmit: async (values) => {
			if (!challenge) return;
			try {
				await verifyTwoFactor.mutateAsync({
					challenge_token: challenge.token,
					code: values.code,
					rememberMe: challenge.rememberMe,
				});
				await redirectAfterAuth(from);
			} catch (error) {
				applyApiFieldErrors(error, twoFactorFormik);
			}
		},
	});

	const handleSocial = (provider: TSocialProvider) => {
		socialRedirect.mutate(provider, {
			onSuccess: ({ url }) => window.location.assign(url),
		});
	};

	if (!isLoading && isAuthenticated) return <Navigate to={from} replace />;

	return (
		<div className='relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0b0f] text-white lg:flex-row'>
			{/* Ambient Brand Glowing Gradient */}
			<div className='pointer-events-none absolute -top-44 -left-44 h-[700px] w-[700px] rounded-full bg-primary-600/25 blur-[170px]' />
			<div className='pointer-events-none absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-primary-600/20 blur-[150px]' />

			{/* Decorative Corner Outline */}
			<div className='pointer-events-none absolute top-12 right-0 hidden h-64 w-48 rounded-l-[40px] border-y border-l border-primary-500/20 lg:block' />

			{/* ─── Left Panel: Hero Showcase (Brand Theme & Agent1o1 Tagline) ─── */}
			<div className='relative z-10 flex flex-1 flex-col justify-between p-8 sm:p-12 lg:p-16'>
				<div>
					{/* Welcome Badge */}
					<div className='inline-flex items-center gap-2 rounded-full border border-primary-500/35 bg-primary-500/15 px-3.5 py-1 text-[11px] font-bold tracking-wider text-primary-300 uppercase'>
						<span className='size-1.5 rounded-full bg-primary-400 animate-pulse' />
						WELCOME TO AGENT1O1
					</div>

					{/* Main Typography tailored to agent1o1 */}
					<h1 className='mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]'>
						Build <br />
						<span className='font-serif italic text-primary-400'>Autonomous.</span> <br />
						AI Agents.
					</h1>
				</div>

				{/* 3 Feature Boxes */}
				<div className='my-10 flex max-w-md flex-col gap-3.5'>
					<div className='flex items-center gap-4 rounded-2xl border border-primary-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-primary-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/15 text-primary-300 shadow-inner'>
							<svg
								className='size-5 text-primary-300'
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

					<div className='flex items-center gap-4 rounded-2xl border border-primary-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-primary-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/15 text-primary-300 shadow-inner'>
							<svg
								className='size-5 text-primary-300'
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

					<div className='flex items-center gap-4 rounded-2xl border border-primary-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-primary-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/15 text-primary-300 shadow-inner'>
							<svg
								className='size-5 text-primary-300'
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
							className='size-8 rounded-full object-cover ring-2 ring-primary-900'
						/>
						<img
							src={Avatar2}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-primary-900'
						/>
						<img
							src={Avatar3}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-primary-900'
						/>
					</div>
					<div>
						<div className='text-[10px] font-bold tracking-widest text-primary-300/80 uppercase'>
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
				<div className='w-full max-w-[460px] rounded-[32px] border border-white/80 bg-white p-8 sm:p-10 shadow-2xl shadow-primary-950/20'>
					{/* Wordmark */}
					<div className='mb-6 flex items-center justify-between'>
						<Link to='/' className='flex items-center gap-2 group'>
							<div className='flex size-9 items-center justify-center rounded-xl bg-primary-600 text-zinc-900 shadow-md shadow-primary-600/30 transition-transform group-hover:scale-105'>
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
								<span className='text-xl font-black tracking-tight text-primary-600'>
									1o1
								</span>
							</div>
						</Link>

						<div className='text-xs text-zinc-500'>
							{challenge ? (
								<span>Step 2 of 2</span>
							) : (
								<Link
									to={pages.pagesExamples.register.to}
									className='font-semibold text-primary-600 hover:text-primary-700 hover:underline'>
									Create account
								</Link>
							)}
						</div>
					</div>

					{challenge ? (
						<>
							{/* 2FA Challenge Header */}
							<div>
								<div className='inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary-700 uppercase'>
									<Icon icon='ShieldCheck' className='size-3.5' />
									Two-Factor Challenge
								</div>
								<h2 className='mt-2.5 text-2xl font-extrabold tracking-tight text-zinc-900'>
									Enter 6-digit Code
								</h2>
								<p className='mt-1 text-xs font-medium text-zinc-500'>
									Enter the 6-digit code from your authenticator app.
								</p>
							</div>

							<form
								className='mt-6 grid gap-y-4'
								onSubmit={twoFactorFormik.handleSubmit}>
								<div>
									<label
										htmlFor='code'
										className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
										Authentication code
									</label>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15'>
										<Icon icon='SquareLockPassword' className='size-4 text-zinc-400 shrink-0' />
										<input
											className='input-clean w-full border-0 border-none bg-transparent p-0 text-center font-mono text-base tracking-[0.4em] text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='code'
											name='code'
											autoComplete='one-time-code'
											inputMode='numeric'
											autoFocus
											value={twoFactorFormik.values.code}
											onChange={twoFactorFormik.handleChange}
											onBlur={twoFactorFormik.handleBlur}
											placeholder='000000'
										/>
									</div>
									{twoFactorFormik.touched.code && twoFactorFormik.errors.code && (
										<p className='mt-1 text-xs text-red-500'>
											{twoFactorFormik.errors.code}
										</p>
									)}
								</div>

								<button
									type='submit'
									disabled={verifyTwoFactor.isPending}
									className='mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 active:bg-primary-800 disabled:pointer-events-none disabled:opacity-50'>
									{verifyTwoFactor.isPending && <Spinner className='size-4' />}
									VERIFY & SIGN IN ›
								</button>

								<button
									type='button'
									onClick={() => {
										setChallenge(null);
										twoFactorFormik.resetForm();
									}}
									className='mt-2 cursor-pointer text-center text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800'>
									Use a different account
								</button>
							</form>
						</>
					) : (
						<>
							{/* Header */}
							<div>
								<h2 className='text-3xl font-extrabold tracking-tight text-zinc-900'>
									Sign in
								</h2>
								<p className='mt-1 text-xs font-medium text-zinc-500'>
									Continue building reliable AI workflows.
								</p>
							</div>

							{/* Social Buttons */}
							<div className='mt-6 grid grid-cols-2 gap-3'>
								<button
									type='button'
									disabled={socialRedirect.isPending}
									onClick={() => handleSocial('google')}
									className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50'>
									<GoogleIcon />
									Google
								</button>
								<button
									type='button'
									disabled={socialRedirect.isPending}
									onClick={() => handleSocial('github')}
									className='flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2e3138] py-2.5 px-3 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#202227] focus:outline-hidden disabled:pointer-events-none disabled:opacity-50'>
									<GithubIcon />
									Github
								</button>
							</div>

							{/* Divider */}
							<div className='relative my-5'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-zinc-200' />
								</div>
								<div className='relative flex justify-center text-xs'>
									<span className='bg-white px-2.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase'>
										OR CONTINUE WITH EMAIL
									</span>
								</div>
							</div>

							{/* Form */}
							<form className='grid gap-y-3.5' onSubmit={formik.handleSubmit}>
								{/* Email */}
								<div>
									<label
										htmlFor='email'
										className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
										EMAIL ADDRESS
									</label>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15'>
										<Icon icon='Mail01' className='size-4 text-zinc-400 shrink-0' />
										<input
											className='input-clean w-full border-0 border-none bg-transparent p-0 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='email'
											name='email'
											type='email'
											autoComplete='email'
											value={formik.values.email}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='name@example.com'
										/>
									</div>
									{formik.touched.email && formik.errors.email && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.email}
										</p>
									)}
								</div>

								{/* Password */}
								<div>
									<div className='mb-1.5 flex items-center justify-between'>
										<label
											htmlFor='password'
											className='text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
											PASSWORD
										</label>
										<Link
											className='text-xs font-medium text-zinc-500 transition-colors hover:text-primary-600'
											to={pages.pagesExamples.forgotPassword.to}>
											Forgot password?
										</Link>
									</div>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-primary-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/15'>
										<Icon icon='SquareLockPassword' className='size-4 text-zinc-400 shrink-0' />
										<input
											type={showPassword ? 'text' : 'password'}
											className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='password'
											name='password'
											autoComplete='current-password'
											value={formik.values.password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Enter your password'
										/>
										<button
											type='button'
											onClick={() => setShowPassword(!showPassword)}
											tabIndex={-1}
											aria-label='Toggle password visibility'
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

								{/* Remember Device Box */}
								<div className='flex items-center pt-1'>
									<label
										htmlFor='rememberMe'
										className='group flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900'>
										<input
											type='checkbox'
											id='rememberMe'
											name='rememberMe'
											checked={formik.values.rememberMe}
											onChange={formik.handleChange}
											className='size-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/30'
										/>
										<span>Remember this device</span>
									</label>
								</div>

								{/* Submit Button in Brand Accent */}
								<button
									type='submit'
									disabled={login.isPending}
									className='mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 active:bg-primary-800 disabled:pointer-events-none disabled:opacity-50'>
									{login.isPending && <Spinner className='size-4' />}
									SIGN IN TO DASHBOARD ›
								</button>
							</form>

							{/* Footer */}
							<p className='mt-6 text-center text-xs text-zinc-500'>
								Need an account?{' '}
								<Link
									to={pages.pagesExamples.signup.to}
									className='font-bold text-primary-600 transition-colors hover:text-primary-700'>
									Create one
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
