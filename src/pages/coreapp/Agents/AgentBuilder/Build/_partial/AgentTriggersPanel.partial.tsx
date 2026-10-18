import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Copy, MoreHorizontal, Pencil, Play, Plus, Trash2, Zap } from 'lucide-react';
import { notify } from '@/api/core';
import {
	useAgentTriggers,
	useDeleteAgentTrigger,
	useFireAgentTrigger,
	useUpdateAgentTrigger,
} from '@/api/modules/agents';
import { useNodeCategories } from '@/api/modules/catalog';
import { useConfirm } from '@/context/confirm';
import type { TTrigger } from '@/types/trigger.type';
import { mapApiNodeToDefinition } from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/apiNodeCatalog.helper';
import {
	copyWithNotice,
	webhookUrlFor,
} from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';
import type { TNodeDefinition } from '@/pages/coreapp/Playbooks/WorkflowEditor/_types/node.type';
import {
	appEventFor,
	isTripped,
	triggerSummary,
	triggerTitle,
} from '../_helper/agentTriggers.helper';
import AgentTriggerDrawer, {
	KindIcon,
	type TTriggerDrawerTarget,
} from './AgentTriggerDrawer.partial';

/** App readers that can start a run ("Gmail: New email"), from the node catalog. */
const useAppEvents = () => {
	const { data, isLoading } = useNodeCategories(true);
	const events = useMemo(() => {
		const byType = new Map<string, TNodeDefinition>();
		for (const category of data ?? [])
			for (const node of category.nodes ?? [])
				if (node.trigger_mode && !byType.has(node.type))
					byType.set(node.type, mapApiNodeToDefinition(node));
		return [...byType.values()];
	}, [data]);
	return { events, isLoading };
};

const QUICK_STARTS: { label: string; target: TTriggerDrawerTarget; appType?: string }[] = [
	{ label: 'On a schedule', target: { mode: 'create', kind: 'schedule' } },
	{ label: 'From a webhook', target: { mode: 'create', kind: 'webhook' } },
	{
		label: 'When an email arrives',
		target: { mode: 'create', kind: 'app', appType: 'gmail_list_messages' },
		appType: 'gmail_list_messages',
	},
];

