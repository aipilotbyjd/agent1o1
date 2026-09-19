import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import classNames from 'classnames';
import { useRegister } from '@/api/modules/auth';
import { useAuth } from '@/context/auth';
import useAfterAuthRedirect, { AFTER_AUTH_PATH } from '@/hooks/useAfterAuthRedirect';
import pages from '@/Routes/pages';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import Progress from '@/components/ui/Progress';
import List, { Li } from '@/components/ui/List';
import { TColors } from '@/types/colors.type';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';
import SocialAuthButtons from '../_partial/SocialAuthButtons.partial';

interface IRegisterFormValues {
	name: string;
	email: string;
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
	name: Yup.string().required('Your name is required').max(255, 'Must be 255 characters or less'),
	email: Yup.string().email('Enter a valid email address').required('Email is required'),
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

const RegisterPage = () => {
	const { isAuthenticated, isLoading } = useAuth();
	const redirectAfterAuth = useAfterAuthRedirect();

	const register = useRegister();

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const formik = useFormik<IRegisterFormValues>({
		initialValues: { name: '', email: '', password: '', password_confirmation: '' },
		validationSchema,
		onSubmit: async (values) => {
			try {
				await register.mutateAsync(values);
				await redirectAfterAuth();
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

	if (!isLoading && isAuthenticated) return <Navigate to={AFTER_AUTH_PATH} replace />;

	return (
		<AuthLayout badge='GET STARTED WITH AGENT1O1'>
			<AuthCardHeader
				right={
					<>
						Have an account?{' '}
						<Link
							to={pages.identity.login.to}
							className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
							Sign in
						</Link>
					</>
				}
			/>

			{/* Header */}
			<div>
				<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
					Create account
				</h2>
				<p className='mt-1 text-xs font-medium text-zinc-500'>
					Join agent1o1 and begin building autonomous agents.
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
			<form className='grid gap-y-3' onSubmit={formik.handleSubmit}>
				{/* Full Name */}
				<div>
					<label
						htmlFor='name'
						className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
						FULL NAME
					</label>
					<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
						<Icon icon='User' className='size-4 shrink-0 text-zinc-400' />
						<input
							className='input-clean w-full border-0 border-none bg-transparent p-0 text-sm font-medium text-zinc-950 shadow-none placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
							id='name'
							name='name'
							autoComplete='name'
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							placeholder='Jane Doe'
						/>
					</div>
					{formik.touched.name && formik.errors.name && (
						<p className='mt-1 text-xs text-red-500'>{formik.errors.name}</p>
					)}
				</div>

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
					<label
						htmlFor='password'
						className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
						PASSWORD
					</label>
					<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
						<Icon icon='SquareLockPassword' className='size-4 shrink-0 text-zinc-400' />
						<input
							type={showPassword ? 'text' : 'password'}
							className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-950 shadow-none placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
							id='password'
							name='password'
							autoComplete='new-password'
							value={formik.values.password}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							placeholder='Create a password'
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
						<p className='mt-1 text-xs text-red-500'>{formik.errors.password}</p>
					)}
				</div>

				{/* Confirm Password */}
				<div>
					<label
						htmlFor='password_confirmation'
						className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
						CONFIRM PASSWORD
					</label>
					<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
						<Icon icon='SquareLockPassword' className='size-4 shrink-0 text-zinc-400' />
						<input
							type={showConfirm ? 'text' : 'password'}
							className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-950 shadow-none placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
							id='password_confirmation'
							name='password_confirmation'
							autoComplete='new-password'
							value={formik.values.password_confirmation}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							placeholder='Confirm your password'
						/>
						<button
							type='button'
							onClick={() => setShowConfirm(!showConfirm)}
							tabIndex={-1}
							className='cursor-pointer text-zinc-400 hover:text-zinc-600 focus:outline-none'>
							<Icon icon={showConfirm ? 'View' : 'ViewOffSlash'} className='size-4' />
						</button>
					</div>
					{formik.touched.password_confirmation &&
						formik.errors.password_confirmation && (
							<p className='mt-1 text-xs text-red-500'>
								{formik.errors.password_confirmation}
							</p>
						)}
				</div>

				{/* Password Strength Meter */}
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
					<List
						type='list-none'
						className='mt-1 grid grid-cols-2 gap-x-2 text-[11px] text-zinc-500'>
						<Li
							iconProps={{
								icon: checks.hasMinLength ? 'Tick02' : 'Cancel01',
								color: checks.hasMinLength ? 'emerald' : 'red',
							}}
							className={classNames({
								'font-medium text-emerald-600': checks.hasMinLength,
							})}>
							8+ chars
						</Li>
						<Li
							iconProps={{
								icon: checks.hasUppercase ? 'Tick02' : 'Cancel01',
								color: checks.hasUppercase ? 'emerald' : 'red',
							}}
							className={classNames({
								'font-medium text-emerald-600': checks.hasUppercase,
							})}>
							Uppercase
						</Li>
						<Li
							iconProps={{
								icon: checks.hasLowercase ? 'Tick02' : 'Cancel01',
								color: checks.hasLowercase ? 'emerald' : 'red',
							}}
							className={classNames({
								'font-medium text-emerald-600': checks.hasLowercase,
							})}>
							Lowercase
						</Li>
						<Li
							iconProps={{
								icon: checks.hasNumber ? 'Tick02' : 'Cancel01',
								color: checks.hasNumber ? 'emerald' : 'red',
							}}
							className={classNames({
								'font-medium text-emerald-600': checks.hasNumber,
							})}>
							Number
						</Li>
					</List>
				</div>

				{/* Submit Button */}
				<button
					type='submit'
					disabled={register.isPending || passedCount < 5}
					className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 active:bg-primary-800 mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:pointer-events-none disabled:opacity-50'>
					{register.isPending && <Spinner className='size-4' />}
					CREATE ACCOUNT ›
				</button>
			</form>

			{/* Footer */}
			<p className='mt-5 text-center text-xs text-zinc-500'>
				Already have an account?{' '}
				<Link
					to={pages.identity.login.to}
					className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
					Sign in
				</Link>
			</p>
		</AuthLayout>
	);
};

export default RegisterPage;
