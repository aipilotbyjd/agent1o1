import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useChangePassword } from '@/api/modules/auth';
import { primaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass, errorClass, inputClass, labelClass } from '../_helper/security.constants';

// ============================================================
// Change password
// ------------------------------------------------------------
// POST /auth/change-password. `revoke_other_sessions` is the
// API's own flag — ticking it invalidates every other issued
// token, which is why it sits on this form rather than in the
// sessions card.
// ============================================================

interface IFormValues {
	current_password: string;
	password: string;
	password_confirmation: string;
	revoke_other_sessions: boolean;
}

const validationSchema = Yup.object().shape({
	current_password: Yup.string().required('Enter your current password'),
	password: Yup.string()
		.required('Enter a new password')
		.min(8, 'Use at least 8 characters')
		.notOneOf([Yup.ref('current_password')], 'Choose a password you have not used here before'),
	password_confirmation: Yup.string()
		.required('Repeat the new password')
		.oneOf([Yup.ref('password')], 'Passwords do not match'),
});

const PasswordField = ({
	name,
	label,
	autoComplete,
	value,
	error,
	onChange,
	onBlur,
}: {
	name: keyof IFormValues;
	label: string;
	autoComplete: string;
	value: string;
	error?: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<div>
			<label className={labelClass} htmlFor={name}>
				{label}
			</label>
			<div className='relative'>
				<input
					id={name}
					name={name}
					type={isVisible ? 'text' : 'password'}
					autoComplete={autoComplete}
					className={`${inputClass} pr-11`}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
				/>
				<button
					type='button'
					aria-label={isVisible ? 'Hide password' : 'Show password'}
					onClick={() => setIsVisible((v) => !v)}
					className='absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200'>
					{isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
				</button>
			</div>
			{error && <p className={errorClass}>{error}</p>}
		</div>
	);
};

const ChangePasswordCard = () => {
	const changePassword = useChangePassword();

	const formik = useFormik<IFormValues>({
		initialValues: {
			current_password: '',
			password: '',
			password_confirmation: '',
			revoke_other_sessions: false,
		},
		validationSchema,
		onSubmit: async (values, actions) => {
			try {
				await changePassword.mutateAsync(values);
				notify.success('Password updated.');
				actions.resetForm();
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						current_password: fieldErrors.current_password,
						password: fieldErrors.password,
					});
				}
			}
		},
	});

	const showError = (field: keyof IFormValues) =>
		formik.touched[field] && formik.errors[field] ? (formik.errors[field] as string) : undefined;

	return (
		<section className={cardClass}>
			<div className='mb-5 flex items-start gap-3'>
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-400/15 dark:text-primary-300'>
					<KeyRound size={16} />
				</div>
				<div>
					<h2 className='text-base font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Password
					</h2>
					<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Change the password you use to sign in.
					</p>
				</div>
			</div>

			<form onSubmit={formik.handleSubmit} className='grid gap-4 sm:max-w-md'>
				<PasswordField
					name='current_password'
					label='Current password'
					autoComplete='current-password'
					value={formik.values.current_password}
					error={showError('current_password')}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
				/>
				<PasswordField
					name='password'
					label='New password'
					autoComplete='new-password'
					value={formik.values.password}
					error={showError('password')}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
				/>
				<PasswordField
					name='password_confirmation'
					label='Confirm new password'
					autoComplete='new-password'
					value={formik.values.password_confirmation}
					error={showError('password_confirmation')}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
				/>

				<label className='flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
					<input
						type='checkbox'
						name='revoke_other_sessions'
						checked={formik.values.revoke_other_sessions}
						onChange={formik.handleChange}
						className='mt-0.5 h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20'
					/>
					<span>
						<span className='flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
							<ShieldCheck size={13.5} className='text-primary-500' />
							Sign out other devices
						</span>
						<span className='mt-0.5 block text-xs font-medium text-zinc-400 dark:text-zinc-500'>
							Revokes every other session as part of this change.
						</span>
					</span>
				</label>

				<div>
					<button
						type='submit'
						disabled={changePassword.isPending || !formik.dirty}
						className={primaryBtn}>
						{changePassword.isPending ? 'Updating…' : 'Update password'}
					</button>
				</div>
			</form>
		</section>
	);
};

export default ChangePasswordCard;
