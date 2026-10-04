import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useVerifyEmail } from '@/api/modules/auth';
import { useAuth } from '@/context/auth';
import Wordmark from '@/components/common/Wordmark';
import Card, { CardBody } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import pages from '@/Routes/pages';
import { messageFromError } from '@/api/core';

const EmailVerifiedPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { isAuthenticated } = useAuth();
	const verifyEmail = useVerifyEmail();

	const status = searchParams.get('status');
	const errorParam = searchParams.get('error');
	const id = searchParams.get('id');
	const hash = searchParams.get('hash');

	const [isVerified, setIsVerified] = useState(status === 'verified');
	const [error, setError] = useState<string | null>(errorParam);
	const [isLoading, setIsLoading] = useState(!isVerified && !error && !!id && !!hash);

	const hasVerifiedRef = useRef(false);

	useEffect(() => {
		if (isVerified || error || !id || !hash) return;
		if (hasVerifiedRef.current) return;
		hasVerifiedRef.current = true;

		// Extract all query params for signed verification link
		const query: Record<string, string> = {};
		searchParams.forEach((value, key) => {
			if (key !== 'id' && key !== 'hash') {
				query[key] = value;
			}
		});

		verifyEmail.mutate(
			{ id, hash, query },
			{
				onSuccess: () => {
					setIsVerified(true);
					setIsLoading(false);
				},
				onError: (err) => {
					setError(messageFromError(err, 'Email verification link is invalid or expired.'));
					setIsLoading(false);
				},
			},
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, hash]);

	return (
		<div className='flex h-full items-center justify-center'>
			<div className='mx-auto w-full max-w-md p-6'>
				<Card>
					<CardBody className='p-8!'>
						<div className='mb-8 flex w-full items-center justify-center'>
							<Wordmark size='lg' />
						</div>

						{isLoading ? (
							<div className='flex flex-col items-center gap-4 py-6 text-center'>
								<Spinner />
								<p className='text-sm text-zinc-600 dark:text-zinc-400'>
									Verifying your email address…
								</p>
							</div>
						) : error ? (
							<div className='grid gap-y-6 text-center'>
								<div>
									<h1 className='block text-2xl font-bold text-zinc-800 dark:text-white'>
										Verification failed
									</h1>
									<p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
										We were unable to verify your email address.
									</p>
								</div>

								<Alert color='red' variant='soft' icon='Alert02' className='text-left'>
									{error}
								</Alert>

								<Link to={pages.identity.login.to}>
									<Button
										aria-label='Back to sign in'
										variant='solid'
										className='w-full py-2.5! font-bold'>
										Back to sign in
									</Button>
								</Link>
							</div>
						) : (
							<div className='grid gap-y-6 text-center'>
								<div>
									<h1 className='block text-2xl font-bold text-zinc-800 dark:text-white'>
										Email verified!
									</h1>
									<p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
										Your email address has been successfully verified. You now have
										full access to your account and workspaces.
									</p>
								</div>

								<Alert
									color='emerald'
									variant='soft'
									icon='CheckmarkCircle02'
									className='text-left'>
									Verification complete. Thank you for securing your account!
								</Alert>

								{isAuthenticated ? (
									<Button
										aria-label='Go to Dashboard'
										variant='solid'
										className='w-full py-2.5! font-bold'
										onClick={() => navigate(pages.workspace.to)}>
										Continue to Dashboard
									</Button>
								) : (
									<Link to={pages.identity.login.to}>
										<Button
											aria-label='Sign in'
											variant='solid'
											className='w-full py-2.5! font-bold'>
											Sign in to your account
										</Button>
									</Link>
								)}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default EmailVerifiedPage;
