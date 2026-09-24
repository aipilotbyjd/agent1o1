import { useState } from 'react';
import {
	Sparkles,
	SquarePen,
	Wrench,
	Lightbulb,
	CheckCircle2,
	XCircle,
	Clock,
	Loader2,
	ChevronDown,
	ChevronRight,
	Play,
	Settings2,
	MinusCircle,
} from 'lucide-react';
import {
	useAgentReflectionSettings,
	useUpdateAgentReflectionSettings,
	useAgentReflectionRuns,
	useCreateAgentReflectionRun,
	useAgentReflections,
	useApplyAgentReflection,
	useDismissAgentReflection,
} from '@/api/modules/agents';
import type {
	TReflection,
	TReflectionRun,
	TReflectionSettings,
	TReflectionStatus,
	TReflectionType,
	TReflectionApplyBehavior,
} from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
	displayMode?: 'panel' | 'page';
};

const TYPE_STYLE: Record<TReflectionType, { icon: typeof SquarePen; label: string }> = {
	prompt_change: { icon: SquarePen, label: 'Prompt change' },
	new_skill: { icon: Wrench, label: 'New skill' },
	insight: { icon: Lightbulb, label: 'Insight' },
};

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
	pending: { icon: Clock, className: 'text-amber-500' },
	applied: { icon: CheckCircle2, className: 'text-emerald-500' },
	dismissed: { icon: MinusCircle, className: 'text-zinc-400' },
};

const RUN_STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
	completed: { icon: CheckCircle2, className: 'text-emerald-500' },
	failed: { icon: XCircle, className: 'text-rose-500' },
	running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
	pending: { icon: Clock, className: 'text-amber-500' },
	skipped: { icon: MinusCircle, className: 'text-zinc-400' },
};

const fmtDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '-');

/** Toggle row — same switch markup the Settings tab uses in Build.page. */
const ToggleRow = ({
	label,
	hint,
	value,
	onChange,
}: {
	label: string;
	hint?: string;
	value: boolean;
	onChange: (next: boolean) => void;
}) => (
	<div className='flex items-center justify-between gap-3'>
		<div className='flex min-w-0 flex-col'>
			<span className='text-[11px] font-black text-zinc-800 dark:text-zinc-200'>{label}</span>
			{hint && (
				<span className='mt-0.5 text-[10px] leading-normal font-semibold text-zinc-400 dark:text-zinc-400'>
					{hint}
				</span>
			)}
		</div>
		<button
			type='button'
			role='switch'
			aria-checked={value}
			aria-label={label}
			onClick={() => onChange(!value)}
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
				value ? 'bg-primary-400 dark:bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
			}`}>
			<span
				className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
					value ? 'translate-x-4' : 'translate-x-0'
				}`}
			/>
		</button>
	</div>
);

/** Schedule + behaviour for the periodic self-review. Mounted keyed on the
 *  loaded record so its fields seed from the server without an effect. */
