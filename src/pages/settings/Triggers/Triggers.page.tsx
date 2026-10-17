import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import {
	AlertTriangle,
	CalendarClock,
	Copy,
	Hand,
	Play,
	Repeat,
	Terminal,
	Trash2,
	Webhook,
	Zap,
} from 'lucide-react';
import { notify } from '@/api/core';
import {
	useDeleteTrigger,
	useRunTrigger,
	useTriggers,
	useUpdateTrigger,
} from '@/api/modules/triggers';
import { useWorkspaceContext } from '@/context/workspace';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import Spinner from '@/components/ui/Spinner';
import type { TTrigger } from '@/types/trigger.type';
import {
	copyWithNotice,
	webhookCurlFor,
	webhookUrlFor,
} from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';

const TYPE_ICON: Record<string, typeof Webhook> = {
	webhook: Webhook,
	schedule: CalendarClock,
	polling: Repeat,
	manual: Hand,
};

type TFilter = 'all' | 'on' | 'off';

/**
 * Every trigger in the workspace on one page: what's listening, what was
 * switched off and why, and what fired in the last day. A monitor: workflow
 * triggers are configured as nodes on their canvas ("Open workflow"); only
 * ones made outside the canvas ("Legacy") can be deleted here.
 */
const TriggersPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { confirm } = useConfirm();
	const { data: triggers = [], isLoading, isError } = useTriggers(activeWorkspaceId);
	const updateTrigger = useUpdateTrigger(activeWorkspaceId);
	const runTrigger = useRunTrigger(activeWorkspaceId);
	const deleteTrigger = useDeleteTrigger(activeWorkspaceId);
	const [filter, setFilter] = useState<TFilter>('all');

	const counts = useMemo(
		() => ({
			all: triggers.length,
			on: triggers.filter((trigger) => trigger.is_active).length,
			off: triggers.filter((trigger) => !trigger.is_active).length,
		}),
		[triggers],
	);

	const shown = useMemo(
		() =>
			triggers.filter((trigger) =>
				filter === 'all' ? true : filter === 'on' ? trigger.is_active : !trigger.is_active,
			),
		[triggers, filter],
	);

	const handleDelete = async (trigger: TTrigger) => {
		const confirmed = await confirm({
			title: 'Delete trigger',
			confirmText: 'Delete',
			message:
				'It stops firing straight away and its event history is removed. This cannot be undone.',
		});
		if (!confirmed) return;
		deleteTrigger.mutate(trigger.id, { onSuccess: () => notify.success('Trigger deleted') });
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Triggers
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Everything that starts your workflows and agents automatically. Add or change a
					workflow trigger on its canvas, then publish.
				</p>
			</div>

			<div className='mb-5 flex gap-1.5'>
				{(['all', 'on', 'off'] as const).map((key) => (
					<button
						key={key}
						type='button'
						onClick={() => setFilter(key)}
						className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
							filter === key
								? 'border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-600 dark:bg-primary-950/30 dark:text-primary-300'
								: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
						}`}>
						{key === 'all' ? 'All' : key === 'on' ? 'On' : 'Off'} ({counts[key]})
					</button>
				))}
			</div>

			{isLoading ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900'>
					<Spinner color='primary' className='size-8' />
					<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Loading triggers...
					</p>
				</div>
			) : isError ? (
				<div className='rounded-2xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900'>
					Could not load triggers. Please try again after refreshing.
				</div>
			) : shown.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs'>
						<Zap size={22} />
					</div>
					<h3 className='text-lg font-bold text-zinc-900 dark:text-white'>
						{triggers.length === 0 ? 'No triggers yet' : 'Nothing matches this filter'}
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Add a Schedule, Webhook or Polling node to a workflow, or switch on
						&ldquo;Activate as flow trigger&rdquo; on a Gmail, Slack or Sheets step,
						then publish.
					</p>
				</div>
			) : (
				<div className='divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900'>
					{shown.map((trigger) => {
						const Icon = TYPE_ICON[trigger.type] ?? Zap;
						const isWorkflow = trigger.target_type === 'workflow';
						const isLegacy = isWorkflow && !trigger.trigger_node_key;
						const stats = trigger.stats_24h;
						const failures = trigger.consecutive_failure_count ?? 0;
						const appNode =
							typeof trigger.config?.node_type === 'string'
								? trigger.config.node_type.replace(/_/g, ' ')
								: null;

						return (
							<div
								key={trigger.id}
								className='flex flex-wrap items-center gap-4 px-5 py-4'>
								<span className='bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
									<Icon size={16} />
								</span>

								<div className='min-w-0 flex-1'>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='truncate text-sm font-bold text-zinc-900 dark:text-zinc-100'>
											{trigger.target_name ??
												`Deleted ${trigger.target_type}`}
										</span>
										<span className='text-xs font-semibold text-zinc-500 capitalize'>
											{appNode ?? trigger.type}
										</span>
										{isLegacy && (
											<span
												title='Made outside the canvas. Convert it with `php artisan triggers:legacy --convert`, or delete it.'
												className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
												Legacy
											</span>
										)}
										{trigger.target_type === 'agent' && (
											<span className='rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700 uppercase dark:bg-violet-950/40 dark:text-violet-300'>
												Agent
											</span>
										)}
									</div>
									<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
										{trigger.last_run_at
											? `Last fired ${formatDistanceToNow(new Date(trigger.last_run_at), { addSuffix: true })}`
											: 'Never fired'}
										{trigger.is_active && trigger.next_run_at
											? ` · next ${formatDistanceToNow(new Date(trigger.next_run_at), { addSuffix: true })}`
											: ''}
										{stats
											? ` · 24h: ${stats.fired} run${stats.fired === 1 ? '' : 's'}, ${stats.failed} failed, ${stats.skipped} skipped`
											: ''}
									</p>
									{trigger.type === 'webhook' && trigger.token && (
										<div className='mt-2 flex max-w-full items-center gap-1.5'>
											<code className='min-w-0 truncate rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-700 select-all dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
												{webhookUrlFor(trigger.token)}
											</code>
											<button
												type='button'
												title='Copy webhook URL'
												onClick={() =>
													copyWithNotice(
														webhookUrlFor(trigger.token ?? ''),
														'Webhook URL',
													)
												}
												className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]'>
												<Copy size={13} />
											</button>
											<button
												type='button'
												title='Copy a curl example for this webhook'
												onClick={() =>
													copyWithNotice(
														webhookCurlFor(trigger),
														'curl example',
													)
												}
												className='flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]'>
												<Terminal size={12} />
												curl
											</button>
										</div>
									)}
									{!trigger.is_active && failures > 0 && (
										<p className='mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400'>
											<AlertTriangle size={12} />
											Switched off after {failures} failures in a row. Fix the
											cause, then switch it back on.
										</p>
									)}
								</div>

								<div className='flex shrink-0 items-center gap-2'>
									{isWorkflow && (
										<Link
											to={paths.editPlaybook(
												activeWorkspaceId,
												trigger.target_id,
											)}
											className='rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-white/[0.04]'>
											Open workflow
										</Link>
									)}
									<button
										type='button'
										title='Fire it now, as if an event had arrived'
										disabled={!trigger.is_active || runTrigger.isPending}
										onClick={() =>
											runTrigger.mutate(trigger.id, {
												onSuccess: () => notify.success('Run queued'),
											})
										}
										className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06]'>
										<Play size={14} />
									</button>
									{(isLegacy || trigger.target_type === 'agent') && (
										<button
											type='button'
											title='Delete trigger'
											disabled={deleteTrigger.isPending}
											onClick={() => handleDelete(trigger)}
											className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30'>
											<Trash2 size={14} />
										</button>
									)}
									<button
										type='button'
										role='switch'
										aria-checked={trigger.is_active}
										aria-label={
											trigger.is_active
												? 'Switch trigger off'
												: 'Switch trigger on'
										}
										disabled={updateTrigger.isPending}
										onClick={() =>
											updateTrigger.mutate({
												id: trigger.id,
												body: { is_active: !trigger.is_active },
											})
										}
										className={`flex h-5 w-9 items-center rounded-full border p-0.5 transition-all disabled:opacity-50 ${
											trigger.is_active
												? 'border-primary-400 bg-primary-400 justify-end'
												: 'justify-start border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
										}`}>
										<span
											className={`size-3.5 rounded-full shadow-sm ${trigger.is_active ? 'bg-white' : 'bg-zinc-300 dark:bg-zinc-600'}`}
										/>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default TriggersPage;
