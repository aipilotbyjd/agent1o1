import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
	useChangePassword,
	useEnableTwoFactor,
	useConfirmTwoFactor,
	useDisableTwoFactor,
	useRegenerateRecoveryCodes,
	useAuthSessions,
	useRevokeSession,
	useLogoutAll,
	useResendVerificationEmail,
} from '@/api/modules/auth';
import {
	useCurrentUser,
	useUpdateProfile,
	useUploadAvatar,
	useDeleteAvatar,
	useDeleteAccount,
	useApiKeys,
	useCreateApiKey,
	useDeleteApiKey,
} from '@/api/modules/user';
import type { TApiKeyAbility } from '@/types/auth.type';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft } from '@/components/layout/Subheader';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import FieldWrap from '@/components/form/FieldWrap';
import Validation from '@/components/form/Validation';
import Checkbox from '@/components/form/Checkbox';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';

const changePasswordSchema = Yup.object().shape({
	current_password: Yup.string().required('Current password is required'),
	password: Yup.string()
		.required('New password is required')
		.min(8, 'Must be at least 8 characters')
		.matches(/[A-Z]/, 'Must contain at least one uppercase letter')
		.matches(/[a-z]/, 'Must contain at least one lowercase letter')
		.matches(/\d/, 'Must contain at least one number')
		.matches(/[^A-Za-z0-9]/, 'Must contain at least one symbol'),
	password_confirmation: Yup.string()
		.required('Please confirm your new password')
		.oneOf([Yup.ref('password')], 'Passwords must match'),
	revoke_other_sessions: Yup.boolean(),
});

