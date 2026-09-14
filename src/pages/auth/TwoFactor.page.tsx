import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { useVerifyTwoFactor } from '@/api/modules/auth';
import { messageFromError } from '@/api/core';
import useAfterAuthRedirect from '@/hooks/useAfterAuthRedirect';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const OTP_LENGTH = 6;

/** Login hands the challenge over in router state — the token is short-lived
 *  and single-use, so it is never put in the URL. */
type TChallengeState = { challengeToken?: string; rememberMe?: boolean };

const TwoFactorPage = () => {
	const location = useLocation();
	const { challengeToken, rememberMe } = (location.state as TChallengeState | null) ?? {};
	const redirectAfterAuth = useAfterAuthRedirect();
	const verifyTwoFactor = useVerifyTwoFactor();

	const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
	const [recoveryCode, setRecoveryCode] = useState('');
	const [useRecoveryCode, setUseRecoveryCode] = useState(false);
	const [error, setError] = useState('');
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

	// Landing here without a challenge means the login step was skipped.
	if (!challengeToken) return <Navigate to={pages.auth.login.to} replace />;

	const handleChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const next = [...otp];
		next[index] = value.slice(-1);
		setOtp(next);
		setError('');
		if (value && index < OTP_LENGTH - 1) {
			inputs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
		const next = [...otp];
		pasted.split('').forEach((char, i) => (next[i] = char));
		setOtp(next);
		inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
	};

	const code = useRecoveryCode ? recoveryCode.trim() : otp.join('');
	const isIncomplete = useRecoveryCode ? code.length === 0 : code.length < OTP_LENGTH;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isIncomplete) {
			setError(
				useRecoveryCode
					? 'Enter one of your recovery codes.'
					: 'Please enter all 6 digits.',
			);
			return;
		}

		try {
			await verifyTwoFactor.mutateAsync({
				challenge_token: challengeToken,
				code,
				rememberMe,
			});
			await redirectAfterAuth();
		} catch (err) {
			setError(messageFromError(err, 'Invalid authentication code. Please try again.'));
		}
	};

	return (
		<AuthShell
			badge='Two-factor auth'
			title={<span className='text-slate-950'>Enter your code</span>}
			subtitle='Open your authenticator app and enter the 6-digit code.'
			mobileTitle='Two-factor verification'
			mobileSubtitle='Enter the code from your authenticator app.'
			footer={
				<div className='flex items-center justify-center gap-2'>
					<Link
						to={pages.auth.login.to}
						className='text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 font-bold transition-colors'>
						<Icon icon='ArrowLeft01' className='h-3.5 w-3.5' />
						Back to sign in
					</Link>
				</div>
			}>
			<form className='space-y-8' onSubmit={handleSubmit}>
				<div className='flex flex-col items-center gap-6'>
					<motion.div
						animate={{ rotate: [0, 5, -5, 0] }}
						transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
						className='bg-primary-100 text-primary-700 flex h-20 w-20 items-center justify-center rounded-full'>
						<Icon icon='AiSecurity01' className='h-10 w-10' />
					</motion.div>

					{useRecoveryCode ? (
						<input
							type='text'
							autoComplete='one-time-code'
							placeholder='Recovery code'
							value={recoveryCode}
							onChange={(e) => {
								setRecoveryCode(e.target.value);
								setError('');
							}}
							className='focus:border-primary-600 focus:shadow-primary-500/20 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-center font-mono text-base font-bold tracking-widest text-slate-950 transition-all outline-none focus:bg-white focus:shadow-xl'
						/>
					) : (
						<div className='flex gap-3' onPaste={handlePaste}>
							{otp.map((digit, index) => (
								<input
									key={index}
									ref={(el) => {
										inputs.current[index] = el;
									}}
									type='text'
									inputMode='numeric'
									maxLength={1}
									value={digit}
									onChange={(e) => handleChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									className='focus:border-primary-600 focus:shadow-primary-500/20 h-14 w-11 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xl font-black text-slate-950 transition-all outline-none focus:bg-white focus:shadow-xl'
								/>
							))}
						</div>
					)}

					{error && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='text-[10px] font-medium text-red-500'>
							{error}
						</motion.p>
					)}

					<p className='text-xs font-medium text-slate-500'>
						{useRecoveryCode ? 'Have your app handy?' : 'Lost your device?'}{' '}
						<button
							type='button'
							onClick={() => {
								setUseRecoveryCode((value) => !value);
								setError('');
							}}
							className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
							{useRecoveryCode ? 'Enter a 6-digit code' : 'Use a recovery code'}
						</button>
					</p>
				</div>

				<button
					type='submit'
					disabled={verifyTwoFactor.isPending || isIncomplete}
					className='group bg-primary-400 hover:bg-primary-500 text-primary-950 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
					<span>{verifyTwoFactor.isPending ? 'Verifying...' : 'Verify code'}</span>
					<Icon
						icon='ArrowRight01'
						className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
					/>
				</button>
			</form>
		</AuthShell>
	);
};

export default TwoFactorPage;