const ReflectionSettingsForm = ({
	ws,
	agentId,
	settings,
}: {
	ws: string;
	agentId: string;
	settings: TReflectionSettings;
}) => {
	const updateMutation = useUpdateAgentReflectionSettings(ws, agentId);
	const [form, setForm] = useState({
		is_enabled: settings.is_enabled,
		apply_behavior: settings.apply_behavior,
		schedule_cron: settings.schedule_cron ?? '',
		min_chats_threshold: settings.min_chats_threshold ?? 0,
		extra_instructions: settings.extra_instructions ?? '',
		notify_on_skip: settings.notify_on_skip,
	});

	const patch = (next: Partial<typeof form>) => {
		setForm((f) => ({ ...f, ...next }));
		return next;
	};

	return (
		<div className='space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<ToggleRow
				label='Enable reflections'
				hint='Let the agent review past chats and propose improvements.'
				value={form.is_enabled}
				onChange={(next) => updateMutation.mutate(patch({ is_enabled: next }))}
			/>

			{/* Apply behaviour */}
			<div>
				<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
					Apply behaviour
				</span>
				<div className='mt-1.5 flex gap-1.5'>
					{(['manual', 'automatic'] as TReflectionApplyBehavior[]).map((behavior) => (
						<button
							key={behavior}
							type='button'
							onClick={() =>
								updateMutation.mutate(patch({ apply_behavior: behavior }))
							}
							className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
								form.apply_behavior === behavior
									? 'bg-primary-400 text-primary-950'
									: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
							}`}>
							{behavior}
						</button>
					))}
				</div>
			</div>

			{/* Schedule + threshold */}
			<div className='grid grid-cols-2 gap-2'>
				<div>
					<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
						Schedule (cron)
					</span>
					<input
						type='text'
						value={form.schedule_cron}
						onChange={(e) => setForm((f) => ({ ...f, schedule_cron: e.target.value }))}
						placeholder='0 3 * * *'
						className='focus:border-primary-500/50 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
				</div>
				<div>
					<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
						Min chats
					</span>
					<input
						type='number'
						min={0}
						value={form.min_chats_threshold}
						onChange={(e) =>
							setForm((f) => ({ ...f, min_chats_threshold: Number(e.target.value) }))
						}
						className='focus:border-primary-500/50 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
				</div>
			</div>

			<div>
				<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
					Extra instructions
				</span>
				<textarea
					value={form.extra_instructions}
					onChange={(e) => setForm((f) => ({ ...f, extra_instructions: e.target.value }))}
					placeholder='What the reviewer should pay attention to (optional)'
					rows={2}
					className='focus:border-primary-500/50 mt-1 w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
				/>
			</div>

			<ToggleRow
				label='Notify on skip'
				hint='Tell me when a run is skipped for too few chats.'
				value={form.notify_on_skip}
				onChange={(next) => updateMutation.mutate(patch({ notify_on_skip: next }))}
			/>

			<div className='flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800'>
				<div className='min-w-0 text-[9px] font-semibold text-zinc-400'>
					<span className='block truncate'>
						Last run: {fmtDate(settings.last_run_at)}
					</span>
					<span className='block truncate'>
						Next run: {fmtDate(settings.next_run_at)}
					</span>
				</div>
				<button
					onClick={() =>
						updateMutation.mutate({
							schedule_cron: form.schedule_cron.trim(),
							min_chats_threshold: form.min_chats_threshold,
							extra_instructions: form.extra_instructions.trim() || null,
						})
					}
					disabled={updateMutation.isPending}
					className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex shrink-0 items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black disabled:opacity-50'>
					{updateMutation.isPending && <Loader2 size={11} className='animate-spin' />}
					Save
				</button>
			</div>
		</div>
	);
};

/** One proposed improvement, with apply/dismiss while it is still pending. */
const ReflectionCard = ({
	ws,
	agentId,
	reflection,
}: {
	ws: string;
	agentId: string;
	reflection: TReflection;
}) => {
	const applyMutation = useApplyAgentReflection(ws, agentId);
	const dismissMutation = useDismissAgentReflection(ws, agentId);

	const type = TYPE_STYLE[reflection.type] ?? TYPE_STYLE.insight;
	const TypeIcon = type.icon;
	const status = STATUS_STYLE[reflection.status] ?? STATUS_STYLE.pending;
	const StatusIcon = status.icon;
	const confidencePct = Math.round((reflection.confidence ?? 0) * 100);

	return (
		<div className='space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<div className='flex items-start gap-3'>
				<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg'>
					<TypeIcon size={13} />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<span className='truncate text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
							{reflection.title}
						</span>
						<StatusIcon size={11} className={`shrink-0 ${status.className}`} />
					</div>
					<div className='mt-0.5 flex flex-wrap items-center gap-1'>
						<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black text-zinc-500 uppercase dark:bg-zinc-800'>
							{type.label}
						</span>
						<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black text-zinc-500 uppercase dark:bg-zinc-800'>
							{confidencePct}% confident
						</span>
						<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black text-zinc-500 uppercase dark:bg-zinc-800'>
							{reflection.support_count} chats
						</span>
					</div>
					<p className='mt-1 line-clamp-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
						{reflection.rationale}
					</p>
				</div>
			</div>

			{reflection.proposed_prompt && (
				<div className='rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
					<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
						Proposed prompt
					</span>
					<p className='mt-0.5 line-clamp-4 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300'>
						{reflection.proposed_prompt}
					</p>
				</div>
			)}

			{reflection.status === 'pending' && (
				<div className='flex justify-end gap-2'>
					<button
						onClick={() => dismissMutation.mutate(reflection.id)}
						disabled={dismissMutation.isPending}
						className='rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
						Dismiss
					</button>
					<button
						onClick={() => applyMutation.mutate(reflection.id)}
						disabled={applyMutation.isPending}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black disabled:opacity-50'>
						{applyMutation.isPending && <Loader2 size={11} className='animate-spin' />}
						Apply
					</button>
				</div>
			)}
		</div>
	);
};

/** Expandable row: reflection run summary + what it produced. */
const ReflectionRunRow = ({ run }: { run: TReflectionRun }) => {
	const [open, setOpen] = useState(false);
	const style = RUN_STATUS_STYLE[run.status] ?? RUN_STATUS_STYLE.pending;
	const Icon = style.icon;

	return (
		<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<button
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center gap-3 p-3 text-left'>
				{open ? (
					<ChevronDown size={13} className='shrink-0 text-zinc-400' />
				) : (
					<ChevronRight size={13} className='shrink-0 text-zinc-400' />
				)}
				<Icon size={14} className={`shrink-0 ${style.className}`} />
				<div className='min-w-0 flex-1'>
					<span className='truncate text-[11px] font-black text-zinc-800 capitalize dark:text-zinc-200'>
						{run.status}
					</span>
					<span className='block text-[9px] font-semibold text-zinc-400 dark:text-zinc-600'>
						{new Date(run.created_at).toLocaleString()}
					</span>
				</div>
				<div className='flex shrink-0 flex-col items-end'>
					<span className='text-[10px] font-black text-zinc-600 dark:text-zinc-300'>
						{run.reflections_count ?? run.reflections?.length ?? 0} found
					</span>
					<span className='text-[9px] font-semibold text-zinc-400'>
						{run.sessions_analyzed_count} chats
					</span>
				</div>
			</button>

			{open && (
				<div className='space-y-2 border-t border-zinc-100 p-3 dark:border-zinc-800'>
					{run.skip_reason && (
						<p className='rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400'>
							{run.skip_reason}
						</p>
					)}
					<div className='grid grid-cols-2 gap-2'>
						<div className='rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
							<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
								Started
							</span>
							<p className='mt-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300'>
								{fmtDate(run.started_at)}
							</p>
						</div>
						<div className='rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
							<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
								Finished
							</span>
							<p className='mt-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300'>
								{fmtDate(run.finished_at)}
							</p>
						</div>
					</div>
					{(run.reflections ?? []).length > 0 && (
						<div className='space-y-1.5'>
							{(run.reflections ?? []).map((reflection) => (
								<div
									key={reflection.id}
									className='flex items-center gap-2 rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
									<Sparkles size={11} className='text-primary-500 shrink-0' />
									<span className='min-w-0 flex-1 truncate text-[10px] font-black text-zinc-700 dark:text-zinc-300'>
										{reflection.title}
									</span>
									<span className='shrink-0 text-[9px] font-bold text-zinc-400 capitalize'>
										{reflection.status}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

/**
 * Reflections for an agent — a periodic self-review of past chats that proposes
 * prompt changes, new skills, and insights for review.
 * Backed by {agent}/reflections — see AgentReflectionController.
 */
const AgentReflectionsPanel = ({ ws, agentId, displayMode = 'panel' }: TProps) => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<TReflectionStatus | undefined>(undefined);

	const { data: settings } = useAgentReflectionSettings(ws, agentId ?? '');
	const { data: reflections, isLoading } = useAgentReflections(
		ws,
		agentId ?? '',
		statusFilter ? { status: statusFilter } : undefined,
	);
	const { data: runs, isLoading: isRunsLoading } = useAgentReflectionRuns(ws, agentId ?? '');
	const runMutation = useCreateAgentReflectionRun(ws, agentId ?? '');

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to see reflections.
			</p>
		);
	}

	const items = reflections ?? [];

	return (
		<div className={displayMode === 'page' ? 'space-y-5' : 'space-y-3'}>
			{/* Header */}
			<div className='flex items-center justify-between gap-2'>
				<div className='min-w-0'>
					<h4
						className={`${displayMode === 'page' ? 'text-lg' : 'text-xs'} font-black text-zinc-900 dark:text-white`}>
						Reflections
					</h4>
					<p
						className={`${displayMode === 'page' ? 'text-sm' : 'text-[10px]'} font-semibold text-zinc-400 dark:text-zinc-500`}>
						Periodic self-review of past chats.
					</p>
				</div>
				<div className='flex shrink-0 items-center gap-1.5'>
					<button
						onClick={() => setIsSettingsOpen((v) => !v)}
						title='Reflection settings'
						className={`rounded-lg border px-2 py-1 transition ${
							isSettingsOpen
								? 'border-primary-500/20 bg-primary-400/10 text-primary-600 dark:text-primary-400'
								: 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
						}`}>
						<Settings2 size={12} />
					</button>
					<button
						onClick={() => runMutation.mutate()}
						disabled={runMutation.isPending}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black disabled:opacity-50'>
						{runMutation.isPending ? (
							<Loader2 size={10} className='animate-spin' />
						) : (
							<Play size={10} />
						)}
						<span>Run now</span>
					</button>
				</div>
			</div>

			{/* Settings */}
			{isSettingsOpen &&
				(settings ? (
					<ReflectionSettingsForm
						key={settings.id}
						ws={ws}
						agentId={agentId}
						settings={settings}
					/>
				) : (
					<p className='py-4 text-center text-[11px] font-semibold text-zinc-400'>
						Loading settings…
					</p>
				))}

			{/* Suggestion filter */}
			<div className='no-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-1'>
				{(
					[undefined, 'pending', 'applied', 'dismissed'] as (
						| TReflectionStatus
						| undefined
					)[]
				).map((s) => (
					<button
						key={s ?? 'all'}
						type='button'
						onClick={() => setStatusFilter(s)}
						className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
							statusFilter === s
								? 'bg-primary-400 text-primary-950'
								: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
						}`}>
						{s ?? 'All'}
					</button>
				))}
			</div>

			{/* Suggestions */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No reflections yet.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((reflection) => (
						<ReflectionCard
							key={reflection.id}
							ws={ws}
							agentId={agentId}
							reflection={reflection}
						/>
					))}
				</div>
			)}

			{/* Run history */}
			<div className='pt-1'>
				<span className='text-[9px] font-black tracking-wide text-zinc-400 uppercase'>
					Reflection runs
				</span>
			</div>
			{isRunsLoading ? (
				<p className='py-4 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : (runs ?? []).length === 0 ? (
				<p className='py-4 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No reflection runs yet.
				</p>
			) : (
				<div className='space-y-2'>
					{(runs ?? []).map((run) => (
						<ReflectionRunRow key={run.id} run={run} />
					))}
				</div>
			)}
		</div>
	);
};

export default AgentReflectionsPanel;
