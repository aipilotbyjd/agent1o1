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
} from '@/api/modules/auth';
import { useCurrentUser } from '@/api/modules/user';
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
			</Container>
		</>
	);
};

export default AccountSecurityPage;
