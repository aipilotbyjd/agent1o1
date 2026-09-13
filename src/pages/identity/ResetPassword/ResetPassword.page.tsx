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
import AuthLayout from '../_partial/AuthLayout.part';
import AuthCardHeader from '../_partial/AuthCardHeader.part';

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
		<AuthLayout badge='RESET PASSWORD'>
			<AuthCardHeader
				right={
					<Link
						to={pages.identity.login.to}
						className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
						Back to sign in
					</Link>
				}
			/>

			{isSuccess ? (
				<div className='grid gap-y-5 text-center'>
					<div>
						<h2 className='text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl'>
							Password reset!
						</h2>
						<p className='mt-2 text-xs font-medium text-zinc-500'>
							Your password has been reset successfully. Previous active sessions have
							been signed out.
						</p>
					</div>

					<Alert
						color='emerald'
						variant='soft'
						icon='CheckmarkCircle02'
						className='text-left text-xs'>
						You can now sign in with your new credentials.
					</Alert>

					<Link to={pages.identity.login.to}>
						<button
							type='button'
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase shadow-md transition-all'>
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
							This password reset link is missing required parameters or has expired.
						</p>
					</div>

					<Alert color='red' variant='soft' icon='Alert02' className='text-left text-xs'>
						Reset links are valid for 60 minutes and can only be used once.
					</Alert>

					<Link to={pages.identity.forgotPassword.to}>
						<button
							type='button'
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase shadow-md transition-all'>
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
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon
									icon='SquareLockPassword'
									className='size-4 shrink-0 text-zinc-400'
								/>
								<input
									type={showPassword ? 'text' : 'password'}
									className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-900 shadow-none placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon
									icon='SquareLockPassword'
									className='size-4 shrink-0 text-zinc-400'
								/>
								<input
									type={showConfirm ? 'text' : 'password'}
									className='input-clean w-full border-0 border-none bg-transparent p-0 font-mono text-sm text-zinc-900 shadow-none placeholder:font-sans placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
							disabled={resetPassword.isPending || passedCount < 5}
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 active:bg-primary-800 mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase shadow-md transition-all disabled:pointer-events-none disabled:opacity-50'>
							{resetPassword.isPending && <Spinner className='size-4' />}
							RESET PASSWORD ›
						</button>
					</form>

					<p className='mt-5 text-center text-xs text-zinc-500'>
						Back to{' '}
						<Link
							to={pages.identity.login.to}
							className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
							Sign in
						</Link>
					</p>
				</>
			)}
		</AuthLayout>
	);
};

export default ResetPasswordPage;
