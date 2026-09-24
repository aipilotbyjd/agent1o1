import { useFormik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useChangePassword } from '@/api/modules/auth';
import { primaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass, errorClass, inputClass } from '../_helper/security.helper';

type TPasswordForm = {
	current_password: string;
	password: string;
	password_confirmation: string;
	revoke_other_sessions: boolean;
};

const fields: {
	name: keyof Omit<TPasswordForm, 'revoke_other_sessions'>;
	label: string;
	autoComplete: string;
}[] = [
	{ name: 'current_password', label: 'Current password', autoComplete: 'current-password' },
	{ name: 'password', label: 'New password', autoComplete: 'new-password' },
	{ name: 'password_confirmation', label: 'Confirm new password', autoComplete: 'new-password' },
];

const PasswordCard = () => {
	const queryClient = useQueryClient();
	const changePassword = useChangePassword();

	const formik = useFormik<TPasswordForm>({
		initialValues: {
			current_password: '',
			password: '',
			password_confirmation: '',
			revoke_other_sessions: true,
		},
		validate: (values) => {
			const errors: Partial<Record<keyof TPasswordForm, string>> = {};
			if (!values.current_password) errors.current_password = 'Enter your current password';
			if (values.password.length < 8) errors.password = 'Use at least 8 characters';
			if (values.password_confirmation !== values.password) {
				errors.password_confirmation = 'Passwords do not match';
			}
			return errors;
		},
		onSubmit: async (values, actions) => {
			try {
				await changePassword.mutateAsync(values);
				notify.success(
					values.revoke_other_sessions
						? 'Password updated. Other devices were signed out.'
						: 'Password updated.',
				);
				actions.resetForm();
				void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
				void queryClient.invalidateQueries({ queryKey: ['auth-events'] });
			} catch (error) {
				if (ApiError.is(error)) actions.setErrors(error.fieldErrors());
			}
		},
	});

	const showError = (field: keyof TPasswordForm) =>
		(formik.touched[field] || formik.submitCount > 0) && formik.errors[field];

	return (
		<section className={cardClass}>
			<div className='flex items-start gap-4'>
				<div className='bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
					<LockKeyhole size={16} />
				</div>
				<div>
					<h2 className='text-base font-black text-zinc-950 dark:text-zinc-50'>
						Password
					</h2>
					<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						Change the password you use to sign in.
					</p>
				</div>
			</div>

			<form onSubmit={formik.handleSubmit} className='mt-5 space-y-4' noValidate>
				<div className='grid gap-4 md:grid-cols-3'>
					{fields.map((field) => (
						<div key={field.name}>
							<label
								htmlFor={`security-${field.name}`}
								className='mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300'>
								{field.label}
							</label>
							<input
								id={`security-${field.name}`}
								aria-label={field.label}
								type='password'
								name={field.name}
								autoComplete={field.autoComplete}
								className={inputClass}
								value={formik.values[field.name]}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
							{showError(field.name) && (
								<p className={errorClass}>{formik.errors[field.name]}</p>
							)}
						</div>
					))}
				</div>

				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<label className='flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
						<input
							type='checkbox'
							name='revoke_other_sessions'
							aria-label='Sign out of all other devices'
							checked={formik.values.revoke_other_sessions}
							onChange={formik.handleChange}
							className='accent-primary-500 size-4 rounded'
						/>
						Sign out of all other devices
					</label>
					<button
						type='submit'
						disabled={changePassword.isPending || !formik.dirty}
						className={primaryBtn}>
						{changePassword.isPending ? 'Updating...' : 'Update password'}
					</button>
				</div>
			</form>
		</section>
	);
};

export default PasswordCard;
