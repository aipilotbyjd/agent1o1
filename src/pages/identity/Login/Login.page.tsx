import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLogin, useVerifyTwoFactor } from '@/api/modules/auth';
import { isTwoFactorChallenge } from '@/types/auth.type';
import { useAuth } from '@/context/auth';
import useAfterAuthRedirect, { AFTER_AUTH_PATH } from '@/hooks/useAfterAuthRedirect';
import pages from '@/Routes/pages';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';
import SocialAuthButtons from '../_partial/SocialAuthButtons.partial';

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

const LoginPage = () => {
	const location = useLocation();
	const { isAuthenticated, isLoading } = useAuth();
	const redirectAfterAuth = useAfterAuthRedirect();

	const login = useLogin();
	const verifyTwoFactor = useVerifyTwoFactor();

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

	if (!isLoading && isAuthenticated) return <Navigate to={from} replace />;

	return (
		<AuthLayout badge='WELCOME TO AGENT1O1'>
			<AuthCardHeader
				right={
					challenge ? (
						<span>Step 2 of 2</span>
					) : (
						<Link
							to={pages.identity.signup.to}
							className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
							Create account
						</Link>
					)
				}
			/>

			{challenge ? (
				<>
					{/* 2FA Challenge Header */}
					<div>
						<div className='bg-primary-100 text-primary-700 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase'>
							<Icon icon='ShieldCheck' className='size-3.5' />
							Two-Factor Challenge
						</div>
						<h2 className='mt-2.5 text-2xl font-extrabold tracking-tight text-zinc-950'>
							Enter 6-digit Code
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500'>
							Enter the 6-digit code from your authenticator app.
						</p>
					</div>

					<form className='mt-6 grid gap-y-4' onSubmit={twoFactorFormik.handleSubmit}>
						<div>
							<label
								htmlFor='code'
								className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
								Authentication code
							</label>
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon
									icon='SquareLockPassword'
									className='size-4 shrink-0 text-zinc-400'
								/>
								<input
									className='input-clean w-full border-0 border-none bg-transparent p-0 text-center font-mono text-base tracking-[0.4em] text-zinc-950 shadow-none placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 active:bg-primary-800 mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:pointer-events-none disabled:opacity-50'>
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
						<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
							Sign in
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500'>
							Continue building reliable AI workflows.
						</p>
					</div>

					{/* Social Buttons */}
					<div className='mt-6'>
						<SocialAuthButtons />
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
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon icon='Mail01' className='size-4 shrink-0 text-zinc-400' />
								<input
									className='input-clean w-full border-0 border-none bg-transparent p-0 text-sm font-medium text-zinc-950 shadow-none placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
								<p className='mt-1 text-xs text-red-500'>{formik.errors.email}</p>
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
									className='hover:text-primary-600 text-xs font-medium text-zinc-500 transition-colors'
									to={pages.identity.forgotPassword.to}>
									Forgot password?
								</Link>
							</div>
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon
									icon='SquareLockPassword'
									className='size-4 shrink-0 text-zinc-400'
								/>
								<input
									type={showPassword ? 'text' : 'password'}
									className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-950 shadow-none placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
								className='group flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600 select-none hover:text-zinc-950'>
								<input
									type='checkbox'
									id='rememberMe'
									name='rememberMe'
									checked={formik.values.rememberMe}
									onChange={formik.handleChange}
									className='text-primary-600 focus:ring-primary-500/30 size-4 rounded border-zinc-300'
								/>
								<span>Remember this device</span>
							</label>
						</div>

						{/* Submit Button in Brand Accent */}
						<button
							type='submit'
							disabled={login.isPending}
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 active:bg-primary-800 mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:pointer-events-none disabled:opacity-50'>
							{login.isPending && <Spinner className='size-4' />}
							SIGN IN TO DASHBOARD ›
						</button>
					</form>

					{/* Footer */}
					<p className='mt-6 text-center text-xs text-zinc-500'>
						Need an account?{' '}
						<Link
							to={pages.identity.signup.to}
							className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
							Create one
						</Link>
					</p>
				</>
			)}
		</AuthLayout>
	);
};

export default LoginPage;
