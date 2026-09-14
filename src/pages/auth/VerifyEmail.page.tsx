import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthShell from './_partial/AuthShell.partial';
import Icon from '@/components/icon/Icon';
import pages from '@/Routes/pages';
import { useAuth } from '@/context/authContext';
import { useResendVerificationEmail } from '@/api/modules/auth';

// ============================================================
// Verify email
// ------------------------------------------------------------
// The emailed link points at the API's signed route, which the
// browser follows directly — the frontend never calls it. The API
// then redirects back here as
//   /email-verified?status=verified
//   /email-verified?status=error&error=<message>
// (see AuthController::verifyEmail), so this page reads that
// result rather than verifying anything itself.
// ============================================================

const VerifyEmailPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const { userData, refreshCurrentUser } = useAuth();
	const resendVerification = useResendVerificationEmail();

	const returnedFromVerification = location.pathname === '/email-verified';
	const status = searchParams.get('status');
	const verificationError = status === 'error' ? searchParams.get('error') : null;
	const isVerified =
		status === 'verified' || (returnedFromVerification && !verificationError) ||
		!!userData?.email_verified_at;

	useEffect(() => {
		// The account is only newly verified on the way back from the link.
		if (returnedFromVerification && !verificationError) void refreshCurrentUser();
	}, [refreshCurrentUser, returnedFromVerification, verificationError]);

	const handleResend = async () => {
		await resendVerification.mutateAsync();
	};

	return (
		<AuthShell
			badge='Verify email'
			title={
				<span className='text-slate-950'>
					{isVerified ? 'Email verified' : 'Check your inbox'}
				</span>
			}
			subtitle={
				isVerified
					? 'Your account is verified and ready for the next setup steps.'
					: 'Confirm your email when convenient, or continue setting up your workspace.'
			}
			mobileTitle='Almost there!'
			mobileSubtitle='Confirm your email address to start using Agent1o1.'
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
			<div className='flex flex-col items-center gap-8 py-4 text-center'>
				<motion.div
					animate={{ y: [0, -8, 0] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
					className='bg-primary-100 text-primary-700 flex h-24 w-24 items-center justify-center rounded-full'>
					<Icon icon='AiMail' className='h-12 w-12' />
				</motion.div>

				<div className='space-y-3'>
					<p className='text-sm font-medium text-slate-500'>
						We sent a verification link to
					</p>
					<p className='text-base font-black text-slate-950'>
						{userData?.email ?? 'your email address'}
					</p>
					<p className='text-sm font-medium text-slate-500'>
						Click the link in that email to verify your account. Check your spam folder
						if you don't see it within a few minutes.
					</p>
				</div>

				{/* A failed link is reported, but resending stays available below
				    — that is the way out of an expired link. */}
				{verificationError && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className='flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-700'>
						<Icon icon='Alert02' className='h-4 w-4' />
						{verificationError}
					</motion.div>
				)}

				{isVerified ? (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className='flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700'>
						<Icon icon='CheckmarkCircle01' className='h-4 w-4' />
						Email verification complete
					</motion.div>
				) : resendVerification.isSuccess ? (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className='flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700'>
						<Icon icon='CheckmarkCircle01' className='h-4 w-4' />
						Verification email resent!
					</motion.div>
				) : (
					<button
						type='button'
						onClick={handleResend}
						disabled={resendVerification.isPending}
						className='group bg-primary-400 hover:bg-primary-500 flex items-center gap-3 rounded-[32px] px-8 py-4 text-sm font-black tracking-[0.1em] text-primary-950 uppercase transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(109,40,217,0.45)] active:scale-[0.98] disabled:opacity-60'>
						<span>{resendVerification.isPending ? 'Sending...' : 'Resend email'}</span>
						<Icon icon='AiMail' className='h-4 w-4' />
					</button>
				)}

				<button
					type='button'
					onClick={() => navigate('/onboarding')}
					className='flex items-center gap-2 rounded-[32px] border border-slate-200 px-8 py-4 text-sm font-black tracking-[0.08em] text-slate-700 uppercase transition hover:bg-slate-50'>
					Continue to onboarding
					<Icon icon='ArrowRight01' className='h-4 w-4' />
				</button>
			</div>
		</AuthShell>
	);
};

export default VerifyEmailPage;
