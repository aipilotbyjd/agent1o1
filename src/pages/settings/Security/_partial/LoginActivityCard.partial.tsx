import { useState } from 'react';
import { History } from 'lucide-react';
import { useAuthEvents } from '@/api/modules/auth';
import Spinner from '@/components/ui/Spinner';
import { secondaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass, describeUserAgent, formatDateTime } from '../_helper/security.helper';

const PER_PAGE = 10;

/** Events that deserve a second look get a warning tint. */
const isWarning = (event: string) => /fail|lock|disabled|revoked|reset/i.test(event);

const LoginActivityCard = () => {
	const [page, setPage] = useState(1);
	const { data, isLoading, isError, isFetching, refetch } = useAuthEvents({
		page,
		per_page: PER_PAGE,
	});

	const events = data?.events ?? [];
	const lastPage = data?.meta?.last_page ?? 1;

	return (
		<section className={cardClass}>
			<div className='flex items-start gap-4'>
				<div className='bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
					<History size={16} />
				</div>
				<div>
					<h2 className='text-base font-black text-zinc-950 dark:text-zinc-50'>
						Security activity
					</h2>
					<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						Sign-ins and account changes. If something here was not you, change your
						password.
					</p>
				</div>
			</div>

			<div className='mt-5'>
				{isLoading ? (
					<div className='flex justify-center py-8'>
						<Spinner color='primary' className='size-6' />
					</div>
				) : isError ? (
					<div className='flex flex-col items-center gap-3 py-8 text-center'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							Could not load security activity.
						</p>
						<button type='button' onClick={() => refetch()} className={secondaryBtn}>
							Retry
						</button>
					</div>
				) : events.length === 0 ? (
					<p className='py-8 text-center text-sm font-semibold text-zinc-400'>
						No activity recorded yet.
					</p>
				) : (
					<ul
						className={`divide-y divide-zinc-100 transition-opacity dark:divide-zinc-800 ${isFetching ? 'opacity-60' : ''}`}>
						{events.map((event) => (
							<li
								key={event.id}
								className='flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
								<div className='flex min-w-0 items-center gap-2.5'>
									<span
										className={`size-2 shrink-0 rounded-full ${isWarning(event.event) ? 'bg-amber-500' : 'bg-emerald-500'}`}
									/>
									<div className='min-w-0'>
										<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
											{event.label}
										</p>
										<p className='truncate text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											{[
												event.ip_address,
												event.user_agent
													? describeUserAgent(event.user_agent)
													: null,
											]
												.filter(Boolean)
												.join(' · ') || 'No device details'}
										</p>
									</div>
								</div>
								<span className='shrink-0 pl-4.5 text-xs font-semibold text-zinc-400 sm:pl-0 dark:text-zinc-500'>
									{formatDateTime(event.created_at)}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>

			{lastPage > 1 && (
				<div className='mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800'>
					<span className='text-xs font-semibold text-zinc-400'>
						Page {page} of {lastPage}
					</span>
					<div className='flex gap-2'>
						<button
							type='button'
							disabled={page <= 1 || isFetching}
							onClick={() => setPage((p) => p - 1)}
							className={secondaryBtn}>
							Newer
						</button>
						<button
							type='button'
							disabled={page >= lastPage || isFetching}
							onClick={() => setPage((p) => p + 1)}
							className={secondaryBtn}>
							Older
						</button>
					</div>
				</div>
			)}
		</section>
	);
};

export default LoginActivityCard;
