import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { useEnableTwoFactor, useConfirmTwoFactor } from '@/api/modules/auth';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';

const OTP_LENGTH = 6;

const STEPS = [
	{ id: 1, label: 'Scan' },
	{ id: 2, label: 'Verify' },
	{ id: 3, label: 'Done' },
];

const TwoFactorSetupPage = () => {
	// Opened from Settings → Security, the page returns there; reached any other
	// way it keeps its original exit to the sign-in page.
	const location = useLocation();
	const returnTo = (location.state as { from?: string } | null)?.from ?? pages.identity.login.to;
	const [step, setStep] = useState(1);
	const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
	const [codeError, setCodeError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

	const enable = useEnableTwoFactor();
	const confirm = useConfirmTwoFactor();

	const secret = enable.data?.secret ?? '';
	const otpauthUrl = enable.data?.otpauth_url ?? '';

	// Start the setup once on mount: the backend mints the secret and hands back
	// an otpauth:// URL. `enable.mutate` is stable, so this runs a single time.
	useEffect(() => {
		enable.mutate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// The QR is rendered in the browser from the otpauth URL — that URL carries
	// the TOTP secret, so it must never be handed to a third-party image service.
	useEffect(() => {
		if (!otpauthUrl) return;
		let cancelled = false;
		QRCode.toDataURL(otpauthUrl, { width: 320, margin: 1 })
			.then((url) => {
				if (!cancelled) setQrDataUrl(url);
			})
			.catch(() => {
				if (!cancelled) setQrDataUrl(null);
			});
		return () => {
			cancelled = true;
		};
	}, [otpauthUrl]);

	const handleChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		setCodeError(null);
		const next = [...otp];
		next[index] = value.slice(-1);
		setOtp(next);
		if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
	};

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: ClipboardEvent) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
		if (!pasted) return;
		const next = [...otp];
		pasted.split('').forEach((char, i) => {
			next[i] = char;
		});
		setOtp(next);
		inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
	};

	const handleVerify = async (e: FormEvent) => {
		e.preventDefault();
		const code = otp.join('');
		if (code.length < OTP_LENGTH) {
			setCodeError(`Enter all ${OTP_LENGTH} digits.`);
			return;
		}
		try {
			const result = await confirm.mutateAsync({ code });
			setRecoveryCodes(result.recovery_codes);
			setStep(3);
		} catch {
			// The mutation's `meta.errorMessage` already raises a toast; this just
			// keeps the message next to the inputs the user is looking at.
			setCodeError('That code was not accepted. Check your authenticator and try again.');
		}
	};

	const copyRecoveryCodes = async () => {
		try {
			await navigator.clipboard.writeText(recoveryCodes.join('\n'));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<AuthLayout badge='TWO-FACTOR SETUP'>
			<AuthCardHeader
				right={
					step === 3 ? (
						<span className='font-semibold text-zinc-500'>Step 3 of 3</span>
					) : (
						<Link
							to={returnTo}
							className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
							{returnTo === pages.identity.login.to ? 'Skip for now' : 'Cancel'}
						</Link>
					)
				}
			/>

			{/* Step indicator */}
			<div className='mb-7 flex items-center justify-center gap-2'>
				{STEPS.map((s, i) => (
					<div key={s.id} className='flex items-center gap-2'>
						<div
							className={`flex size-7 items-center justify-center rounded-full text-[10px] font-black transition-all ${
								step >= s.id
									? 'bg-primary-600 text-zinc-950'
									: 'bg-zinc-100 text-zinc-400'
							}`}>
							{step > s.id ? <Icon icon='Tick02' className='size-4' /> : s.id}
						</div>
						<span
							className={`text-[10px] font-bold tracking-widest uppercase ${
								step >= s.id ? 'text-zinc-950' : 'text-zinc-400'
							}`}>
							{s.label}
						</span>
						{i < STEPS.length - 1 && (
							<div
								className={`h-px w-6 transition-all ${
									step > s.id ? 'bg-primary-600' : 'bg-zinc-200'
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* ─── Step 1: scan ──────────────────────────────────────────── */}
			{step === 1 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className='flex flex-col items-center gap-5'>
					<div className='text-center'>
						<h2 className='text-2xl font-extrabold tracking-tight text-zinc-950'>
							Scan this code
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500'>
							Open your authenticator app - Google Authenticator, Authy, 1Password -
							and scan the code below.
						</p>
					</div>

					{enable.isPending ? (
						<div className='flex size-48 items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50'>
							<Spinner className='size-6' />
						</div>
					) : enable.isError ? (
						<Alert color='red' variant='soft' icon='AlertCircle' className='text-xs'>
							Could not start two-factor setup. Reload the page to try again.
						</Alert>
					) : qrDataUrl ? (
						<img
							src={qrDataUrl}
							alt='Two-factor authentication QR code'
							className='size-48 rounded-3xl border border-zinc-200 bg-white p-2'
						/>
					) : (
						<div className='flex size-48 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center'>
							<Icon icon='QrCode' className='size-10 text-zinc-300' />
							<p className='px-4 text-[10px] font-bold text-zinc-400'>
								Could not draw the QR - use the key below instead
							</p>
						</div>
					)}

					{secret && (
						<div className='w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center'>
							<p className='text-[10px] font-bold tracking-widest text-zinc-500 uppercase'>
								Or enter this key manually
							</p>
							<p className='mt-1.5 font-mono text-sm font-bold tracking-[0.2em] break-all text-zinc-950'>
								{secret}
							</p>
						</div>
					)}

					<button
						type='button'
						disabled={!secret}
						onClick={() => setStep(2)}
						className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:opacity-50'>
						I'VE SCANNED IT ›
					</button>
				</motion.div>
			)}

			{/* ─── Step 2: verify ────────────────────────────────────────── */}
			{step === 2 && (
				<motion.form
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					onSubmit={handleVerify}
					className='flex flex-col items-center gap-5'>
					<div className='text-center'>
						<h2 className='text-2xl font-extrabold tracking-tight text-zinc-950'>
							Enter the 6-digit code
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500'>
							Type the code your authenticator app is showing right now.
						</p>
					</div>

					<div className='flex gap-2' onPaste={handlePaste}>
						{otp.map((digit, i) => (
							<input
								key={i}
								ref={(el) => {
									inputs.current[i] = el;
								}}
								value={digit}
								onChange={(e) => handleChange(i, e.target.value)}
								onKeyDown={(e) => handleKeyDown(i, e)}
								inputMode='numeric'
								autoComplete='one-time-code'
								maxLength={1}
								aria-label={`Digit ${i + 1}`}
								className='focus:border-primary-500 focus:ring-primary-500/15 size-12 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] text-center text-lg font-black text-zinc-950 transition-all focus:bg-white focus:ring-2 focus:outline-hidden'
							/>
						))}
					</div>

					{codeError && (
						<Alert color='red' variant='soft' icon='AlertCircle' className='text-xs'>
							{codeError}
						</Alert>
					)}

					<div className='grid w-full gap-y-2.5'>
						<button
							type='submit'
							disabled={confirm.isPending}
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:opacity-50'>
							{confirm.isPending && <Spinner className='size-4' />}
							VERIFY & ENABLE ›
						</button>
						<button
							type='button'
							onClick={() => setStep(1)}
							className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold tracking-wider text-zinc-700 uppercase shadow-2xs hover:bg-zinc-50'>
							BACK TO QR CODE
						</button>
					</div>
				</motion.form>
			)}

			{/* ─── Step 3: recovery codes ────────────────────────────────── */}
			{step === 3 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className='flex flex-col items-center gap-5'>
					<div className='flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
						<Icon icon='Tick02' className='size-8' />
					</div>

					<div className='text-center'>
						<h2 className='text-2xl font-extrabold tracking-tight text-zinc-950'>
							Two-factor is on
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500'>
							Save these recovery codes somewhere safe.
						</p>
					</div>

					<Alert color='amber' variant='soft' icon='AlertCircle' className='text-xs'>
						These codes are shown once and never again - they are hashed the moment this
						page closes. Each one gets you in if you lose your device.
					</Alert>

					<div className='grid w-full grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4'>
						{recoveryCodes.map((code) => (
							<span
								key={code}
								className='text-center font-mono text-xs font-bold tracking-wider text-zinc-800'>
								{code}
							</span>
						))}
					</div>

					<div className='grid w-full gap-y-2.5'>
						<button
							type='button'
							onClick={copyRecoveryCodes}
							className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold tracking-wider text-zinc-700 uppercase shadow-2xs hover:bg-zinc-50'>
							<Icon icon={copied ? 'Tick02' : 'Copy01'} className='size-4' />
							{copied ? 'COPIED' : 'COPY CODES'}
						</button>
						<Link to={returnTo}>
							<button
								type='button'
								className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all'>
								CONTINUE ›
							</button>
						</Link>
					</div>
				</motion.div>
			)}
		</AuthLayout>
	);
};

export default TwoFactorSetupPage;