const TriggerCard = ({
	ws,
	agentId,
	trigger,
	appEvents,
	onEdit,
}: {
	ws: string;
	agentId: string;
	trigger: TTrigger;
	appEvents: TNodeDefinition[];
	onEdit: () => void;
}) => {
	const { confirm } = useConfirm();
	const updateTrigger = useUpdateAgentTrigger(ws, agentId);
	const deleteTrigger = useDeleteAgentTrigger(ws, agentId);
	const fireTrigger = useFireAgentTrigger(ws, agentId);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onPointerDown = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		document.addEventListener('mousedown', onPointerDown);
		return () => document.removeEventListener('mousedown', onPointerDown);
	}, [menuOpen]);

	const event = appEventFor(trigger, appEvents);
	const kind =
		trigger.type === 'polling' ? 'app' : trigger.type === 'webhook' ? 'webhook' : 'schedule';
	const tripped = isTripped(trigger);
	const stats = trigger.stats_24h;
	const message = typeof trigger.config?.message === 'string' ? trigger.config.message : '';

	// Failures already raise the mutation's error toast.
	const toggle = () =>
		void updateTrigger
			.mutateAsync({ triggerId: trigger.id, body: { is_active: !trigger.is_active } })
			.then(() => notify.success(trigger.is_active ? 'Trigger paused.' : 'Trigger is on.'))
			.catch(() => {});

	const runNow = () => {
		setMenuOpen(false);
		void fireTrigger
			.mutateAsync({ triggerId: trigger.id })
			.then(() => notify.success('Run started. It shows up in Events.'))
			.catch(() => {});
	};

	const remove = async () => {
		setMenuOpen(false);
		const ok = await confirm({
			title: 'Delete trigger',
			message: `“${triggerTitle(trigger, appEvents)}” stops starting this agent. Runs it already started are kept.`,
			confirmText: 'Delete trigger',
		});
		if (ok)
			deleteTrigger.mutate(trigger.id, {
				onSuccess: () => notify.success('Trigger deleted.'),
			});
	};

	const menuItem =
		'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold transition';

	return (
		<div
			className={`group relative rounded-xl border bg-white transition hover:shadow-sm dark:bg-zinc-900/40 ${
				tripped
					? 'border-rose-200 dark:border-rose-500/30'
					: 'hover:border-primary-400/50 border-zinc-200 dark:border-zinc-800'
			}`}>
			<div className='flex items-start gap-3 p-3'>
				<button
					type='button'
					onClick={onEdit}
					aria-label={`Edit ${triggerTitle(trigger, appEvents)}`}
					className={trigger.is_active ? '' : 'opacity-50 grayscale'}>
					<KindIcon kind={kind} event={event} size='sm' />
				</button>
				<button type='button' onClick={onEdit} className='min-w-0 flex-1 text-left'>
					<span className='flex items-center gap-1.5'>
						<span className='truncate text-xs font-black text-zinc-900 dark:text-white'>
							{triggerTitle(trigger, appEvents)}
						</span>
						{!trigger.is_active && !tripped && (
							<span className='shrink-0 rounded-full bg-zinc-100 px-1.5 py-px text-[9px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
								Paused
							</span>
						)}
					</span>
					<span className='mt-0.5 block truncate text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
						{triggerSummary(trigger, appEvents)}
					</span>
					{message && (
						<span className='mt-1 line-clamp-1 text-[10px] font-medium text-zinc-400 italic dark:text-zinc-500'>
							“{message}”
						</span>
					)}
				</button>

				<div className='flex shrink-0 items-center gap-1'>
					<button
						type='button'
						role='switch'
						aria-checked={trigger.is_active}
						aria-label={trigger.is_active ? 'Pause trigger' : 'Turn trigger on'}
						disabled={updateTrigger.isPending}
						onClick={toggle}
						className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-60 ${
							trigger.is_active ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
						}`}>
						<span
							className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
								trigger.is_active ? 'translate-x-4' : 'translate-x-0'
							}`}
						/>
					</button>
					<div ref={menuRef} className='relative'>
						<button
							type='button'
							aria-label='Trigger actions'
							aria-haspopup='menu'
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
							className='flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 md:h-7 md:w-7 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
							<MoreHorizontal size={15} />
						</button>
						{menuOpen && (
							<div
								role='menu'
								className='absolute top-8 right-0 z-30 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-zinc-950'>
								<button
									role='menuitem'
									type='button'
									disabled={fireTrigger.isPending}
									onClick={runNow}
									className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
									<Play size={12} /> Run now
								</button>
								<button
									role='menuitem'
									type='button'
									onClick={() => {
										setMenuOpen(false);
										onEdit();
									}}
									className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
									<Pencil size={12} /> Edit
								</button>
								{trigger.token && (
									<button
										role='menuitem'
										type='button'
										onClick={() => {
											setMenuOpen(false);
											void copyWithNotice(
												webhookUrlFor(trigger.token ?? ''),
												'Webhook URL',
											);
										}}
										className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
										<Copy size={12} /> Copy webhook URL
									</button>
								)}
								<button
									role='menuitem'
									type='button'
									onClick={() => void remove()}
									className={`${menuItem} text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10`}>
									<Trash2 size={12} /> Delete
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{trigger.token && (
				<button
					type='button'
					title='Copy webhook URL'
					onClick={() =>
						void copyWithNotice(webhookUrlFor(trigger.token ?? ''), 'Webhook URL')
					}
					className='hover:border-primary-400/60 mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-left transition dark:border-zinc-800 dark:bg-zinc-950/40'>
					<span className='shrink-0 rounded bg-violet-500/10 px-1 py-px font-mono text-[9px] font-black text-violet-600 dark:text-violet-400'>
						POST
					</span>
					<span className='min-w-0 flex-1 truncate font-mono text-[10px] font-semibold text-zinc-600 dark:text-zinc-300'>
						{webhookUrlFor(trigger.token)}
					</span>
					<Copy size={11} className='shrink-0 text-zinc-400' />
				</button>
			)}

			{tripped && (
				<div className='mx-3 mb-3 flex items-start gap-2 rounded-lg bg-rose-50 px-2.5 py-2 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'>
					<AlertTriangle size={12} className='mt-px shrink-0' />
					<span>
						Switched off after {trigger.consecutive_failure_count} failures in a row.
						Check its recent events, then turn it back on.
					</span>
				</div>
			)}

			<div className='flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 px-3 py-2 text-[10px] font-semibold text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'>
				{trigger.is_active && trigger.next_run_at ? (
					<span>
						Next{' '}
						{formatDistanceToNow(new Date(trigger.next_run_at), { addSuffix: true })}
					</span>
				) : trigger.last_run_at ? (
					<span>
						Last{' '}
						{formatDistanceToNow(new Date(trigger.last_run_at), { addSuffix: true })}
					</span>
				) : (
					<span>Hasn’t run yet</span>
				)}
				{stats &&
					(stats.fired > 0 ||
						stats.failed > 0 ||
						stats.rejected > 0 ||
						stats.skipped > 0) && (
						<button
							type='button'
							onClick={onEdit}
							title='Last 24 hours. Open to see each event.'
							className='hover:text-zinc-600 dark:hover:text-zinc-300'>
							24h: {stats.fired} run{stats.fired === 1 ? '' : 's'}
							{stats.failed > 0 && (
								<span className='text-rose-500'> · {stats.failed} failed</span>
							)}
							{stats.rejected > 0 && (
								<span className='text-rose-500'> · {stats.rejected} rejected</span>
							)}
							{stats.skipped > 0 && <span> · {stats.skipped} skipped</span>}
						</button>
					)}
			</div>
		</div>
	);
};

