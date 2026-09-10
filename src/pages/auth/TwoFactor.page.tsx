import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';

const OTP_LENGTH = 6;

const TwoFactorPage = () => {
	const navigate = useNavigate();
	const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

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

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const code = otp.join('');
		if (code.length < OTP_LENGTH) {
			setError('Please enter all 6 digits.');
			return;
		}
		setLoading(true);
		try {
			// Simulate 2FA verify API
			await new Promise((r) => setTimeout(r, 1200));
			console.log('2FA code verified:', code);

			// Import and set mock token
			const { setToken } = await import('@/api/core/token-manager');
			setToken('mock_2fa_access_token', 3600, true, 'mock_2fa_refresh_token');

			setLoading(false);
			navigate(pages.app.subPages.dashboard.to, { replace: true });
		} catch (err) {
			console.error('2FA verification failed:', err);
			setError('Invalid authentication code. Please try again.');
			setLoading(false);
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
						to={pages.pagesExamples.login.to}
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

					{error && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='text-[10px] font-medium text-red-500'>
							{error}
						</motion.p>
					)}

					<p className='text-xs font-medium text-slate-500'>
						Didn't get a code?{' '}
						<button
							type='button'
							className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
							Resend
						</button>
					</p>
				</div>

				<button
					type='submit'
					disabled={loading || otp.join('').length < OTP_LENGTH}
					className='group bg-primary-400 hover:bg-primary-500 relative flex w-full items-center justify-center gap-3 rounded-[32px] px-6 py-4 text-center text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'>
					<span>{loading ? 'Verifying...' : 'Verify code'}</span>
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
