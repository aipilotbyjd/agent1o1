import { Laptop, LogOut, MonitorSmartphone } from 'lucide-react';
import { notify } from '@/api/core';
import { useAuthSessions, useLogoutAll, useRevokeSession } from '@/api/modules/auth';
import { useConfirm } from '@/context/confirmContext';
import { dangerBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass } from '../_helper/security.constants';

// ============================================================
// Active sessions
// ------------------------------------------------------------
// GET /auth/sessions lists the account's issued access tokens.
// TokenResource carries id/name/scopes/revoked/expires_at/
// created_at — no device or IP, so a session is described by the
// token name and when it was issued, not by "Chrome on macOS".
// ============================================================

const formatDate = (value: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? '—'
		: date.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
};

const SessionsCard = () => {
	const { confirm } = useConfirm();
	const { data: sessions, isLoading } = useAuthSessions();
	const revokeSession = useRevokeSession();
	const logoutAll = useLogoutAll();

	const activeSessions = (sessions ?? []).filter((session) => !session.revoked);

	const handleRevoke = async (id: string, name: string | null) => {
		const confirmed = await confirm({
			title: 'Revoke session',
			confirmText: 'Revoke',
			message: `"${name || 'This session'}" will be signed out immediately.`,
		});
		if (!confirmed) return;

		await revokeSession.mutateAsync(id);
		notify.success('Session revoked.');
	};

	const handleLogoutAll = async () => {
		const confirmed = await confirm({
			title: 'Sign out everywhere',
			confirmText: 'Sign out everywhere',
			message:
				'Every session is revoked, including this one — you will be asked to sign in again.',
		});
		if (!confirmed) return;

		// Revokes this session too, so the token clears and the auth listener
		// sends us back to sign-in.
		await logoutAll.mutateAsync();
	};

	return (
		<section className={cardClass}>
			<div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
				<div className='flex items-start gap-3'>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-400/15 dark:text-primary-300'>
						<MonitorSmartphone size={16} />
					</div>
					<div>
						<h2 className='text-base font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
							Active sessions
						</h2>
						<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
							Every device currently signed in to this account.
						</p>
					</div>
				</div>

				<button
					type='button'
					onClick={handleLogoutAll}
					disabled={logoutAll.isPending || activeSessions.length === 0}
					className={dangerBtn}>
					<LogOut size={15} />
					{logoutAll.isPending ? 'Signing out…' : 'Sign out everywhere'}
				</button>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className='h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			) : activeSessions.length === 0 ? (
				<p className='rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'>
					No active sessions found.
				</p>
			) : (
				<div className='overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800'>
					{activeSessions.map((session, index) => (
						<div
							key={session.id}
							className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 ${
								index > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''
							}`}>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
									<Laptop size={15} />
								</div>
								<div className='min-w-0'>
									<p className='truncate text-sm font-bold text-zinc-900 dark:text-zinc-100'>
										{session.name || 'Access token'}
									</p>
									<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
										Signed in {formatDate(session.created_at)}
										{session.expires_at
											? ` · expires ${formatDate(session.expires_at)}`
											: ''}
									</p>
								</div>
							</div>

							<button
								type='button'
								onClick={() => handleRevoke(session.id, session.name)}
								disabled={revokeSession.isPending}
								className={secondaryBtn}>
								Revoke
							</button>
						</div>
					))}
				</div>
			)}
		</section>
	);
};

export default SessionsCard;
