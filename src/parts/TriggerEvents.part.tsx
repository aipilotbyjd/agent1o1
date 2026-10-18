import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { useTriggerEventFeed } from '@/api/modules/triggers';
import paths from '@/Routes/paths';
import type { TTriggerEvent, TTriggerEventStatus } from '@/types/trigger.type';
import { eventStatusDot } from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';

type TFilter = 'all' | 'fired' | 'failed' | 'rejected' | 'skipped';

const FILTERS: { value: TFilter; label: string; status?: TTriggerEventStatus[] }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'fired', label: 'Ran', status: ['fired'] },
	{ value: 'failed', label: 'Failed', status: ['failed'] },
	{ value: 'rejected', label: 'Rejected', status: ['rejected'] },
	{ value: 'skipped', label: 'Skipped', status: ['skipped', 'ignored', 'duplicate'] },
];

const STATUS_LABEL: Record<TTriggerEventStatus, string> = {
	queued: 'Queued',
	running: 'Running',
	fired: 'Ran',
	ignored: 'Ignored',
	skipped: 'Skipped',
	duplicate: 'Duplicate',
	rejected: 'Rejected',
	failed: 'Failed',
};

const STATUS_TEXT: Partial<Record<TTriggerEventStatus, string>> = {
	fired: 'text-emerald-700 dark:text-emerald-400',
	failed: 'text-rose-600 dark:text-rose-400',
	rejected: 'text-rose-600 dark:text-rose-400',
	queued: 'text-sky-600 dark:text-sky-400',
	running: 'text-sky-600 dark:text-sky-400',
};

const SOURCE_LABEL: Record<string, string> = {
	webhook: 'Webhook',
	schedule: 'Schedule',
	polling: 'New item',
	manual: 'Run now',
};

const EventRow = ({ ws, event }: { ws: string; event: TTriggerEvent }) => {
	const [open, setOpen] = useState(false);
	const hasPayload =
		event.payload !== null &&
		event.payload !== undefined &&
		!(typeof event.payload === 'object' && Object.keys(event.payload as object).length === 0);
	const created = new Date(event.created_at);

	return (
		<li className='rounded-lg border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/60'>
			<div className='flex items-center gap-2 px-2.5 py-2'>
				<button
					type='button'
					aria-expanded={open}
					aria-label={open ? 'Hide details' : 'Show details'}
					onClick={() => setOpen((value) => !value)}
					className='flex min-w-0 flex-1 items-center gap-2 text-left'>
					<ChevronRight
						size={12}
						className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`}
					/>
					<span
						className={`h-2 w-2 shrink-0 rounded-full ${eventStatusDot[event.status]}`}
					/>
					<span
						className={`shrink-0 text-[11px] font-black ${STATUS_TEXT[event.status] ?? 'text-zinc-600 dark:text-zinc-300'}`}>
						{STATUS_LABEL[event.status]}
					</span>
					<span className='shrink-0 rounded bg-zinc-100 px-1.5 py-px text-[9px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
						{SOURCE_LABEL[event.source] ?? event.source}
					</span>
					{event.error && (
						<span className='min-w-0 truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
							{event.error}
						</span>
					)}
				</button>
				<time
					dateTime={event.created_at}
					title={format(created, 'PPpp')}
					className='shrink-0 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					{formatDistanceToNow(created, { addSuffix: true })}
				</time>
				{event.run_id && (
					<Link
						to={paths.trail(ws, event.run_id)}
						title='Open this run in Trail'
						className='text-primary-600 dark:text-primary-400 flex shrink-0 items-center gap-0.5 text-[10px] font-black hover:underline'>
						Run
						<ExternalLink size={10} />
					</Link>
				)}
			</div>

			{open && (
				<div className='space-y-2 border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800'>
					{event.error && (
						<p className='text-[11px] font-semibold text-rose-600 dark:text-rose-400'>
							{event.error}
						</p>
					)}
					<dl className='flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
						<div>
							<dt className='inline text-zinc-400'>Received </dt>
							<dd className='inline'>{format(created, 'PPpp')}</dd>
						</div>
						{event.attempts > 1 && (
							<div>
								<dt className='inline text-zinc-400'>Attempts </dt>
								<dd className='inline'>{event.attempts}</dd>
							</div>
						)}
						{event.duplicate_count > 0 && (
							<div>
								<dt className='inline text-zinc-400'>Repeated deliveries </dt>
								<dd className='inline'>{event.duplicate_count}</dd>
							</div>
						)}
						{event.delivery_id && (
							<div className='min-w-0'>
								<dt className='inline text-zinc-400'>Delivery </dt>
								<dd className='inline font-mono break-all'>{event.delivery_id}</dd>
							</div>
						)}
					</dl>
					{hasPayload ? (
						<pre className='max-h-64 overflow-auto rounded-md bg-zinc-50 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
							{JSON.stringify(event.payload, null, 2)}
						</pre>
					) : (
						<p className='text-[10px] font-semibold text-zinc-400'>No payload.</p>
					)}
				</div>
			)}
		</li>
	);
};

type TProps = {
	ws: string;
	triggerId: string;
};

/**
 * A trigger's event history: everything that arrived, what became of it, and
 * the run it started. Filterable by outcome, a page at a time, refreshing
 * every 10 seconds so a new delivery shows up while you watch.
 */
const TriggerEventsPart = ({ ws, triggerId }: TProps) => {
	const [filter, setFilter] = useState<TFilter>('all');
	const status = FILTERS.find((item) => item.value === filter)?.status;
	const feed = useTriggerEventFeed(ws, triggerId, status);
	const events = useMemo(
		() => feed.data?.pages.flatMap((page) => page.events) ?? [],
		[feed.data],
	);
	const total = feed.data?.pages[0]?.meta.total;

	return (
		<div className='space-y-2.5'>
			<div className='flex flex-wrap items-center gap-1.5'>
				{FILTERS.map((item) => (
					<button
						key={item.value}
						type='button'
						aria-pressed={filter === item.value}
						onClick={() => setFilter(item.value)}
						className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition ${
							filter === item.value
								? 'border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-600 dark:bg-primary-950/30 dark:text-primary-300'
								: 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
						}`}>
						{item.label}
					</button>
				))}
				{total !== undefined && (
					<span className='ml-auto text-[10px] font-semibold text-zinc-400'>
						{total} event{total === 1 ? '' : 's'}
					</span>
				)}
			</div>

			{feed.isLoading ? (
				<div className='space-y-1.5'>
					{[0, 1, 2].map((index) => (
						<div
							key={index}
							className='h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/60'
						/>
					))}
				</div>
			) : feed.isError ? (
				<p className='text-[11px] font-semibold text-rose-500'>Couldn’t load events.</p>
			) : events.length === 0 ? (
				<p className='rounded-lg border border-dashed border-zinc-200 px-3 py-5 text-center text-[11px] font-semibold text-zinc-400 dark:border-zinc-800'>
					{filter === 'all'
						? 'Nothing has arrived yet. Events show up here as they come in.'
						: 'No events with this status.'}
				</p>
			) : (
				<ul className='space-y-1.5'>
					{events.map((event) => (
						<EventRow key={event.id} ws={ws} event={event} />
					))}
				</ul>
			)}

			{feed.hasNextPage && (
				<button
					type='button'
					disabled={feed.isFetchingNextPage}
					onClick={() => void feed.fetchNextPage()}
					className='flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-1.5 text-[10px] font-black text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'>
					{feed.isFetchingNextPage && <Loader2 size={11} className='animate-spin' />}
					Load more
				</button>
			)}
		</div>
	);
};

export default TriggerEventsPart;
