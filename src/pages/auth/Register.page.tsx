import { useState } from 'react';
import { Link } from 'react-router';
import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import pages from '@/Routes/pages';
import classNames from 'classnames';
import type { TColors } from '@/types/colors.type';
import { ApiError } from '@/api/core';
import { useSocialRedirect } from '@/api';
import { useAuth } from '@/context/authContext';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import * as Yup from 'yup';
import { Loader2 } from 'lucide-react';

interface IRegisterFormValues {
	name: string;
	registerEmail: string;
	newPassword: string;
	repeatPassword: string;
}

const passwordChecks = (password: string) => ({
	hasMinLength: password.length >= 8,
	hasUppercase: /[A-Z]/.test(password),
	hasLowercase: /[a-z]/.test(password),
	hasNumberOrSymbol: /[\d\s\W]/.test(password),
	hasNoRepeatingChars: password.length >= 3 && !/(.)\1{2,}/.test(password),
});

const validationSchema = Yup.object().shape({
	name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
	registerEmail: Yup.string().email('Enter a valid email address').required('Email is required'),
	newPassword: Yup.string()
		.required('New password is required')
		.min(8, 'Must be at least 8 characters')
		.matches(/[A-Z]/, 'Must contain at least one uppercase letter')
		.matches(/[a-z]/, 'Must contain at least one lowercase letter')
		.matches(/[\d\s\W]/, 'Must contain at least one number, symbol, or whitespace')
		.test(
			'no-repeating-chars',
			'Password must not contain the same character repeated 3 or more times in a row',
			(value) => !/(.)\1{2,}/.test(value || ''),
		),
	repeatPassword: Yup.string()
		.required('Please confirm your password')
		.oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const RegisterPage = () => {
	const { onRegister, isRegisterLoading } = useAuth();
	const socialRedirect = useSocialRedirect();

	const handleSocialLogin = async (provider: 'google' | 'github') => {
		const url = await socialRedirect.mutateAsync(provider).catch(() => null);
		if (url) window.location.href = url;
	};

	const formikRegister = useFormik<IRegisterFormValues>({
		initialValues: {
			name: '',
			registerEmail: '',
			newPassword: '',
			repeatPassword: '',
		},
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values, actions) => {
			try {
				await onRegister({
					name: values.name,
					email: values.registerEmail,
					password: values.newPassword,
					password_confirmation: values.repeatPassword,
				});
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						name: fieldErrors.name,
						registerEmail: fieldErrors.email,
						newPassword: fieldErrors.password,
						repeatPassword: fieldErrors.password_confirmation,
					});
				}
			}
		},
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const checks = passwordChecks(formikRegister.values.newPassword);
	const passedCount = Object.values(checks).filter(Boolean).length;
	const colorMap: { [key: number]: TColors } = {
		0: 'red',
		1: 'red',
		2: 'amber',
		3: 'amber',
		4: 'blue',
	};
	const passwordStrengthColor: TColors = colorMap[passedCount] ?? 'primary';

	return (
		<AuthShell
			badge='Join the platform'
			title={<span className='text-slate-950'>Create account</span>}
			subtitle='Join the community of builders automating real work.'
			mobileTitle='Launch faster with Agent1o1'
			mobileSubtitle='A focused onboarding flow for workflow automation.'
			footer={
				<div className='flex items-center justify-center gap-2'>
					<span className='font-medium tracking-wide text-zinc-400'>
						Already have an account?
					</span>
					<Link
						to={pages.pagesExamples.login.to}
						className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
						Log in
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
					or register with email
				</span>
				<div className='flex-grow border-t border-slate-200' />
			</div>

			<form className='space-y-6' onSubmit={formikRegister.handleSubmit}>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					<div className='space-y-2'>
						<label
							className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
							htmlFor='name'>
							Full name
						</label>
						<div className='group relative'>
							<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
								<Icon
									icon='User'
									className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
								/>
							</div>
							<input
								id='name'
								name='name'
								aria-label='Full name'
								autoComplete='name'
								placeholder='Jane Cooper'
								value={formikRegister.values.name}
								onChange={formikRegister.handleChange}
								onBlur={formikRegister.handleBlur}
								className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-11 text-sm font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
							/>
						</div>
						<AnimatePresence>
							{formikRegister.touched.name && formikRegister.errors.name && (
								<motion.p
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className='ml-1 text-[10px] font-medium text-red-500'>
									{formikRegister.errors.name}
								</motion.p>
							)}
						</AnimatePresence>
					</div>

					<div className='space-y-2'>
						<label
							className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
							htmlFor='registerEmail'>
							Work email
						</label>
						<div className='group relative'>
							<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
								<Icon
									icon='AiMail'
									className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
								/>
							</div>
							<input
								id='registerEmail'
								name='registerEmail'
								aria-label='Work email'
								type='email'
								autoComplete='section-register email'
								placeholder='jane@company.com'
								value={formikRegister.values.registerEmail}
								onChange={formikRegister.handleChange}
								onBlur={formikRegister.handleBlur}
								className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-11 text-sm font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
							/>
						</div>
						<AnimatePresence>
							{formikRegister.touched.registerEmail &&
								formikRegister.errors.registerEmail && (
									<motion.p
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className='ml-1 text-[10px] font-medium text-red-500'>
										{formikRegister.errors.registerEmail}
									</motion.p>
								)}
						</AnimatePresence>
					</div>
				</div>

				<div className='space-y-2'>
					<label
						className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
						htmlFor='newPassword'>
						Security password
					</label>
					<div className='group relative'>
						<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
							<Icon
								icon='AiLock'
								className='group-focus-within:text-primary-700 h-4 w-4 text-slate-400 transition-colors'
							/>
						</div>
						<input
							id='newPassword'
							name='newPassword'
							aria-label='Security password'
							type={showPassword ? 'text' : 'password'}
							autoComplete='section-register new-password'
							placeholder='Create a strong password'
							value={formikRegister.values.newPassword}
							onChange={formikRegister.handleChange}
							onBlur={formikRegister.handleBlur}
							className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-11 text-sm font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
						/>
						<button
							type='button'
							onClick={() => setShowPassword((value) => !value)}
							className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700'>
							<Icon icon={showPassword ? 'ViewOff' : 'View'} className='h-5 w-5' />
						</button>
					</div>
					<AnimatePresence>
						{formikRegister.touched.newPassword &&
							formikRegister.errors.newPassword && (
								<motion.p
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className='ml-1 text-[10px] font-medium text-red-500'>
									{formikRegister.errors.newPassword}
								</motion.p>
							)}
					</AnimatePresence>
				</div>

				<div className='space-y-2'>
					<label
						className='ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'
						htmlFor='repeatPassword'>
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
							id='repeatPassword'
							name='repeatPassword'
							aria-label='Confirm password'
							type={showConfirmPassword ? 'text' : 'password'}
							autoComplete='section-register new-password'
							placeholder='Repeat your password'
							value={formikRegister.values.repeatPassword}
							onChange={formikRegister.handleChange}
							onBlur={formikRegister.handleBlur}
							className='focus:border-primary-600 focus:shadow-primary-500/20 block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-11 text-sm font-medium text-slate-950 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-xl'
						/>
						<button
							type='button'
							onClick={() => setShowConfirmPassword((value) => !value)}
							className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700'>
							<Icon
								icon={showConfirmPassword ? 'ViewOff' : 'View'}
								className='h-5 w-5'
							/>
						</button>
					</div>
					<AnimatePresence>
						{formikRegister.touched.repeatPassword &&
							formikRegister.errors.repeatPassword && (
								<motion.p
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className='ml-1 text-[10px] font-medium text-red-500'>
									{formikRegister.errors.repeatPassword}
								</motion.p>
							)}
					</AnimatePresence>
				</div>

				<div className='grid grid-cols-5 gap-2'>
					{[0, 1, 2, 3, 4].map((index) => (
						<div
							key={index}
							className={classNames(
								'h-1.5 rounded-full transition-all duration-500',
								passedCount > index
									? passwordStrengthClass[passwordStrengthColor]
									: 'bg-slate-200',
							)}
						/>
					))}
				</div>

				<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
					<ul className='grid gap-2 text-[10px] font-bold sm:grid-cols-2'>
						{passwordRuleItems.map((item) => {
							const isPassed = checks[item.key];
							return (
								<li
									key={item.key}
									className={classNames(
										'flex items-center gap-2 transition-colors',
										isPassed ? 'text-primary-700' : 'text-slate-500',
									)}>
									<Icon
										icon={isPassed ? 'CheckmarkCircle01' : 'Cancel01'}
										className='h-3.5 w-3.5'
									/>
									{item.label}
								</li>
							);
						})}
					</ul>
				</div>

				<div className='rounded-2xl border border-slate-200 bg-slate-50 p-5 text-[11px] leading-relaxed font-medium text-slate-500 shadow-sm'>
					By creating an account, you agree to our{' '}
					<a
						href='/'
						className='hover:text-primary-700 font-bold text-slate-950 transition-colors'>
						Terms of Service
					</a>{' '}
					and{' '}
					<a
						href='/'
						className='hover:text-primary-700 font-bold text-slate-950 transition-colors'>
						Privacy Guidelines
					</a>
					.
				</div>

				<button
					type='submit'
					disabled={!formikRegister.isValid || isRegisterLoading}
					className='group bg-primary-400 hover:bg-primary-500 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(48,119,41,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
					{isRegisterLoading ? (
						<>
							<Loader2 className='h-5 w-5 animate-spin text-white' />
							<span>Creating account...</span>
						</>
					) : (
						<>
							<span>Create my account</span>
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

const passwordStrengthClass: Record<TColors, string> = {
	primary: 'bg-primary-400',
	secondary: 'bg-secondary-500',
	zinc: 'bg-zinc-500',
	red: 'bg-red-500',
	amber: 'bg-amber-500',
	lime: 'bg-lime-500',
	emerald: 'bg-emerald-500',
	sky: 'bg-sky-500',
	blue: 'bg-blue-500',
	violet: 'bg-primary-400',
};

const passwordRuleItems: { key: keyof ReturnType<typeof passwordChecks>; label: string }[] = [
	{ key: 'hasMinLength', label: 'At least 8 characters' },
	{ key: 'hasUppercase', label: 'One uppercase letter' },
	{ key: 'hasLowercase', label: 'One lowercase letter' },
	{ key: 'hasNumberOrSymbol', label: 'One number or symbol' },
	{ key: 'hasNoRepeatingChars', label: 'No 3 repeated characters' },
];

export default RegisterPage;
