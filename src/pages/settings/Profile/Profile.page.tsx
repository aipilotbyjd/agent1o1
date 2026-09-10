import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { useFormik } from 'formik';
import {
	ChevronDown,
	Trash2,
	Upload,
	Mail,
	User,
	Globe,
	Building2,
	Calendar,
	Camera,
	HelpCircle,
	Bell,
	AlertCircle,
} from 'lucide-react';
import { ApiError } from '@/api/core';
import {
	useDeleteAccount,
	useDeleteAvatar,
	useUpdateProfile,
	useUploadAvatar,
} from '@/api/modules/auth';
import { useAuth } from '@/context/auth';
import { useConfirm } from '@/context/confirm';
import { primaryBtn, secondaryBtn, dangerBtn } from '@/pages/settings/_shared/buttons';

type TProfileForm = {
	firstName: string;
	lastName: string;
	email: string;
};

const inputClass =
	'h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/25';

const errorClass = 'mt-2 text-xs font-semibold text-red-500';

const splitName = (name?: string): Pick<TProfileForm, 'firstName' | 'lastName'> => {
	const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
	return {
		firstName: parts[0] ?? '',
		lastName: parts.slice(1).join(' '),
	};
};

const toFullName = (firstName: string, lastName: string) =>
	[firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const getInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return 'U';
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
};

const formatDate = (value?: string | null) => {
	if (!value) return 'Not available';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Not available';
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date);
};

const formatRole = (role?: string) => {
	if (!role) return 'Member';
	return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
};

const SettingsFieldRow = ({
	icon: FieldIcon,
	title,
	description,
	children,
}: {
	icon: ComponentType<{ size?: number; className?: string }>;
	title: string;
	description: string;
	children: ReactNode;
}) => (
	<div className='grid gap-4 border-b border-zinc-100/80 py-5 lg:grid-cols-[260px_1fr] lg:items-center dark:border-zinc-800/80'>
		<div className='flex items-start gap-4'>
			<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400'>
				<FieldIcon size={16} />
			</div>
			<div>
				<div className='text-sm font-bold text-zinc-950 dark:text-zinc-50'>{title}</div>
				<div className='mt-0.5 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
					{description}
				</div>
			</div>
		</div>
		<div className='flex w-full min-w-0 items-center justify-start'>{children}</div>
	</div>
);

