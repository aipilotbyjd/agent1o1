import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useExchangeSocialCode } from '@/api/modules/auth';
import { messageFromError } from '@/api/core';
import useAfterAuthRedirect from '@/hooks/useAfterAuthRedirect';
import Agent1o1Wordmark from '@/components/common/Agent1o1Wordmark';
import Card, { CardBody } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import pages from '@/Routes/pages';

// ============================================================
// OAuth Callback
// ------------------------------------------------------------
// Landing spot for the social sign-in round trip. The provider goes
// to the backend, which redirects here with a single-use exchange
// code (valid ~60s) or an `error` message — see
// `AuthController::handleProviderCallback`.
// ============================================================

const OAuthCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const redirectAfterAuth = useAfterAuthRedirect();
	const exchange = useExchangeSocialCode();

	const code = searchParams.get('code');
	const providerError = searchParams.get('error');

	const [error, setError] = useState<string | null>(providerError);
	// The code burns on first use, and StrictMode runs effects twice in dev.
	const hasExchanged = useRef(false);

	useEffect(() => {
		if (providerError) return;
		if (!code) {
			setError('This sign-in link is missing its code. Please try again.');
			return;
		}
		if (hasExchanged.current) return;
		hasExchanged.current = true;

		exchange.mutate(
			{ code },
			{
				onSuccess: () => {
					void redirectAfterAuth();
				},
				onError: (err) =>
					setError(messageFromError(err, 'Sign-in could not be completed.')),
			},
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [code, providerError]);

	return (
		<div className='flex h-full items-center justify-center'>
			<div className='mx-auto w-full max-w-md p-6'>
				<Card>
					<CardBody className='p-8!'>
						<div className='mb-8 flex w-full items-center justify-center'>
							<Agent1o1Wordmark size='lg' />
						</div>

						{error ? (
							<div className='grid gap-y-4'>
								<Alert color='red' icon='Alert02' title='Sign-in failed'>
									{error}
								</Alert>
								<Link to={pages.pagesExamples.login.to}>
									<Button
										aria-label='Back to sign in'
										variant='solid'
										className='w-full py-2.5! font-bold'>
										Back to sign in
									</Button>
								</Link>
							</div>
						) : (
							<div className='flex flex-col items-center gap-4 py-6 text-center'>
								<Spinner />
								<p className='text-sm text-zinc-600 dark:text-zinc-400'>
									Finishing sign-in…
								</p>
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default OAuthCallbackPage;
