import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Copy, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import {
	useDisableTwoFactor,
	useRegenerateRecoveryCodes,
	useTwoFactorRecoveryCodes,
} from '@/api/modules/auth';
import { useAuth } from '@/context/authContext';
import { useConfirm } from '@/context/confirmContext';
import pages from '@/Routes/pages';
import { dangerBtn, primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass, errorClass, inputClass, labelClass } from '../_helper/security.constants';

// ============================================================
// Two-factor authentication
// ------------------------------------------------------------
// Enabling happens on /two-factor-setup (it needs the QR step).
// This card owns the states that come after: how many recovery
// codes are left, regenerating them, and turning 2FA off.
//
// Plaintext recovery codes exist only in the response to confirm
// and regenerate — they are hashed at rest, so `GET .../recovery-
// codes` can only report a remaining count.
// ============================================================

const TwoFactorCard = () => {
	const { userData } = useAuth();
	const { confirm } = useConfirm();

	const isEnabled = !!userData?.two_factor_enabled;
	const { data: recoveryCodes } = useTwoFactorRecoveryCodes(isEnabled);
	const regenerate = useRegenerateRecoveryCodes();
	const disable = useDisableTwoFactor();

	const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
	const [isDisabling, setIsDisabling] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [disableError, setDisableError] = useState('');

	const handleRegenerate = async () => {
		const confirmed = await confirm({
			title: 'Regenerate recovery codes',
			confirmText: 'Regenerate',
			message:
				'Your existing recovery codes stop working immediately. The new ones are shown once — store them somewhere safe.',
		});
		if (!confirmed) return;

		const result = await regenerate.mutateAsync();
		setFreshCodes(result.recovery_codes);
	};

	const handleCopyCodes = async () => {
		if (!freshCodes) return;
		await navigator.clipboard.writeText(freshCodes.join('\n'));
		notify.success('Recovery codes copied.');
	};

	const handleDisable = async (e: React.FormEvent) => {
		e.preventDefault();
		setDisableError('');
		if (!currentPassword.trim()) {
			setDisableError('Enter your password to confirm');
			return;
		}

		try {
			await disable.mutateAsync({ current_password: currentPassword });
			notify.success('Two-factor authentication disabled.');
			setIsDisabling(false);
			setCurrentPassword('');
			setFreshCodes(null);
		} catch (error) {
			setDisableError(
				(ApiError.is(error) && error.fieldErrors().current_password) ||
					'That password was not accepted.',
			);
		}
	};

	return (
		<section className={cardClass}>
			<div className='mb-5 flex items-start gap-3'>
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
						isEnabled
							? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
							: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
					}`}>
					{isEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
				</div>
				<div className='min-w-0'>
					<h2 className='flex flex-wrap items-center gap-2 text-base font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Two-factor authentication
						<span
							className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
								isEnabled
									? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
									: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
							}`}>
							{isEnabled ? 'On' : 'Off'}
						</span>
					</h2>
					<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						{isEnabled
							? 'A code from your authenticator app is required at every sign in.'
							: 'Add a second step at sign in using an authenticator app.'}
					</p>
				</div>
			</div>

			{!isEnabled ? (
				<Link to={pages.auth.twoFactorSetup.to} className={primaryBtn}>
					Set up two-factor
					<ArrowRight size={15} />
				</Link>
			) : (
				<div className='grid gap-5'>
					<div className='rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
						<p className='text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
							Recovery codes
						</p>
						<p className='mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
							{recoveryCodes
								? `${recoveryCodes.recovery_codes_remaining} unused code${
										recoveryCodes.recovery_codes_remaining === 1 ? '' : 's'
									} left`
								: 'Checking…'}
						</p>
						<p className='mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
							Each code signs you in once if you lose your authenticator. Codes are
							stored hashed, so they can only be replaced, never re-read.
						</p>

						<button
							type='button'
							onClick={handleRegenerate}
							disabled={regenerate.isPending}
							className={`${secondaryBtn} mt-3.5`}>
							<RefreshCw size={14} />
							{regenerate.isPending ? 'Regenerating…' : 'Regenerate codes'}
						</button>

						{freshCodes && (
							<div className='mt-4 rounded-xl border border-primary-500/30 bg-primary-400/5 p-4'>
								<div className='flex flex-wrap items-center justify-between gap-2'>
									<p className='text-xs font-bold tracking-wider text-primary-700 uppercase dark:text-primary-400'>
										Save these now — shown once
									</p>
									<button
										type='button'
										onClick={handleCopyCodes}
										className='inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 transition hover:text-primary-800 dark:text-primary-400'>
										<Copy size={12} />
										Copy all
									</button>
								</div>
								<ul className='mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200'>
									{freshCodes.map((code) => (
										<li key={code}>{code}</li>
									))}
								</ul>
							</div>
						)}
					</div>

					{isDisabling ? (
						<form
							onSubmit={handleDisable}
							className='rounded-xl border border-red-200 bg-red-50/50 p-4 sm:max-w-md dark:border-red-900/50 dark:bg-red-950/20'>
							<label className={labelClass} htmlFor='disable-2fa-password'>
								Confirm your password to turn 2FA off
							</label>
							<input
								id='disable-2fa-password'
								type='password'
								autoComplete='current-password'
								className={inputClass}
								value={currentPassword}
								onChange={(e) => {
									setCurrentPassword(e.target.value);
									setDisableError('');
								}}
							/>
							{disableError && <p className={errorClass}>{disableError}</p>}

							<div className='mt-3.5 flex flex-wrap gap-2.5'>
								<button
									type='submit'
									disabled={disable.isPending}
									className={dangerBtn}>
									{disable.isPending ? 'Disabling…' : 'Disable two-factor'}
								</button>
								<button
									type='button'
									onClick={() => {
										setIsDisabling(false);
										setCurrentPassword('');
										setDisableError('');
									}}
									className={secondaryBtn}>
									Cancel
								</button>
							</div>
						</form>
					) : (
						<div>
							<button
								type='button'
								onClick={() => setIsDisabling(true)}
								className={dangerBtn}>
								Disable two-factor
							</button>
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default TwoFactorCard;
