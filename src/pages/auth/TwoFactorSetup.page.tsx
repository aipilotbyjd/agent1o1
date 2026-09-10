import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const OTP_LENGTH = 6;

const steps = [
	{ id: 1, label: 'Scan QR code' },
	{ id: 2, label: 'Verify code' },
	{ id: 3, label: 'Done' },
];

const TwoFactorSetupPage = () => {
	const [step, setStep] = useState(1);
	const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
	const [loading, setLoading] = useState(false);
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

	const handleChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const next = [...otp];
		next[index] = value.slice(-1);
		setOtp(next);
		if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
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

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		// TODO: call 2FA setup verify API
		await new Promise((r) => setTimeout(r, 1000));
		setLoading(false);
		setStep(3);
	};

	return (
		<AuthShell
			badge='2FA setup'
			title={<span className='text-slate-950'>Enable two-factor auth</span>}
			subtitle='Add an extra layer of security to your account.'
			mobileTitle='Secure your account'
			mobileSubtitle='Set up two-factor authentication in two steps.'
			footer={
				<div className='flex items-center justify-center gap-2'>
					<Link
						to={pages.pagesExamples.login.to}
						className='text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 font-bold transition-colors'>
						<Icon icon='ArrowLeft01' className='h-3.5 w-3.5' />
						Skip for now
					</Link>
				</div>
			}>
			{/* Step indicator */}
			<div className='mb-8 flex items-center justify-center gap-2'>
				{steps.map((s, i) => (
					<div key={s.id} className='flex items-center gap-2'>
						<div
							className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black transition-all ${
								step >= s.id
									? 'bg-primary-400 text-primary-950'
									: 'bg-slate-100 text-slate-400'
							}`}>
							{step > s.id ? (
								<Icon icon='CheckmarkCircle01' className='h-4 w-4' />
							) : (
								s.id
							)}
						</div>
						<span
							className={`text-[10px] font-bold tracking-widest uppercase ${
								step >= s.id ? 'text-slate-950' : 'text-slate-400'
							}`}>
							{s.label}
						</span>
						{i < steps.length - 1 && (
							<div
								className={`h-px w-8 transition-all ${step > s.id ? 'bg-primary-700' : 'bg-slate-200'}`}
							/>
						)}
					</div>
				))}
			</div>

			{step === 1 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className='flex flex-col items-center gap-6'>
					<p className='text-center text-sm font-medium text-slate-500'>
						Scan this QR code with your authenticator app (Google Authenticator, Authy,
						etc.)
					</p>

					{/* QR code placeholder */}
					<div className='flex h-48 w-48 items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50'>
						<div className='text-center'>
							<Icon icon='QrCode' className='mx-auto mb-2 h-12 w-12 text-slate-300' />
							<p className='text-[10px] font-bold text-slate-400 uppercase'>
								QR code here
							</p>
						</div>
					</div>

					<div className='w-full rounded-2xl border border-slate-200 bg-slate-50 p-4'>
						<p className='mb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase'>
							Manual entry code
						</p>
						<p className='font-mono text-sm font-bold tracking-widest text-slate-950'>
							XXXX XXXX XXXX XXXX
						</p>
					</div>

					<button
						type='button'
						onClick={() => setStep(2)}
						className='group bg-primary-400 hover:bg-primary-500 flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98]'>
						I've scanned it
						<Icon
							icon='ArrowRight01'
							className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
						/>
					</button>
				</motion.div>
			)}

			{step === 2 && (
				<motion.form
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className='flex flex-col items-center gap-6'
					onSubmit={handleVerify}>
					<p className='text-center text-sm font-medium text-slate-500'>
						Enter the 6-digit code shown in your authenticator app to confirm setup.
					</p>

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

					<button
						type='submit'
						disabled={loading || otp.join('').length < OTP_LENGTH}
						className='group bg-primary-400 hover:bg-primary-500 flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
						<span>{loading ? 'Verifying...' : 'Confirm setup'}</span>
						<Icon
							icon='ArrowRight01'
							className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
						/>
					</button>
				</motion.form>
			)}

			{step === 3 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className='flex flex-col items-center gap-6 py-4 text-center'>
					<div className='flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
						<Icon icon='CheckmarkCircle01' className='h-10 w-10' />
					</div>
					<div className='space-y-2'>
						<h3 className='text-xl font-black tracking-tight text-slate-950'>
							2FA enabled
						</h3>
						<p className='text-sm font-medium text-slate-500'>
							Your account is now protected with two-factor authentication. Keep your
							recovery codes somewhere safe.
						</p>
					</div>
					<Link
						to={pages.app.subPages.dashboard.to}
						className='group bg-primary-400 hover:bg-primary-500 inline-flex items-center gap-3 rounded-[32px] px-8 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300'>
						Go to dashboard
						<Icon
							icon='ArrowRight01'
							className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
						/>
					</Link>
				</motion.div>
			)}
		</AuthShell>
	);
};

export default TwoFactorSetupPage;