const AccountSecurityPage = () => {
	const { data: user, isLoading: isUserLoading } = useCurrentUser();
	const changePassword = useChangePassword();
	const enable2FA = useEnableTwoFactor();
	const confirm2FA = useConfirmTwoFactor();
	const disable2FA = useDisableTwoFactor();
	const regenerateRecovery = useRegenerateRecoveryCodes();

	const { data: sessions, isLoading: isSessionsLoading } = useAuthSessions();
	const revokeSession = useRevokeSession();
	const logoutAll = useLogoutAll();
	const resendVerification = useResendVerificationEmail();

	const updateProfile = useUpdateProfile();
	const uploadAvatar = useUploadAvatar();
	const deleteAvatar = useDeleteAvatar();
	const deleteAccount = useDeleteAccount();

	const workspaceId = user?.current_workspace?.id ?? user?.current_workspace_id ?? '';
	const { data: apiKeys, isLoading: isApiKeysLoading } = useApiKeys(workspaceId);
	const createApiKey = useCreateApiKey(workspaceId);
	const deleteApiKey = useDeleteApiKey(workspaceId);

	// Profile States
	const [name, setName] = useState('');
	const [profileSaved, setProfileSaved] = useState(false);
	const [verificationSent, setVerificationSent] = useState(false);
	const fileInputRef = useState<HTMLInputElement | null>(null);

	// API Keys States
	const [showCreateKey, setShowCreateKey] = useState(false);
	const [keyName, setKeyName] = useState('');
	const [keyAbilities, setKeyAbilities] = useState<TApiKeyAbility[]>([
		'workflows:read',
		'workflows:write',
	]);
	const [createdPlainKey, setCreatedPlainKey] = useState<string | null>(null);

	// Danger Zone State
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// UI States
	const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
	const [visibility, setVisibility] = useState<Record<string, boolean>>({});
	const toggleVisibility = (field: string) => {
		setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	// 2FA Flow State
	const [setup2FAData, setSetup2FAData] = useState<{
		secret: string;
		otpauth_url?: string;
	} | null>(null);
	const [confirmCode, setConfirmCode] = useState('');
	const [confirmError, setConfirmError] = useState<string | null>(null);
	const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
	const [showDisableForm, setShowDisableForm] = useState(false);
	const [disablePassword, setDisablePassword] = useState('');
	const [disableError, setDisableError] = useState<string | null>(null);

	const is2FAEnabled = Boolean(user?.two_factor_enabled ?? false);

	// Change Password Form
	const formik = useFormik({
		initialValues: {
			current_password: '',
			password: '',
			password_confirmation: '',
			revoke_other_sessions: false,
		},
		validationSchema: changePasswordSchema,
		onSubmit: async (values, { resetForm }) => {
			try {
				await changePassword.mutateAsync(values);
				setPasswordChangeSuccess(true);
				resetForm();
			} catch (error) {
				applyApiFieldErrors(error, formik);
			}
		},
	});

	// Handle 2FA Setup
	const handleStart2FASetup = async () => {
		try {
			const result = await enable2FA.mutateAsync();
			setSetup2FAData(result);
			setConfirmError(null);
		} catch {
			// Handled by hook error metadata
		}
	};

	const handleConfirm2FA = async () => {
		if (!confirmCode || confirmCode.length < 6) {
			setConfirmError('Please enter a valid 6-digit code');
			return;
		}
		try {
			const res = await confirm2FA.mutateAsync({ code: confirmCode });
			setRecoveryCodes(res.recovery_codes);
			setSetup2FAData(null);
			setConfirmCode('');
			setConfirmError(null);
		} catch (err: unknown) {
			const e = err as { response?: { data?: { message?: string } } };
			setConfirmError(e.response?.data?.message || 'Invalid code. Please try again.');
		}
	};

	const handleDisable2FA = async () => {
		if (!disablePassword) {
			setDisableError('Please enter your current password');
			return;
		}
		try {
			await disable2FA.mutateAsync({ current_password: disablePassword });
			setShowDisableForm(false);
			setDisablePassword('');
			setDisableError(null);
			setRecoveryCodes(null);
		} catch (err: unknown) {
			const e = err as { response?: { data?: { message?: string } } };
			setDisableError(e.response?.data?.message || 'Password incorrect.');
		}
	};

	const handleRegenerateCodes = async () => {
		try {
			const res = await regenerateRecovery.mutateAsync();
			setRecoveryCodes(res.recovery_codes);
		} catch {
			// Error handled by query hook
		}
	};

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		const finalName = name.trim() || user?.name;
		if (!finalName) return;
		try {
			await updateProfile.mutateAsync({ name: finalName });
			setProfileSaved(true);
			setTimeout(() => setProfileSaved(false), 4000);
		} catch {
			// handled
		}
	};

	const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			uploadAvatar.mutate(file);
		}
	};

	const handleResendVerification = async () => {
		try {
			await resendVerification.mutateAsync();
			setVerificationSent(true);
			setTimeout(() => setVerificationSent(false), 5000);
		} catch {
			// handled
		}
	};

	const handleCreateApiKey = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!keyName.trim() || keyAbilities.length === 0) return;
		try {
			const res = await createApiKey.mutateAsync({
				name: keyName,
				abilities: keyAbilities,
			});
			setCreatedPlainKey(res.plain_text_key);
			setKeyName('');
			setShowCreateKey(false);
		} catch {
			// handled
		}
	};

	const toggleAbility = (ability: TApiKeyAbility) => {
		setKeyAbilities((prev) =>
			prev.includes(ability) ? prev.filter((a) => a !== ability) : [...prev, ability],
		);
	};

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-2'>
						<Icon icon='ShieldCheck' className='text-zinc-600 dark:text-zinc-400' />
						<span className='font-semibold text-zinc-800 dark:text-white'>
							Account & Security
						</span>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='grid gap-6 py-6'>
				{/* ─── Profile Information Card ──────────────────────────── */}
				<Card>
					<CardHeader>
						<CardTitle>Profile Details</CardTitle>
					</CardHeader>
					<CardBody>
						{profileSaved && (
							<Alert color='emerald' variant='soft' icon='CheckmarkCircle02' className='mb-4' isClosable>
								Profile updated successfully.
							</Alert>
						)}
						{verificationSent && (
							<Alert color='emerald' variant='soft' icon='MailCheck01' className='mb-4' isClosable>
								Verification email sent! Check your inbox.
							</Alert>
						)}

						<div className='grid gap-6 md:grid-cols-12'>
							{/* Avatar upload section */}
							<div className='md:col-span-4 flex flex-col items-center justify-center p-4 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl'>
								<div className='relative size-20 rounded-full overflow-hidden border-2 border-purple-500 bg-purple-50 flex items-center justify-center text-purple-600 text-2xl font-bold mb-3'>
									{user?.avatar ? (
										<img src={user.avatar} alt={user.name} className='size-full object-cover' />
									) : (
										user?.name?.[0]?.toUpperCase() || 'A'
									)}
								</div>

								<div className='flex flex-wrap items-center justify-center gap-2'>
									<label className='cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs'>
										<input
											type='file'
											accept='image/*'
											className='hidden'
											onChange={handleAvatarUpload}
											disabled={uploadAvatar.isPending}
										/>
										{uploadAvatar.isPending ? 'Uploading…' : 'Upload photo'}
									</label>

									{user?.avatar && (
										<Button
											variant='outline'
											color='red'
											className='text-xs py-1.5!'
											isLoading={deleteAvatar.isPending}
											onClick={() => deleteAvatar.mutate()}>
											Remove
										</Button>
									)}
								</div>
								<span className='mt-2 text-[11px] text-zinc-400'>JPG, PNG or WEBP up to 2MB</span>
							</div>

							{/* Name and Email section */}
							<div className='md:col-span-8 flex flex-col justify-between'>
								<form onSubmit={handleSaveProfile} className='grid gap-4'>
									<div>
										<Label htmlFor='user-name'>Full Name</Label>
										<Input
											id='user-name'
											defaultValue={user?.name}
											onChange={(e) => setName(e.target.value)}
											placeholder='Your full name'
										/>
									</div>

									<div>
										<Label htmlFor='user-email'>Email Address</Label>
										<div className='flex items-center gap-2'>
											<Input
												id='user-email'
												value={user?.email || ''}
												readOnly
												disabled
												className='bg-zinc-100! dark:bg-zinc-800! cursor-not-allowed'
											/>
											{user?.email_verified_at ? (
												<Badge color='emerald' variant='soft' className='shrink-0 h-9 px-3 flex items-center gap-1'>
													<Icon icon='CheckmarkBadge02' className='size-4 text-emerald-600' />
													Verified
												</Badge>
											) : (
												<Button
													type='button'
													variant='outline'
													color='amber'
													className='shrink-0 text-xs'
													isLoading={resendVerification.isPending}
													onClick={handleResendVerification}>
													Verify Email
												</Button>
											)}
										</div>
									</div>

									<div className='pt-2'>
										<Button
											type='submit'
											variant='solid'
											color='primary'
											className='font-bold text-xs py-2.5!'
											isLoading={updateProfile.isPending}>
											Save Profile
										</Button>
									</div>
								</form>
							</div>
						</div>
					</CardBody>
				</Card>
				{/* ─── Change Password Card ──────────────────────────────── */}
				<Card>
					<CardHeader>
						<CardTitle>Change Password</CardTitle>
					</CardHeader>
					<CardBody>
						<p className='mb-6 text-sm text-zinc-600 dark:text-zinc-400'>
							Ensure your account is using a long, random password to stay secure.
						</p>

						{passwordChangeSuccess && (
							<Alert
								color='emerald'
								variant='soft'
								icon='CheckmarkCircle02'
								className='mb-6'
								isClosable>
								Your password has been changed successfully.
							</Alert>
						)}

						<form
							onSubmit={formik.handleSubmit}
							className='grid max-w-lg gap-y-4'>
							<div>
								<Label htmlFor='current_password'>Current Password</Label>
								<Validation
									isValid={formik.isValid}
									isTouched={formik.touched.current_password}
									invalidFeedback={formik.errors.current_password}>
									<FieldWrap
										lastSuffix={
											<Button
												aria-label='Show/Hide'
												color='zinc'
												icon={
													visibility.current_password
														? 'View'
														: 'ViewOffSlash'
												}
												onClick={() =>
													toggleVisibility('current_password')
												}
												tabIndex={-1}
											/>
										}>
										<Input
											id='current_password'
											name='current_password'
											type={
												visibility.current_password ? 'text' : 'password'
											}
											className='bg-transparent! font-mono'
											autoComplete='current-password'
											value={formik.values.current_password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</FieldWrap>
								</Validation>
							</div>

							<div>
								<Label htmlFor='password'>New Password</Label>
								<Validation
									isValid={formik.isValid}
									isTouched={formik.touched.password}
									invalidFeedback={formik.errors.password}>
									<FieldWrap
										lastSuffix={
											<Button
												aria-label='Show/Hide'
												color='zinc'
												icon={
													visibility.password ? 'View' : 'ViewOffSlash'
												}
												onClick={() => toggleVisibility('password')}
												tabIndex={-1}
											/>
										}>
										<Input
											id='password'
											name='password'
											type={visibility.password ? 'text' : 'password'}
											className='bg-transparent! font-mono'
											autoComplete='new-password'
											value={formik.values.password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</FieldWrap>
								</Validation>
							</div>

							<div>
								<Label htmlFor='password_confirmation'>Confirm New Password</Label>
								<Validation
									isValid={formik.isValid}
									isTouched={formik.touched.password_confirmation}
									invalidFeedback={formik.errors.password_confirmation}>
									<FieldWrap
										lastSuffix={
											<Button
												aria-label='Show/Hide'
												color='zinc'
												icon={
													visibility.password_confirmation
														? 'View'
														: 'ViewOffSlash'
												}
												onClick={() =>
													toggleVisibility('password_confirmation')
												}
												tabIndex={-1}
											/>
										}>
										<Input
											id='password_confirmation'
											name='password_confirmation'
											type={
												visibility.password_confirmation
													? 'text'
													: 'password'
											}
											className='bg-transparent! font-mono'
											autoComplete='new-password'
											value={formik.values.password_confirmation}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</FieldWrap>
								</Validation>
							</div>

							<div className='flex items-center pt-1'>
								<Checkbox
									id='revoke_other_sessions'
									name='revoke_other_sessions'
									checked={formik.values.revoke_other_sessions}
									onChange={formik.handleChange}
									dimension='sm'
									label='Sign out of all other devices'
									color='emerald'
								/>
							</div>

							<Button
								type='submit'
								variant='solid'
								className='mt-2 w-fit py-2! font-bold'
								isLoading={changePassword.isPending}
								isDisable={changePassword.isPending}>
								Update Password
							</Button>
						</form>
					</CardBody>
				</Card>

				{/* ─── Two-Factor Authentication Card ────────────────────── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between w-full'>
							<CardTitle>Two-Factor Authentication (2FA)</CardTitle>
							{isUserLoading ? (
								<Spinner />
							) : is2FAEnabled ? (
								<Badge color='emerald' variant='soft'>
									Active
								</Badge>
							) : (
								<Badge color='zinc' variant='soft'>
									Inactive
								</Badge>
							)}
						</div>
					</CardHeader>
					<CardBody>
						<p className='mb-4 text-sm text-zinc-600 dark:text-zinc-400'>
							Add an extra layer of security to your account by requiring an
							authenticator code each time you sign in.
						</p>

						{/* Revealed Recovery Codes */}
						{recoveryCodes && (
							<div className='mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40'>
								<div className='flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold mb-2'>
									<Icon icon='Alert02' />
									Save these recovery codes!
								</div>
								<p className='text-xs text-amber-700 dark:text-amber-300 mb-3'>
									If you lose access to your authenticator app, these one-time codes
									are the only way you can sign in. They will not be shown again.
								</p>
								<div className='grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-white dark:bg-zinc-900 p-3 rounded border border-amber-200 dark:border-amber-800'>
									{recoveryCodes.map((code, idx) => (
										<span key={idx} className='select-all font-bold'>
											{code}
										</span>
									))}
								</div>
							</div>
						)}

						{/* 2FA Enabled State */}
						{is2FAEnabled ? (
							<div className='grid gap-4 max-w-lg'>
								<Alert color='emerald' variant='soft' icon='CheckmarkCircle02'>
									Two-factor authentication is currently protecting your account.
								</Alert>

								{showDisableForm ? (
									<div className='mt-2 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/30'>
										<h4 className='text-sm font-semibold text-red-800 dark:text-red-200 mb-2'>
											Disable Two-Factor Authentication
										</h4>
										<p className='text-xs text-zinc-600 dark:text-zinc-400 mb-3'>
											Confirm your password to turn off two-factor authentication.
										</p>
										{disableError && (
											<Alert color='red' variant='soft' className='mb-3 text-xs'>
												{disableError}
											</Alert>
										)}
										<div className='grid gap-3'>
											<Input
												type='password'
												placeholder='Enter current password'
												className='bg-transparent!'
												value={disablePassword}
												onChange={(e) => setDisablePassword(e.target.value)}
											/>
											<div className='flex gap-2'>
												<Button
													color='red'
													variant='solid'
													isLoading={disable2FA.isPending}
													onClick={handleDisable2FA}>
													Confirm Disable
												</Button>
												<Button
													variant='outline'
													color='zinc'
													onClick={() => {
														setShowDisableForm(false);
														setDisablePassword('');
													}}>
													Cancel
												</Button>
											</div>
										</div>
									</div>
								) : (
									<div className='flex flex-wrap gap-3 mt-2'>
										<Button
											variant='outline'
											color='zinc'
											isLoading={regenerateRecovery.isPending}
											onClick={handleRegenerateCodes}>
											Regenerate Recovery Codes
										</Button>
										<Button
											variant='outline'
											color='red'
											onClick={() => setShowDisableForm(true)}>
											Disable 2FA
										</Button>
									</div>
								)}
							</div>
						) : setup2FAData ? (
							/* 2FA Setup in Progress */
							<div className='grid gap-4 max-w-md rounded-lg border border-zinc-200 p-5 dark:border-zinc-700'>
								<h4 className='text-base font-bold text-zinc-800 dark:text-white'>
									Setup Authenticator App
								</h4>
								<p className='text-xs text-zinc-600 dark:text-zinc-400'>
									1. Open your authenticator app (e.g. Google Authenticator, Authy).
									<br />
									2. Add a new account manually using this secret key:
								</p>

								<div className='flex items-center justify-between rounded bg-zinc-100 px-3 py-2 font-mono text-sm font-bold tracking-widest text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'>
									<span>{setup2FAData.secret}</span>
									<Button
										variant='link'
										color='zinc'
										aria-label='Copy secret'
										onClick={() =>
											navigator.clipboard.writeText(setup2FAData.secret)
										}>
										Copy
									</Button>
								</div>

								<div className='mt-2'>
									<Label htmlFor='2fa-code'>
										3. Enter the 6-digit code shown in your app
									</Label>
									<Input
										id='2fa-code'
										className='text-center font-mono tracking-[0.4em]'
										placeholder='000000'
										maxLength={6}
										value={confirmCode}
										onChange={(e) => setConfirmCode(e.target.value)}
									/>
									{confirmError && (
										<p className='mt-1 text-xs text-red-500'>{confirmError}</p>
									)}
								</div>

								<div className='flex gap-2 mt-2'>
									<Button
										variant='solid'
										color='primary'
										className='py-2! font-bold'
										isLoading={confirm2FA.isPending}
										onClick={handleConfirm2FA}>
										Verify & Enable
									</Button>
									<Button
										variant='outline'
										color='zinc'
										onClick={() => setSetup2FAData(null)}>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							/* 2FA Disabled State */
							<div>
								<Button
									variant='solid'
									color='primary'
									className='py-2! font-bold'
									isLoading={enable2FA.isPending}
									onClick={handleStart2FASetup}>
									Enable 2FA
								</Button>
							</div>
						)}
					</CardBody>
				</Card>

				{/* ─── Active Sessions Card ──────────────────────────────── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between w-full'>
							<CardTitle>Active Device Sessions</CardTitle>
							<Button
								variant='outline'
								color='red'
								className='text-xs'
								isLoading={logoutAll.isPending}
								onClick={() => logoutAll.mutate()}>
								Sign out of all devices
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						<p className='mb-4 text-sm text-zinc-600 dark:text-zinc-400'>
							These devices are currently authenticated to your account.
						</p>

						{isSessionsLoading ? (
							<div className='py-4 flex justify-center'>
								<Spinner />
							</div>
						) : sessions && sessions.length > 0 ? (
							<div className='divide-y divide-zinc-200 dark:divide-zinc-800'>
								{sessions.map((session) => (
									<div
										key={session.id}
										className='flex items-center justify-between py-3 text-sm'>
										<div className='flex items-center gap-3'>
											<Icon
												icon='Computer'
												className='text-xl text-zinc-500'
											/>
											<div>
												<div className='font-medium text-zinc-800 dark:text-zinc-200'>
													{session.name || 'Web Browser Session'}
												</div>
												<div className='text-xs text-zinc-500'>
													Created:{' '}
													{new Date(session.created_at).toLocaleString()}
												</div>
											</div>
										</div>

										<Button
											variant='outline'
											color='zinc'
											className='text-xs'
											isLoading={revokeSession.isPending}
											onClick={() => revokeSession.mutate(session.id)}>
											Revoke
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-zinc-500'>No active sessions found.</p>
						)}
					</CardBody>
				</Card>

				{/* ─── Workspace API Keys Card ──────────────────────────── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between w-full'>
							<div>
								<CardTitle>Workspace API Keys</CardTitle>
								<p className='mt-1 text-xs text-zinc-500'>
									API keys allow external scripts and services to interact with this workspace.
								</p>
							</div>
							<Button
								variant='solid'
								color='primary'
								className='text-xs font-bold'
								onClick={() => setShowCreateKey(!showCreateKey)}>
								{showCreateKey ? 'Cancel' : '+ New API Key'}
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						{/* Created plain text key alert */}
						{createdPlainKey && (
							<div className='mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40'>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<h4 className='text-sm font-bold text-emerald-800 dark:text-emerald-200'>
											API Key Created! Copy it now.
										</h4>
										<p className='mt-0.5 text-xs text-emerald-700 dark:text-emerald-300'>
											For security reasons, this secret key will never be shown again.
										</p>
									</div>
									<Button
										variant='link'
										color='emerald'
										className='text-xs font-bold'
										onClick={() => setCreatedPlainKey(null)}>
										Dismiss
									</Button>
								</div>
								<div className='mt-3 flex items-center gap-2'>
									<code className='flex-1 rounded bg-white px-3 py-2 font-mono text-xs font-bold text-zinc-800 border border-emerald-200 dark:bg-black dark:text-emerald-300 dark:border-emerald-800 select-all overflow-x-auto'>
										{createdPlainKey}
									</code>
									<Button
										variant='solid'
										color='primary'
										className='text-xs py-2!'
										onClick={() => navigator.clipboard.writeText(createdPlainKey)}>
										Copy
									</Button>
								</div>
							</div>
						)}

						{/* Create Key Form Drawer */}
						{showCreateKey && (
							<form onSubmit={handleCreateApiKey} className='mb-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/40 dark:bg-purple-950/20'>
								<h4 className='text-sm font-bold text-zinc-900 dark:text-white mb-3'>
									Generate API Key
								</h4>
								<div className='grid gap-4 max-w-lg'>
									<div>
										<Label htmlFor='api-key-name'>Key Name / Description</Label>
										<Input
											id='api-key-name'
											value={keyName}
											onChange={(e) => setKeyName(e.target.value)}
											placeholder='e.g. CI/CD Deployment Key or Agent Bot'
										/>
									</div>

									<div>
										<Label>Permissions / Abilities</Label>
										<div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2'>
											{(
												[
													'workflows:read',
													'workflows:write',
													'runs:read',
													'agents:invoke',
													'connectors:manage',
												] as TApiKeyAbility[]
											).map((ab) => (
												<label
													key={ab}
													className='flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
													<input
														type='checkbox'
														checked={keyAbilities.includes(ab)}
														onChange={() => toggleAbility(ab)}
														className='size-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500'
													/>
													<code>{ab}</code>
												</label>
											))}
										</div>
									</div>

									<div className='flex gap-2 pt-2'>
										<Button
											type='submit'
											variant='solid'
											color='primary'
											className='text-xs font-bold py-2!'
											isLoading={createApiKey.isPending}>
											Generate Key
										</Button>
										<Button
											type='button'
											variant='outline'
											color='zinc'
											className='text-xs py-2!'
											onClick={() => setShowCreateKey(false)}>
											Cancel
										</Button>
									</div>
								</div>
							</form>
						)}

						{/* API Keys Table */}
						{isApiKeysLoading ? (
							<div className='py-4 flex justify-center'>
								<Spinner />
							</div>
						) : apiKeys && apiKeys.length > 0 ? (
							<div className='divide-y divide-zinc-200 dark:divide-zinc-800'>
								{apiKeys.map((k) => (
									<div
										key={k.id}
										className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 text-sm'>
										<div>
											<div className='font-bold text-zinc-900 dark:text-white'>
												{k.name}
											</div>
											<div className='flex flex-wrap gap-1 mt-1'>
												{k.abilities.map((ab) => (
													<span
														key={ab}
														className='inline-block rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300'>
														{ab}
													</span>
												))}
											</div>
											<div className='mt-1 text-xs text-zinc-400'>
												Created: {new Date(k.created_at).toLocaleDateString()}
												{k.last_used_at && ` • Last used: ${new Date(k.last_used_at).toLocaleDateString()}`}
											</div>
										</div>

										<Button
											variant='outline'
											color='red'
											className='text-xs shrink-0 self-start sm:self-center'
											isLoading={deleteApiKey.isPending}
											onClick={() => deleteApiKey.mutate(k.id)}>
											Revoke
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-zinc-500'>
								No API keys generated yet for this workspace. Click &ldquo;+ New API Key&rdquo; to create one.
							</p>
						)}
					</CardBody>
				</Card>

				{/* ─── Danger Zone Card ──────────────────────────────────── */}
				<Card className='border-red-200 dark:border-red-950/60'>
					<CardHeader>
						<div className='flex items-center gap-2'>
							<Icon icon='Alert02' className='text-red-500' />
							<CardTitle className='text-red-600 dark:text-red-400'>Danger Zone</CardTitle>
						</div>
					</CardHeader>
					<CardBody>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
							<div>
								<h4 className='text-sm font-bold text-zinc-900 dark:text-white'>
									Delete Account
								</h4>
								<p className='text-xs text-zinc-500'>
									Permanently delete your user account, revoke all session tokens, and wipe associated settings. This action cannot be undone.
								</p>
							</div>

							{showDeleteConfirm ? (
								<div className='flex items-center gap-2 shrink-0'>
									<Button
										variant='solid'
										color='red'
										className='text-xs font-bold'
										isLoading={deleteAccount.isPending}
										onClick={() => deleteAccount.mutate()}>
										Yes, Delete Account
									</Button>
									<Button
										variant='outline'
										color='zinc'
										className='text-xs'
										onClick={() => setShowDeleteConfirm(false)}>
										Cancel
									</Button>
								</div>
							) : (
								<Button
									variant='outline'
									color='red'
									className='text-xs shrink-0'
									onClick={() => setShowDeleteConfirm(true)}>
									Delete Account
								</Button>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>
		</>
	);
};

export default AccountSecurityPage;
