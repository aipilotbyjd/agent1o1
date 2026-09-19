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
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';

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
		<AuthLayout badge='PASSWORD RECOVERY'>
			<AuthCardHeader
				right={
					<Link
						to={pages.identity.login.to}
						className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
						Back to sign in
					</Link>
				}
			/>

			{submittedEmail ? (
				<div className='grid gap-y-5 text-center'>
					<div>
						<h2 className='text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl'>
							Check your inbox
						</h2>
						<p className='mt-2 text-xs font-medium text-zinc-500'>
							If an account exists for{' '}
							<span className='font-bold text-zinc-950'>{submittedEmail}</span>, we've
							sent reset instructions to it.
						</p>
					</div>

					<Alert
						color='violet'
						variant='soft'
						icon='MailCheck01'
						className='text-left text-xs'>
						The reset link is valid for 60 minutes. Check your spam folder if you don't
						see it.
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

						<Link to={pages.identity.login.to}>
							<button
								type='button'
								className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all'>
								BACK TO SIGN IN ›
							</button>
						</Link>
					</div>
				</div>
			) : (
				<>
					<div>
						<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
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
							<div className='focus-within:border-primary-500 focus-within:ring-primary-500/15 flex items-center gap-2.5 rounded-xl border border-[#d8e2ee] bg-[#eef2f8] px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:ring-2'>
								<Icon icon='Mail01' className='size-4 shrink-0 text-zinc-400' />
								<input
									className='input-clean w-full border-0 border-none bg-transparent p-0 text-sm font-medium text-zinc-950 shadow-none placeholder:text-zinc-400 focus:border-none focus:ring-0 focus:outline-none'
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
								<p className='mt-1 text-xs text-red-500'>{formik.errors.email}</p>
							)}
						</div>

						<button
							type='submit'
							disabled={forgotPassword.isPending}
							className='bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 active:bg-primary-800 mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:pointer-events-none disabled:opacity-50'>
							{forgotPassword.isPending && <Spinner className='size-4' />}
							SEND RESET LINK ›
						</button>
					</form>

					<p className='mt-6 text-center text-xs text-zinc-500'>
						Remember your password?{' '}
						<Link
							to={pages.identity.login.to}
							className='text-primary-600 hover:text-primary-700 font-bold transition-colors'>
							Sign in
						</Link>
					</p>
				</>
			)}
		</AuthLayout>
	);
};

export default ForgotPasswordPage;
