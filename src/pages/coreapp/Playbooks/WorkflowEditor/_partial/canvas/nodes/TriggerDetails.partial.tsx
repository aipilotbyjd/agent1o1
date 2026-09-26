import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Copy, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notify } from '@/api/core';
import { apiConfig } from '@/api/core/config';
import { useRotateTriggerToken, useRunTrigger, useTriggerEvents } from '@/api/modules/triggers';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import type { TTrigger, TTriggerEventStatus } from '@/types/trigger.type';

// The public webhook route is `POST /api/hooks/{token}` — outside `/api/v1`,
// so it is derived from the API base URL rather than an endpoint constant.
// The trigger resource only carries `token`; it never sends a ready-made URL.
const webhookUrlFor = (token: string) =>
	`${apiConfig.baseUrl.replace(/\/v1\/?$/, '')}/hooks/${token}`;

const statusDot: Record<TTriggerEventStatus, string> = {
	processed: 'bg-emerald-500',
	accepted: 'bg-sky-500',
	skipped: 'bg-zinc-300 dark:bg-zinc-600',
	failed: 'bg-rose-500',
};

const EVENTS_SHOWN = 5;

/** Canvas nodes are draggable — every control here has to keep the pointer to itself. */
const stop = (event: React.SyntheticEvent) => event.stopPropagation();

type Props = {
	workspaceId: string;
	trigger: TTrigger;
};

const TriggerDetails = ({ workspaceId, trigger }: Props) => {
	const { confirm } = useConfirm();
	const runTrigger = useRunTrigger(workspaceId);
	const rotateToken = useRotateTriggerToken(workspaceId);
	const [eventsOpen, setEventsOpen] = useState(false);
	// Only fetched once the list is opened; an empty id keeps the query disabled.
	const events = useTriggerEvents(workspaceId, eventsOpen ? trigger.id : '');

	const webhookUrl = trigger.type === 'webhook' && trigger.token ? webhookUrlFor(trigger.token) : '';

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(webhookUrl);
			notify.success('Webhook URL copied');
		} catch {
			notify.error('Could not copy the webhook URL');
		}
	};

	const handleRotate = async () => {
		const confirmed = await confirm({
			title: 'Rotate webhook URL',
			confirmText: 'Rotate',
			message:
				'A new URL is issued and the current one stops working immediately. Anything still posting to it will get a 404 until you update it.',
		});
		if (!confirmed) return;
		rotateToken.mutate(trigger.id, {
			onSuccess: () => notify.success('Webhook URL rotated'),
		});
	};

	const handleRun = () => {
		runTrigger.mutate(trigger.id, {
			onSuccess: () => notify.success('Run queued'),
		});
	};

	return (
		<div className='nodrag flex flex-col gap-2' onPointerDown={stop}>
			{webhookUrl && (
				<div className='flex flex-col gap-1'>
					<div className='flex items-center justify-between'>
						<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
							Webhook URL <span className='font-mono text-zinc-400'>(POST)</span>
						</span>
						<div className='flex items-center gap-0.5'>
							<button
								type='button'
								title='Copy webhook URL'
								onClick={(event) => {
									stop(event);
									handleCopy();
								}}
								className='flex h-5 w-5 cursor-pointer items-center justify-center rounded text-zinc-400 transition hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400'>
								<Copy size={11} />
							</button>
							<button
								type='button'
								title='Rotate webhook URL'
								disabled={rotateToken.isPending}
								onClick={(event) => {
									stop(event);
									handleRotate();
								}}
								className='flex h-5 w-5 cursor-pointer items-center justify-center rounded text-zinc-400 transition hover:bg-primary-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-primary-900/40 dark:hover:text-primary-400'>
								<RefreshCw size={11} className={rotateToken.isPending ? 'animate-spin' : ''} />
							</button>
						</div>
					</div>
					<span className='cursor-text rounded-lg border border-zinc-200 bg-white p-1.5 font-mono text-[9px] font-semibold break-all text-zinc-700 select-all select-text dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
						{webhookUrl}
					</span>
				</div>
			)}

			<div className='flex items-center justify-between'>
				<button
					type='button'
					onClick={(event) => {
						stop(event);
						setEventsOpen((open) => !open);
					}}
					className='flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ChevronRight
						size={11}
						className={`transition-transform ${eventsOpen ? 'rotate-90' : ''}`}
					/>
					Recent events
				</button>
				<button
					type='button'
					title='Fire this trigger now, as if an event had arrived'
					disabled={runTrigger.isPending}
					onClick={(event) => {
						stop(event);
						handleRun();
					}}
					className='flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 transition hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-primary-400'>
					<Play size={9} />
					{runTrigger.isPending ? 'Queuing…' : 'Run now'}
				</button>
			</div>

			{eventsOpen && (
				<div className='flex flex-col gap-1'>
					{events.isLoading && (
						<span className='text-[9px] text-zinc-400'>Loading events…</span>
					)}
					{events.isError && (
						<span className='text-[9px] text-rose-500'>Couldn’t load events.</span>
					)}
					{events.data && events.data.length === 0 && (
						<span className='text-[9px] text-zinc-400'>No events received yet.</span>
					)}
					{events.data?.slice(0, EVENTS_SHOWN).map((event) => (
						<div
							key={event.id}
							title={event.error ?? undefined}
							className='flex items-center gap-1.5 rounded-md bg-white/70 px-1.5 py-1 text-[9px] dark:bg-zinc-900/70'>
							<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[event.status]}`} />
							<span className='font-semibold text-zinc-700 capitalize dark:text-zinc-300'>
								{event.status}
							</span>
							<span className='text-zinc-400'>· {event.source}</span>
							<span className='ml-auto shrink-0 text-zinc-400'>
								{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
							</span>
							{event.run_id && (
								<Link
									to={paths.trail(workspaceId, event.run_id)}
									title='Open this run in Trail'
									onClick={stop}
									className='shrink-0 text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400'>
									<ExternalLink size={9} />
								</Link>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default TriggerDetails;
