import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, MonitorSmartphone, Trash2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useAuthSessions, useLogoutAll, useRevokeSession } from '@/api/modules/auth';
import { useAuth } from '@/context/auth';
import { useConfirm } from '@/context/confirm';
import pages from '@/Routes/pages';
import Spinner from '@/components/ui/Spinner';
import { secondaryBtn } from '@/pages/settings/_shared/buttons';
import type { TAuthSession } from '@/types/auth.type';
import {
	cardClass,
	describeUserAgent,
	formatDateTime,
	relativeTime,
} from '../_helper/security.helper';

/** Current device first, then most recently used. */
const sortSessions = (sessions: TAuthSession[]) =>
	[...sessions].sort((a, b) => {
		if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
		const aTime = new Date(a.last_used_at ?? a.created_at).getTime();
		const bTime = new Date(b.last_used_at ?? b.created_at).getTime();
		return bTime - aTime;
	});

const SessionsCard = () => {
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const { onLogout } = useAuth();
	const { data, isLoading, isError, refetch } = useAuthSessions();
	const revokeSession = useRevokeSession();
	const logoutAll = useLogoutAll();

	const sessions = useMemo(
		() => sortSessions((data ?? []).filter((session) => !session.revoked)),
		[data],
	);

	const handleRevoke = async (session: TAuthSession) => {
		const device = describeUserAgent(session.user_agent);
		const confirmed = await confirm({
			title: session.is_current ? 'Sign out of this device' : 'Revoke session',
			confirmText: session.is_current ? 'Sign out' : 'Revoke',
			message: session.is_current
				? 'This is the session you are using now. Revoking it signs you out here.'
				: `${device} will be signed out and will need to sign in again.`,
		});
		if (!confirmed) return;

		try {
			await revokeSession.mutateAsync(session.id);
			if (session.is_current) {
				await onLogout();
				return;
			}
			notify.success(`Signed out ${device}.`);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleLogoutAll = async () => {
		const confirmed = await confirm({
			title: 'Sign out everywhere',
			confirmText: 'Sign out everywhere',
			message: 'Every device, including this one, will be signed out.',
		});
		if (!confirmed) return;

		try {
			await logoutAll.mutateAsync();
		} catch {
			// Toast is handled by the API hook; tokens are cleared either way.
		}
		navigate(pages.identity.login.to, { replace: true });
	};

	return (
		<section className={cardClass}>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-4'>
					<div className='bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
						<MonitorSmartphone size={16} />
					</div>
					<div>
						<h2 className='text-base font-black text-zinc-950 dark:text-zinc-50'>
							Active sessions
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Devices that are signed in to your account.
						</p>
					</div>
				</div>
				<button
					type='button'
					disabled={logoutAll.isPending}
					onClick={handleLogoutAll}
					className={`${secondaryBtn} ml-13 sm:ml-0`}>
					<LogOut size={15} />
					{logoutAll.isPending ? 'Signing out...' : 'Sign out everywhere'}
				</button>
			</div>

			<div className='mt-5'>
				{isLoading ? (
					<div className='flex justify-center py-8'>
						<Spinner color='primary' className='size-6' />
					</div>
				) : isError ? (
					<div className='flex flex-col items-center gap-3 py-8 text-center'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							Could not load your sessions.
						</p>
						<button type='button' onClick={() => refetch()} className={secondaryBtn}>
							Retry
						</button>
					</div>
				) : sessions.length === 0 ? (
					<p className='py-8 text-center text-sm font-semibold text-zinc-400'>
						No active sessions.
					</p>
				) : (
					<ul className='divide-y divide-zinc-100 dark:divide-zinc-800'>
						{sessions.map((session) => {
							const lastActive = relativeTime(session.last_used_at);
							return (
								<li
									key={session.id}
									className='flex items-center justify-between gap-4 py-3.5'>
									<div className='min-w-0'>
										<p className='flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100'>
											{describeUserAgent(session.user_agent)}
											{session.is_current && (
												<span className='bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 rounded-md px-2 py-0.5 text-[10px] font-bold'>
													This device
												</span>
											)}
										</p>
										<p className='mt-0.5 truncate text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											{[
												session.ip_address,
												lastActive ? `Active ${lastActive}` : null,
												`Signed in ${formatDateTime(session.created_at)}`,
											]
												.filter(Boolean)
												.join(' · ')}
										</p>
									</div>
									<button
										type='button'
										aria-label={
											session.is_current
												? 'Sign out of this device'
												: `Revoke ${describeUserAgent(session.user_agent)}`
										}
										disabled={revokeSession.isPending}
										onClick={() => handleRevoke(session)}
										className='shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10'>
										<Trash2 size={16} />
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</section>
	);
};

export default SessionsCard;