type TProps = {
	ws: string;
	agentId?: string;
	/** Open the drawer at this target; the agent is saved first when it's new. */
	drawerTarget: TTriggerDrawerTarget | null;
	onOpenDrawer: (target: TTriggerDrawerTarget) => void;
	onCloseDrawer: () => void;
};

const AgentTriggersPanel = ({ ws, agentId, drawerTarget, onOpenDrawer, onCloseDrawer }: TProps) => {
	const { data: triggers, isLoading } = useAgentTriggers(ws, agentId ?? '');
	const { events: appEvents, isLoading: isLoadingApps } = useAppEvents();
	const list = useMemo(() => triggers ?? [], [triggers]);

	// The drawer edits the trigger as it is now: a secret saved or a token
	// rotated in it refetches the list, and this keeps the drawer in step.
	const liveTarget = useMemo<TTriggerDrawerTarget | null>(() => {
		if (drawerTarget?.mode !== 'edit') return drawerTarget;
		const latest = list.find((trigger) => trigger.id === drawerTarget.trigger.id);
		return latest ? { mode: 'edit', trigger: latest } : drawerTarget;
	}, [drawerTarget, list]);

	const quickStarts = QUICK_STARTS.filter(
		(item) => !item.appType || appEvents.some((event) => event.key === item.appType),
	);

	return (
		<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
						<Zap size={14} fill='currentColor' />
					</div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Triggers</h4>
					{list.length > 0 && (
						<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400'>
							{list.filter((trigger) => trigger.is_active).length} on
						</span>
					)}
				</div>
				<button
					type='button'
					onClick={() => onOpenDrawer({ mode: 'pick' })}
					className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex min-h-11 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 md:min-h-0 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Trigger</span>
				</button>
			</div>

			{isLoading && agentId ? (
				<div className='h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60' />
			) : list.length === 0 ? (
				<div className='rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-800'>
					<p className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
						Run this agent on its own: on a schedule, from another app, or when
						something new shows up in a connected account.
					</p>
					<div className='mt-2.5 flex flex-wrap gap-1.5'>
						{quickStarts.map((item) => (
							<button
								key={item.label}
								type='button'
								onClick={() => onOpenDrawer(item.target)}
								className='hover:border-primary-400/60 hover:text-primary-700 dark:hover:text-primary-300 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
								{item.label}
							</button>
						))}
					</div>
				</div>
			) : (
				<div className='space-y-2'>
					{list.map((trigger) => (
						<TriggerCard
							key={trigger.id}
							ws={ws}
							agentId={agentId ?? ''}
							trigger={trigger}
							appEvents={appEvents}
							onEdit={() => onOpenDrawer({ mode: 'edit', trigger })}
						/>
					))}
				</div>
			)}

			<AgentTriggerDrawer
				ws={ws}
				agentId={agentId ?? ''}
				target={liveTarget}
				appEvents={appEvents}
				isLoadingApps={isLoadingApps}
				onNavigate={onOpenDrawer}
				onClose={onCloseDrawer}
			/>
		</div>
	);
};

export default AgentTriggersPanel;