const ProfilePage = () => {
	const navigate = useNavigate();
	const { userData } = useAuth();
	const { confirm } = useConfirm();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const updateProfile = useUpdateProfile();
	const uploadAvatar = useUploadAvatar();
	const deleteAvatar = useDeleteAvatar();
	const deleteAccount = useDeleteAccount();

	const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

	const initialValues = useMemo<TProfileForm>(() => {
		const nameParts = splitName(userData?.name);
		return {
			...nameParts,
			email: userData?.email ?? '',
		};
	}, [userData?.email, userData?.name]);

	const formik = useFormik<TProfileForm>({
		initialValues,
		enableReinitialize: true,
		validate: (values) => {
			const nextName = toFullName(values.firstName, values.lastName);
			const nextEmail = values.email.trim();
			const nextErrors: Partial<TProfileForm> = {};

			if (!nextName) nextErrors.firstName = 'Full name is required';
			if (!nextEmail) nextErrors.email = 'Email is required';

			return nextErrors;
		},
		onSubmit: async (values, actions) => {
			if (!userData) return;

			const nextName = toFullName(values.firstName, values.lastName);
			const nextEmail = values.email.trim();

			try {
				await updateProfile.mutateAsync({
					name: nextName,
					email: nextEmail,
				});
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						firstName: fieldErrors.name,
						email: fieldErrors.email,
					});
				}
			}
		},
	});

	const fullName = useMemo(
		() => toFullName(formik.values.firstName, formik.values.lastName),
		[formik.values.firstName, formik.values.lastName],
	);

	const displayName = fullName || userData?.name || 'Sahil';
	const joinedAt = formatDate(userData?.created_at || '2026-06-01');
	const workspaceName = userData?.current_workspace?.name ?? 'asdas';
	const workspaceRole = formatRole(userData?.current_workspace?.role);
	const emailStatus = userData?.email_verified_at ? 'Email verified' : 'Email not verified';
	const isProfileDirty = Boolean(
		userData && (fullName !== userData.name || formik.values.email.trim() !== userData.email),
	);

	const resetForm = () => {
		formik.resetForm();
	};

	const showError = (field: keyof TProfileForm) =>
		(Boolean(formik.touched[field]) || formik.submitCount > 0) && formik.errors[field];

	const handleProfileSubmit = formik.handleSubmit;

	const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			await uploadAvatar.mutateAsync(file);
		} catch {
			// Toast is handled by the API hook.
		} finally {
			event.target.value = '';
		}
	};

	const handleDeleteAccount = async () => {
		const confirmed = await confirm({
			title: 'Delete Account',
			confirmText: 'Delete Account',
			message:
				'This will permanently delete your account and all of its data. This action cannot be undone.',
		});
		if (!confirmed) return;

		try {
			await deleteAccount.mutateAsync();
			navigate('/login', { replace: true });
		} catch {
			// Toast is handled by the API hook.
		}
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6 flex items-start justify-between'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Profile
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Manage your account settings and preferences
					</p>
				</div>
			</div>

			{/* Email verification status bar */}
			<div className='mb-6 flex justify-end gap-3'>
				<div className='flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 shadow-xs dark:border-orange-950/20 dark:bg-orange-950/10 dark:text-orange-400'>
					<AlertCircle size={14} className='text-orange-500' />
					<span>{emailStatus}</span>
				</div>
				{!userData?.email_verified_at && (
					<button
						type='button'
						className='rounded-xl border border-primary-400 bg-white px-4 py-1.5 text-xs font-bold text-primary-800 shadow-xs transition hover:bg-primary-50 dark:border-primary-800 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
						Verify Email
					</button>
				)}
			</div>

			<form onSubmit={handleProfileSubmit}>
				{/* Avatar / Photo Upload Card */}
				<div className='dark:border-zinc-800 mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
					<div className='flex flex-wrap items-center justify-between gap-6'>
						<div className='flex items-center gap-5'>
							{/* Squircle Avatar with Camera Overlay */}
							<div className='relative'>
								<div className='flex h-20 w-20 items-center justify-center rounded-[22px] bg-primary-100 text-3xl font-black text-primary-800 dark:bg-primary-400/15 dark:text-primary-300'>
									{getInitials(displayName)}
								</div>
								<button
									type='button'
									onClick={() => fileInputRef.current?.click()}
									className='absolute -right-1 -bottom-1 flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-primary-400 text-primary-950 shadow-md transition hover:bg-primary-500 active:scale-95'
									title='Change photo'>
									<Camera size={13} />
								</button>
							</div>

							<div>
								<h2 className='flex items-center gap-2 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
									<span>{displayName}</span>
									<span className='rounded-md bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300'>
										{workspaceRole}
									</span>
								</h2>
								<div className='mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
									<Calendar size={13.5} />
									<span>Joined on {joinedAt}</span>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex flex-col items-end gap-1.5'>
							<div className='flex items-center gap-3'>
								<input
									ref={fileInputRef}
									type='file'
									accept='image/*'
									aria-label='Upload profile photo'
									className='hidden'
									onChange={handleAvatarUpload}
								/>
								<button
									type='button'
									disabled={uploadAvatar.isPending}
									onClick={() => fileInputRef.current?.click()}
									className={primaryBtn}>
									<Upload size={16} />
									<span>
										{uploadAvatar.isPending ? 'Uploading...' : 'Upload Photo'}
									</span>
								</button>
								<button
									type='button'
									disabled={deleteAvatar.isPending}
									onClick={() => deleteAvatar.mutate()}
									className={secondaryBtn}>
									Remove
								</button>
							</div>
							<span className='mr-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
								PNG, JPG or JPEG (max 5MB)
							</span>
						</div>
					</div>
				</div>

				{/* Input Fields Card */}
				<div className='dark:border-zinc-800 rounded-2xl border border-zinc-100 bg-white px-6 py-2 shadow-sm dark:bg-zinc-950'>
					{/* Full Name Row */}
					<SettingsFieldRow
						icon={User}
						title='Full Name'
						description='Your first and last name, as visible to others.'>
						<div className='grid w-full gap-3 sm:grid-cols-2'>
							<div>
								<input
									className={inputClass}
									name='firstName'
									value={formik.values.firstName}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									placeholder='First name'
									aria-label='First name'
								/>
								{showError('firstName') && (
									<p className={errorClass}>{formik.errors.firstName}</p>
								)}
							</div>
							<div>
								<input
									className={inputClass}
									name='lastName'
									value={formik.values.lastName}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									placeholder='Last name'
									aria-label='Last name'
								/>
								{showError('lastName') && (
									<p className={errorClass}>{formik.errors.lastName}</p>
								)}
							</div>
						</div>
					</SettingsFieldRow>

					{/* Email Row */}
					<SettingsFieldRow
						icon={Mail}
						title='Email'
						description='Used for sign in and account notifications.'>
						<div className='w-full'>
							<input
								className={inputClass}
								name='email'
								value={formik.values.email}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								type='email'
								aria-label='Email'
							/>
							{showError('email') && (
								<p className={errorClass}>{formik.errors.email}</p>
							)}
						</div>
					</SettingsFieldRow>

					{/* Workspace Row */}
					<SettingsFieldRow
						icon={Building2}
						title='Current Workspace'
						description='Your primary workspace and role.'>
						<div className='relative w-full'>
							<select
								aria-label='Current Workspace'
								className={`${inputClass} appearance-none pr-11`}>
								<option value={workspaceName}>{workspaceName}</option>
							</select>
							<ChevronDown
								size={18}
								className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400'
							/>
						</div>
					</SettingsFieldRow>

					{/* Timezone Row */}
					<SettingsFieldRow
						icon={Globe}
						title='Timezone'
						description='Your local timezone for time-based features.'>
						<div className='relative w-full'>
							<select
								aria-label='Timezone'
								defaultValue='Asia/Kolkata'
								className={`${inputClass} appearance-none pr-11`}>
								<option value='Asia/Kolkata'>Asia/Kolkata</option>
								<option value='America/New_York'>America/New_York</option>
								<option value='Europe/London'>Europe/London</option>
								<option value='UTC'>UTC</option>
							</select>
							<ChevronDown
								size={18}
								className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400'
							/>
						</div>
					</SettingsFieldRow>
				</div>

				{/* Save / Reset Actions Row */}
				<div className='mt-5 flex items-center justify-end gap-3'>
					<button
						type='button'
						disabled={!isProfileDirty || updateProfile.isPending}
						onClick={resetForm}
						className={secondaryBtn}>
						Reset
					</button>
					<button
						type='submit'
						disabled={!isProfileDirty || updateProfile.isPending}
						className={primaryBtn}>
						{updateProfile.isPending ? 'Saving...' : 'Save changes'}
					</button>
				</div>
			</form>

			{/* Collapsible Danger Zone Section */}
			<div className='dark:border-zinc-800 mt-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
				<button
					type='button'
					onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
					className='flex w-full items-center justify-between text-left'>
					<div>
						<h2 className='text-base font-bold text-red-500'>Danger zone</h2>
						<p className='mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Irreversible and sensitive actions.
						</p>
					</div>
					<ChevronDown
						size={20}
						className={`text-zinc-400 transition-transform duration-200 ${
							isDangerZoneOpen ? 'rotate-180' : ''
						}`}
					/>
				</button>

				{isDangerZoneOpen && (
					<div className='mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800'>
						<div className='max-w-2xl'>
							<div className='flex items-center gap-2 text-sm font-bold text-red-500'>
								<Trash2 size={16} />
								<span>Delete account</span>
							</div>
							<p className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
								This action cannot be undone. This will permanently delete your
								account and all of its data.
							</p>
						</div>
						<button
							type='button'
							disabled={deleteAccount.isPending}
							onClick={handleDeleteAccount}
							className={dangerBtn}>
							{deleteAccount.isPending ? 'Deleting...' : 'Delete account'}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfilePage;
