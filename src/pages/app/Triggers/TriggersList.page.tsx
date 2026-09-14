import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, KeyRound, Play, Plus, Search, Settings2, Trash2, Zap } from 'lucide-react';
import { OutletContextType } from './_layouts/Triggers.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirmContext';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import {
	useTriggers,
	useCreateTrigger,
	useUpdateTrigger,
	useDeleteTrigger,
	useRunTrigger,
	useRotateTriggerToken,
} from '@/api/modules/triggers';
import { useWorkflows } from '@/api/modules/workflows';
import { useAgents } from '@/api/modules/agents';
import type { TTrigger } from '@/types/trigger.type';
import { MECHANISM_META, formatDateTime, usesToken } from './_helper/triggers.constants';
import TriggerFormModal, { type ITriggerFormValues } from './_partial/TriggerFormModal.partial';
import TriggerEventsModal from './_partial/TriggerEventsModal.partial';

// ============================================================
// Triggers
// ------------------------------------------------------------
// What starts a workflow or an agent: a schedule, an inbound
// webhook, a poll, an internal event, or a person. Backed by
// `workspaces/{ws}/triggers` — full CRUD plus run-now, token
// rotation, and a per-trigger delivery log.
// ============================================================

const TriggersListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.triggers }]} />);
		return () => setHeaderLeft('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const ws = activeWorkspaceId || fallbackWorkspaceId;

	const { data: triggers, isLoading } = useTriggers(ws);
	const { data: workflows } = useWorkflows(ws);
	const { data: agents } = useAgents(ws);

	const createTrigger = useCreateTrigger(ws);
	const updateTrigger = useUpdateTrigger(ws);
	const deleteTrigger = useDeleteTrigger(ws);
	const runTrigger = useRunTrigger(ws);
	const rotateToken = useRotateTriggerToken(ws);

	const [searchQuery, setSearchQuery] = useState('');
	const [formTarget, setFormTarget] = useState<TTrigger | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [eventsTriggerId, setEventsTriggerId] = useState<string | null>(null);

	// A trigger stores only target_type/target_id, so names come from the
	// workflow and agent lists the page already has.
	const targetName = useMemo(() => {
		const wf = new Map((workflows ?? []).map((w) => [w.id, w.name]));
		const ag = new Map((agents ?? []).map((a) => [a.id, a.name]));
		return (trigger: TTrigger) =>
			(trigger.target_type === 'workflow' ? wf.get(trigger.target_id) : ag.get(trigger.target_id)) ??
			`${trigger.target_type} #${trigger.target_id}`;
	}, [workflows, agents]);

	const triggerList = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return (triggers ?? []).filter((trigger) => {
			if (!query) return true;
			return (
				targetName(trigger).toLowerCase().includes(query) ||
				trigger.type.toLowerCase().includes(query)
			);
		});
	}, [triggers, searchQuery, targetName]);

	const activeCount = (triggers ?? []).filter((t) => t.is_active).length;
	const failingCount = (triggers ?? []).filter((t) => t.consecutive_failure_count > 0).length;

	const openCreate = () => {
		setFormTarget(null);
		setIsFormOpen(true);
	};

	const openEdit = (trigger: TTrigger) => {
		setFormTarget(trigger);
		setIsFormOpen(true);
	};

	const handleSubmit = async (values: ITriggerFormValues) => {
		try {
			if (formTarget) {
				// Update only accepts config + is_active.
				await updateTrigger.mutateAsync({
					id: formTarget.id,
					body: { config: values.config, is_active: values.is_active },
				});
				notify.success('Trigger updated.');
			} else {
				await createTrigger.mutateAsync({
					target_type: values.target_type,
					target_id: values.target_id,
					type: values.type,
					preset_id: values.preset_id,
					config: values.config,
					is_active: values.is_active,
				});
				notify.success('Trigger created.');
			}
			setIsFormOpen(false);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleToggleActive = async (trigger: TTrigger) => {
		await updateTrigger.mutateAsync({
			id: trigger.id,
			body: { is_active: !trigger.is_active },
		});
	};

	const handleRun = async (trigger: TTrigger) => {
		await runTrigger.mutateAsync(trigger.id);
		notify.success(`Fired "${targetName(trigger)}".`);
	};

	const handleRotate = async (trigger: TTrigger) => {
		const confirmed = await confirm({
			title: 'Rotate webhook token',
			confirmText: 'Rotate',
			message:
				'The current URL stops working immediately. Anything calling it has to be updated with the new one.',
		});
		if (!confirmed) return;
		await rotateToken.mutateAsync(trigger.id);
		notify.success('Token rotated.');
	};

	const handleCopyToken = async (token: string) => {
		await navigator.clipboard.writeText(`${window.location.origin}/api/hooks/${token}`);
		notify.success('Webhook URL copied.');
	};

	const handleDelete = async (trigger: TTrigger) => {
		const confirmed = await confirm({
			title: 'Delete Trigger',
			message: (
				<>
					Delete the {MECHANISM_META[trigger.type].label.toLowerCase()} trigger on{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{targetName(trigger)}&quot;
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		await deleteTrigger.mutateAsync(trigger.id);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			<div className='mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 md:p-10'>
				{/* Header */}
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div>
						<h1 className='text-2xl font-black tracking-tight text-slate-950 dark:text-white'>
							Triggers
						</h1>
						<p className='mt-1 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Decide what starts your workflows and agents, and when.
						</p>
					</div>
					<button
						type='button'
						onClick={openCreate}
						className='flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-primary-400 px-5 text-xs font-black text-primary-950 shadow-md shadow-primary-500/10 transition-all hover:bg-primary-500 active:scale-95'>
						<Plus size={14} />
						New Trigger
					</button>
				</div>

				{/* Stats */}
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					{[
						{ label: 'Total', value: triggers?.length ?? 0, sub: 'Configured triggers' },
						{ label: 'Active', value: activeCount, sub: 'Listening now' },
						{ label: 'Failing', value: failingCount, sub: 'Need attention' },
					].map((stat) => (
						<div
							key={stat.label}
							className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
									<Zap size={16} />
								</div>
								<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									{stat.label}
								</span>
							</div>
							<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
								{stat.value}
							</div>
							<div className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
								{stat.sub}
							</div>
						</div>
					))}
				</div>

				{/* Search */}
				<div className='relative'>
					<Search
						size={15}
						className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'
					/>
					<input
						type='search'
						placeholder='Search triggers by target or type…'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-4 pl-11 text-sm font-semibold text-slate-900 outline-none focus:border-primary-400 dark:text-zinc-100'
					/>
				</div>

				{/* List */}
				{isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-border-main bg-bg-card py-16 text-xs font-semibold text-slate-400'>
						Loading triggers…
					</div>
				) : triggerList.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-border-main bg-bg-card py-16 text-center'>
						<Zap size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
							No triggers yet
						</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Add one to run a workflow on a schedule or from a webhook.
						</p>
					</div>
				) : (
					<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
						<AnimatePresence mode='popLayout'>
							{triggerList.map((trigger) => {
								const meta = MECHANISM_META[trigger.type];
								const MechanismIcon = meta.icon;
								return (
									<motion.article
										key={trigger.id}
										layout
										initial={{ opacity: 0, scale: 0.96, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96, y: 10 }}
										className='flex flex-col justify-between rounded-3xl border border-border-main bg-bg-card p-6 shadow-xs'>
										<div>
											<div className='flex items-start justify-between gap-4'>
												<div
													className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md'
													style={{ backgroundColor: meta.color }}>
													<MechanismIcon size={18} />
												</div>

												<button
													type='button'
													onClick={() => handleToggleActive(trigger)}
													aria-label={
														trigger.is_active
															? 'Pause trigger'
															: 'Activate trigger'
													}
													className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
														trigger.is_active
															? 'bg-primary-400'
															: 'bg-slate-200 dark:bg-zinc-800'
													}`}>
													<div
														className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
															trigger.is_active
																? 'translate-x-4'
																: 'translate-x-0'
														}`}
													/>
												</button>
											</div>

											<h2 className='text-md mt-5 font-bold tracking-tight text-slate-900 dark:text-white'>
												{targetName(trigger)}
											</h2>
											<p className='mt-1 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
												{meta.label} · {trigger.target_type}
											</p>

											<div className='mt-4 flex flex-wrap gap-2'>
												<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
													Last run {formatDateTime(trigger.last_run_at)}
												</span>
												{trigger.consecutive_failure_count > 0 && (
													<span className='inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20'>
														{trigger.consecutive_failure_count} failures
													</span>
												)}
											</div>

											{usesToken(trigger.type) && trigger.token && (
												<div className='mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40'>
													<span className='min-w-0 flex-1 truncate font-mono text-[10px] font-bold text-slate-500 dark:text-zinc-400'>
														/api/hooks/{trigger.token}
													</span>
													<button
														type='button'
														title='Copy webhook URL'
														onClick={() =>
															handleCopyToken(trigger.token!)
														}
														className='shrink-0 text-slate-400 transition hover:text-slate-700 dark:hover:text-zinc-200'>
														<Copy size={12} />
													</button>
													<button
														type='button'
														title='Rotate token'
														onClick={() => handleRotate(trigger)}
														className='shrink-0 text-slate-400 transition hover:text-amber-600'>
														<KeyRound size={12} />
													</button>
												</div>
											)}
										</div>

										<div className='my-4 border-t border-slate-100 dark:border-zinc-800/60' />

										<div className='flex items-center justify-between gap-3'>
											<button
												type='button'
												onClick={() => setEventsTriggerId(trigger.id)}
												className='flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border-main bg-bg-card px-3.5 text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-50 dark:text-zinc-300'>
												Delivery log
											</button>

											<div className='flex items-center gap-2'>
												<button
													type='button'
													title='Run now'
													onClick={() => handleRun(trigger)}
													disabled={runTrigger.isPending}
													className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50'>
													<Play size={12} className='fill-current' />
												</button>
												<button
													type='button'
													title='Edit trigger'
													onClick={() => openEdit(trigger)}
													className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 dark:border-zinc-800'>
													<Settings2 size={12} />
												</button>
												<button
													type='button'
													title='Delete trigger'
													onClick={() => handleDelete(trigger)}
													className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-zinc-800'>
													<Trash2 size={12} />
												</button>
											</div>
										</div>
									</motion.article>
								);
							})}
						</AnimatePresence>
					</div>
				)}
			</div>

			<TriggerFormModal
				ws={ws}
				open={isFormOpen}
				target={formTarget}
				isPending={createTrigger.isPending || updateTrigger.isPending}
				onClose={() => setIsFormOpen(false)}
				onSubmit={handleSubmit}
			/>
			<TriggerEventsModal
				ws={ws}
				triggerId={eventsTriggerId}
				onClose={() => setEventsTriggerId(null)}
			/>
		</Container>
	);
};

export default TriggersListPage;
