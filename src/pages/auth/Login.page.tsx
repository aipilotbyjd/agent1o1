import { useState } from 'react';
import { Link } from 'react-router';
import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import pages from '@/Routes/pages';
import { ApiError } from '@/api/core';
import { useSocialRedirect } from '@/api';
import { useAuth } from '@/context/authContext';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import * as Yup from 'yup';
import { Loader2 } from 'lucide-react';

interface IFormValues {
	email: string;
	password: string;
	rememberMe: boolean;
}

const validationSchema = Yup.object().shape({
	email: Yup.string().email('Enter a valid email address').required('Email is required'),
	password: Yup.string().required('Password is required'),
});

const LoginPage = () => {
	const { onLogin, isLoginLoading } = useAuth();
	const socialRedirect = useSocialRedirect();
	const [showPassword, setShowPassword] = useState(false);

	const handleSocialLogin = async (provider: 'google' | 'github') => {
		const url = await socialRedirect.mutateAsync(provider).catch(() => null);
		if (url) window.location.href = url;
	};

	const formik = useFormik<IFormValues>({
		initialValues: {
			email: '',
			password: '',
			rememberMe: false,
		},
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values, actions) => {
			try {
				await onLogin(values.email, values.password, values.rememberMe);
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						email: fieldErrors.email,
						password: fieldErrors.password,
					});
				}
			}
		},
	});

	return (
		<AuthShell
			badge='Welcome back'
			title={<span className='text-slate-950'>Sign in</span>}
			subtitle='Continue building reliable AI workflows.'
			mobileTitle='Welcome back to Agent1o1'
			mobileSubtitle='Access your workspace and keep automations moving.'
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
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
				<button
					type='button'
					onClick={() => handleSocialLogin('google')}
					disabled={socialRedirect.isPending}
					className='group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'>
					<Icon icon='Google' className='h-5 w-5' />
					Google
				</button>
				<button
					type='button'
					onClick={() => handleSocialLogin('github')}
					disabled={socialRedirect.isPending}
					className='group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-xs font-bold tracking-wide text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'>
					<Icon icon='Github' className='h-5 w-5 text-white' />
					Github
				</button>
			</motion.div>

			<div className='relative mb-8 flex items-center'>
				<div className='flex-grow border-t border-slate-200' />
				<span className='mx-4 flex-shrink text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase'>
					or continue with email
				</span>
				<div className='flex-grow border-t border-slate-200' />
			</div>

			<form className='space-y-6' onSubmit={formik.handleSubmit}>
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
							aria-label='Email address'
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

				<div className='space-y-2'>
					<div className='ml-1 flex items-center justify-between'>
						<label
							className='text-[10px] font-bold tracking-widest text-slate-500 uppercase'
							htmlFor='password'>
							Password
						</label>
						<Link
							to={pages.auth.forgotPassword.to}
							className='hover:text-primary-700 text-[10px] font-bold text-slate-500 transition-colors'>
							Forgot password?
						</Link>
					</div>
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
							aria-label='Password'
							type={showPassword ? 'text' : 'password'}
							autoComplete='current-password'
							placeholder='Enter your password'
							value={formik.values.password}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-11 text-base font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
						/>
						<button
							type='button'
							onClick={() => setShowPassword((value) => !value)}
							className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700'>
							<Icon icon={showPassword ? 'ViewOff' : 'View'} className='h-5 w-5' />
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

				<motion.label
					whileHover={{ backgroundColor: 'rgb(241, 245, 249)' }}
					className='flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] font-bold text-slate-600 shadow-sm transition-colors'>
					<input
						id='rememberMe'
						name='rememberMe'
						aria-label='Remember this device'
						type='checkbox'
						checked={formik.values.rememberMe}
						onChange={formik.handleChange}
						className='text-primary-600 focus:ring-primary-500/20 h-4 w-4 rounded-md border-zinc-300'
					/>
					Remember this device
				</motion.label>

				<button
					type='submit'
					disabled={!formik.isValid || isLoginLoading}
					className='group bg-primary-400 hover:bg-primary-500 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(48,119,41,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
					{isLoginLoading ? (
						<>
							<Loader2 className='h-5 w-5 animate-spin text-white' />
							<span>Signing in...</span>
						</>
					) : (
						<>
							<span>Sign in to dashboard</span>
							<Icon
								icon='ArrowRight01'
								className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
							/>
						</>
					)}
				</button>
			</form>
		</AuthShell>
	);
};

export default LoginPage;
