import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import pages from '@/Routes/pages';
import { useAuth } from '@/context/auth';
import { ApiError, notify } from '@/api/core';
import { useAcceptWorkspaceInvitation } from '@/api/modules/workspace-members';
import { workspaceKeys } from '@/api/modules/workspaces';
import { userKeys } from '@/api/modules/user';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import AuthLayout from '../_partial/AuthLayout.partial';
import AuthCardHeader from '../_partial/AuthCardHeader.partial';

const primaryButton =
	'bg-primary-600 shadow-primary-600/25 hover:bg-primary-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-3.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButton =
	'flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-3.5 text-xs font-bold tracking-wider text-zinc-700 uppercase transition-all hover:bg-zinc-50';

/** Maps an accept failure onto something the invitee can act on. */
const acceptErrorText = (error: unknown) => {
	if (!ApiError.is(error)) return 'Could not accept the invitation. Try again.';
	// Laravel's `signed` middleware answers 403 for a tampered or lapsed link.
	if (error.status === 403) {
		return 'This invitation link is invalid or has expired. Ask the workspace admin to send a new one.';
	}
	return error.message;
};

type TNoticeProps = { tone: 'error' | 'info'; title: string; children: string };

const Notice = ({ tone, title, children }: TNoticeProps) => (
	<div
		className={`w-full rounded-2xl border p-5 ${
			tone === 'error' ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'
		}`}>
		<div className='flex items-start gap-3'>
			<Icon
				icon='AlertCircle'
				className={`mt-0.5 size-4 shrink-0 ${tone === 'error' ? 'text-rose-500' : 'text-amber-500'}`}
			/>
			<div className='text-left'>
				<p
					className={`text-sm font-bold ${tone === 'error' ? 'text-rose-800' : 'text-amber-800'}`}>
					{title}
				</p>
				<p
					className={`mt-1 text-xs font-medium ${tone === 'error' ? 'text-rose-700' : 'text-amber-700'}`}>
					{children}
				</p>
			</div>
		</div>
	</div>
);

// ============================================================
// AcceptInvitationPage
// ------------------------------------------------------------
// Landing spot for an emailed workspace invitation. The backend's accept
// route is `signed`, so the link's `expires` + `signature` query is passed
// through verbatim. Accepting is an explicit click, not automatic on load:
// the invitation is bound to one email, and the reader may be signed in as
// someone else.
// ============================================================
const AcceptInvitationPage = () => {
	const { invitationId = '' } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { isAuthenticated, isLoading, userData, onLogout } = useAuth();
	const accept = useAcceptWorkspaceInvitation();

	const query = location.search.replace(/^\?/, '');
	const signed = new URLSearchParams(query);
	const isSignedLink = !!invitationId && signed.has('signature') && signed.has('expires');
	const returnTo = `${location.pathname}${location.search}`;

	const handleAccept = () =>
		accept.mutate(
			{ invitationId, query },
			{
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
					void queryClient.invalidateQueries({ queryKey: userKeys.current() });
					notify.success('Invitation accepted. Welcome to the workspace!');
				},
			},
		);

	const handleSwitchAccount = async () => {
		await onLogout(false);
		navigate(pages.identity.login.to, { replace: true, state: { from: returnTo } });
	};

	const renderBody = () => {
		if (isLoading) {
			return (
				<div className='flex justify-center py-10'>
					<Spinner />
				</div>
			);
		}

		if (!isSignedLink) {
			return (
				<Notice tone='error' title='This invitation link is incomplete'>
					Open the link from your invitation email again, or ask the workspace admin to
					send a new one.
				</Notice>
			);
		}

		if (!isAuthenticated) {
			return (
				<>
					<Notice tone='info' title='Sign in to accept'>
						Use the account for the email address this invitation was sent to. New here?
						Create an account with that email first.
					</Notice>
					<div className='flex w-full flex-col gap-3'>
						<Link
							to={pages.identity.login.to}
							state={{ from: returnTo }}
							className={primaryButton}>
							SIGN IN TO ACCEPT ›
						</Link>
						<Link
							to={pages.identity.signup.to}
							state={{ from: returnTo }}
							className={secondaryButton}>
							CREATE AN ACCOUNT
						</Link>
					</div>
				</>
			);
		}

		if (accept.isSuccess) {
			return (
				<>
					<p className='text-xs font-medium text-zinc-500'>
						You are now a member. Pick the workspace to open it.
					</p>
					<button
						type='button'
						onClick={() => navigate(pages.choose.to, { replace: true })}
						className={primaryButton}>
						GO TO MY WORKSPACES ›
					</button>
				</>
			);
		}

		return (
			<>
				<p className='text-xs font-medium text-zinc-500'>
					Signed in as{' '}
					<span className='font-bold text-zinc-800'>
						{userData?.email ?? 'your account'}
					</span>
					. The invitation must have been sent to this email.
				</p>
				{accept.isError && (
					<Notice tone='error' title='Could not accept the invitation'>
						{acceptErrorText(accept.error)}
					</Notice>
				)}
				<div className='flex w-full flex-col gap-3'>
					<button
						type='button'
						onClick={handleAccept}
						disabled={accept.isPending}
						className={primaryButton}>
						{accept.isPending ? 'ACCEPTING…' : 'ACCEPT INVITATION ›'}
					</button>
					<button type='button' onClick={handleSwitchAccount} className={secondaryButton}>
						USE A DIFFERENT ACCOUNT
					</button>
				</div>
			</>
		);
	};

	return (
		<AuthLayout badge='INVITATION'>
			<AuthCardHeader
				right={
					isAuthenticated ? (
						<Link
							to={pages.choose.to}
							className='text-primary-600 hover:text-primary-700 font-semibold hover:underline'>
							My workspaces
						</Link>
					) : null
				}
			/>

			<div className='flex flex-col items-center gap-6 text-center'>
				<div className='bg-primary-100 text-primary-700 flex size-20 items-center justify-center rounded-full'>
					<Icon
						icon={accept.isSuccess ? 'CheckmarkCircle02' : 'AddTeam'}
						className='size-10'
					/>
				</div>

				<div>
					<h2 className='text-3xl font-extrabold tracking-tight text-zinc-950'>
						{accept.isSuccess ? "You're in" : 'Join a workspace'}
					</h2>
					<p className='mt-1 text-xs font-medium text-zinc-500'>
						{accept.isSuccess
							? 'The invitation was accepted.'
							: "You've been invited to collaborate in a workspace."}
					</p>
				</div>

				{renderBody()}
			</div>
		</AuthLayout>
	);
};

export default AcceptInvitationPage;
