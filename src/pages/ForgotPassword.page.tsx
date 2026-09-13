import { useState } from 'react';
import { Link } from 'react-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useForgotPassword } from '@/api/modules/auth';
import pages from '@/Routes/pages';
import applyApiFieldErrors from '@/utils/apiFormErrors.util';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';

interface IForgotPasswordFormValues {
	email: string;
}

const forgotPasswordSchema = Yup.object().shape({
	email: Yup.string().email('Enter a valid email address').required('Email is required'),
});

const ForgotPasswordPage = () => {
	const forgotPassword = useForgotPassword();
	const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

	const formik = useFormik<IForgotPasswordFormValues>({
		initialValues: { email: '' },
		validationSchema: forgotPasswordSchema,
		onSubmit: async (values) => {
			try {
				await forgotPassword.mutateAsync({ email: values.email });
				setSubmittedEmail(values.email);
			} catch (error) {
				applyApiFieldErrors(error, formik);
			}
		},
	});

	const handleResend = async () => {
		if (!submittedEmail) return;
		try {
			await forgotPassword.mutateAsync({ email: submittedEmail });
		} catch (error) {
			applyApiFieldErrors(error, formik);
		}
	};

	return (
		<div className='relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0b0f] text-white lg:flex-row'>
			{/* Ambient Purple Glowing Gradient */}
			<div className='pointer-events-none absolute -top-44 -left-44 h-[700px] w-[700px] rounded-full bg-purple-600/25 blur-[170px]' />
			<div className='pointer-events-none absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[150px]' />

			{/* Decorative Corner Outline */}
			<div className='pointer-events-none absolute top-12 right-0 hidden h-64 w-48 rounded-l-[40px] border-y border-l border-purple-500/20 lg:block' />

			{/* ─── Left Panel: Hero Showcase (Purple Theme & Agent1o1 Tagline) ─── */}
			<div className='relative z-10 flex flex-1 flex-col justify-between p-8 sm:p-12 lg:p-16'>
				<div>
					<div className='inline-flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/15 px-3.5 py-1 text-[11px] font-bold tracking-wider text-purple-300 uppercase'>
						<span className='size-1.5 rounded-full bg-purple-400 animate-pulse' />
						PASSWORD RECOVERY
					</div>

					<h1 className='mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]'>
						Build <br />
						<span className='font-serif italic text-purple-400'>Autonomous.</span> <br />
						AI Agents.
					</h1>
				</div>

				{/* 3 Feature Boxes */}
				<div className='my-10 flex max-w-md flex-col gap-3.5'>
					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Autonomous agent workflows
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								Connect LLMs, memory, and tools to automate complex tasks.
							</div>
						</div>
					</div>

					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
								<path d='m9 12 2 2 4-4' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Enterprise-ready isolation
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								Role-based access, credential vaults, and full audit trails.
							</div>
						</div>
					</div>

					<div className='flex items-center gap-4 rounded-2xl border border-purple-500/25 bg-[#120f1d]/85 p-4 backdrop-blur-xl shadow-lg shadow-black/30 transition-all hover:border-purple-500/50 hover:bg-[#181427]/90'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-inner'>
							<svg
								className='size-5 text-purple-300'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M3 3v18h18' />
								<path d='m19 9-5 5-4-4-3 3' />
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>
								Execution at planetary scale
							</div>
							<div className='text-xs text-[#9d9eb5]'>
								High-throughput orchestration with millisecond latency.
							</div>
						</div>
					</div>
				</div>

				{/* Social Proof */}
				<div className='flex items-center gap-4 pt-2'>
					<div className='flex -space-x-2.5'>
						<img
							src={Avatar1}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
						<img
							src={Avatar2}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
						<img
							src={Avatar3}
							alt='Builder'
							className='size-8 rounded-full object-cover ring-2 ring-purple-900'
						/>
					</div>
					<div>
						<div className='text-[10px] font-bold tracking-widest text-purple-300/80 uppercase'>
							TRUSTED BY BUILDERS
						</div>
						<div className='text-xs font-bold tracking-tight text-white'>
							JOIN 5,000+ TOP-TIER AI DEVELOPERS
						</div>
					</div>
				</div>
			</div>

			{/* ─── Right Panel: Floating Card ───────────────────────────── */}
			<div className='relative z-10 flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12'>
				<div className='w-full max-w-[460px] rounded-[32px] border border-white/80 bg-white p-8 sm:p-10 shadow-2xl shadow-purple-950/20'>
					{/* Wordmark */}
					<div className='mb-6 flex items-center justify-between'>
						<Link to='/' className='flex items-center gap-2 group'>
							<div className='flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 transition-transform group-hover:scale-105'>
								<svg
									className='size-5'
									viewBox='0 0 24 24'
									fill='currentColor'>
									<path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
								</svg>
							</div>
							<div className='flex items-baseline'>
								<span className='text-xl font-black tracking-tight text-zinc-900'>
									agent
								</span>
								<span className='text-xl font-black tracking-tight text-purple-600'>
									1o1
								</span>
							</div>
						</Link>

						<Link
							to={pages.pagesExamples.login.to}
							className='text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline'>
							Back to sign in
						</Link>
					</div>

					{submittedEmail ? (
						<div className='grid gap-y-5 text-center'>
							<div>
								<h2 className='text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl'>
									Check your inbox
								</h2>
								<p className='mt-2 text-xs font-medium text-zinc-500'>
									If an account exists for{' '}
									<span className='font-bold text-zinc-900'>
										{submittedEmail}
									</span>
									, we've sent reset instructions to it.
								</p>
							</div>

							<Alert color='violet' variant='soft' icon='MailCheck01' className='text-left text-xs'>
								The reset link is valid for 60 minutes. Check your spam folder if you
								don't see it.
							</Alert>

							<div className='grid gap-y-2.5 pt-2'>
								<button
									type='button'
									disabled={forgotPassword.isPending}
									onClick={handleResend}
									className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold tracking-wider text-zinc-700 uppercase shadow-2xs hover:bg-zinc-50 disabled:opacity-50'>
									{forgotPassword.isPending && <Spinner className='size-4' />}
									RESEND LINK
								</button>

								<Link to={pages.pagesExamples.login.to}>
									<button
										type='button'
										className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-purple-600/25 transition-all hover:bg-purple-700'>
										BACK TO SIGN IN ›
									</button>
								</Link>
							</div>
						</div>
					) : (
						<>
							<div>
								<h2 className='text-3xl font-extrabold tracking-tight text-zinc-900'>
									Forgot password?
								</h2>
								<p className='mt-1 text-xs font-medium text-zinc-500'>
									Enter your email and we’ll send you a reset link.
								</p>
							</div>

							<form className='mt-6 grid gap-y-4' onSubmit={formik.handleSubmit}>
								<div>
									<label
										htmlFor='email'
										className='mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
										EMAIL ADDRESS
									</label>
									<div className='flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:border-purple-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/15'>
										<Icon icon='Mail01' className='size-4 text-zinc-400 shrink-0' />
										<input
											className='input-clean w-full border-0 border-none bg-transparent p-0 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 shadow-none'
											id='email'
											name='email'
											type='email'
											autoComplete='email'
											autoFocus
											value={formik.values.email}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='name@example.com'
										/>
									</div>
									{formik.touched.email && formik.errors.email && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.email}
										</p>
									)}
								</div>

								<button
									type='submit'
									disabled={forgotPassword.isPending}
									className='mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-purple-600/25 transition-all hover:bg-purple-700 active:bg-purple-800 disabled:pointer-events-none disabled:opacity-50'>
									{forgotPassword.isPending && <Spinner className='size-4' />}
									SEND RESET LINK ›
								</button>
							</form>

							<p className='mt-6 text-center text-xs text-zinc-500'>
								Remember your password?{' '}
								<Link
									to={pages.pagesExamples.login.to}
									className='font-bold text-purple-600 transition-colors hover:text-purple-700'>
									Sign in
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
