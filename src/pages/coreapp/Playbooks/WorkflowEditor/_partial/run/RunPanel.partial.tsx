import { useReactFlow } from '@xyflow/react';
import {
	ArrowUpRight,
	Check,
	ChevronRight,
	CircleAlert,
	Clock3,
	FileText,
	History,
	ListChecks,
	Loader2,
	Play,
	RotateCw,
	Square,
	X,
} from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import { getRunOrder } from '../../_helper/runGraph.helper';
import NodeRunOutput from './NodeRunOutput.partial';
import RunConsole from './RunConsole.partial';
import RunHistory from './RunHistory.partial';

const statusMeta = {
	idle: {
		label: 'Ready to run',
		color: 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400',
		dot: 'bg-zinc-400',
	},
	running: {
		label: 'Running',
		color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
		dot: 'bg-blue-500 animate-pulse',
	},
	success: {
		label: 'Completed',
		color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
		dot: 'bg-emerald-500',
	},
	error: {
		label: 'Needs attention',
		color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
		dot: 'bg-rose-500',
	},
	stopped: {
		label: 'Stopped',
		color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
		dot: 'bg-amber-500',
	},
};
const tabs = [
	{ id: 'console', label: 'Overview', icon: ListChecks },
	{ id: 'results', label: 'Results', icon: FileText },
	{ id: 'history', label: 'History', icon: History },
] as const;
const secondaryButton =
	'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]';

const RunPanel = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { stepNext, runWorkflow, stopRun } = useRunWorkflow();
	const reactFlow = useReactFlow();
	if (!state.ui.runPanelOpen) return null;
	const run = state.run;
	const meta = statusMeta[run.status];
	const steps = getRunOrder(state.nodes, state.edges).filter((node) => node.type !== 'note');
	const completed =
		run.status === 'idle' ? 0 : steps.filter((node) => node.data.status === 'success').length;
	const failed =
		run.status === 'error' ? steps.find((node) => node.data.status === 'error') : undefined;
	const resultCount = steps.reduce(
		(count, node) =>
			count +
			Number(
				node.data.status === 'success' ||
					node.data.status === 'error' ||
					Boolean(node.data.pinned),
			) +
			Number(Boolean(node.data.testStatus && node.data.testStatus !== 'idle')),
		0,
	);
	const focusStep = (id: string) => {
		dispatch({ type: 'SELECT_NODE', id });
		reactFlow.fitView({ nodes: [{ id }], padding: 0.4, duration: 350 });
	};
	const duration =
		run.startedAt && run.finishedAt
			? `${(Math.max(0, run.finishedAt - run.startedAt) / 1000).toFixed(1)}s`
			: run.status === 'running'
				? 'In progress'
				: '—';

	return (
		<section
			aria-label='Workflow runs'
			className='[&_button]:focus-visible:outline-primary-500 [&_summary]:focus-visible:outline-primary-500 flex h-full min-h-0 flex-col overflow-hidden bg-white text-zinc-900 dark:bg-[#111315] dark:text-zinc-100 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_summary]:focus-visible:outline-2'>
			<header className='shrink-0 px-5 pt-5'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-2.5'>
						<span className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400'>
							<ListChecks size={16} />
						</span>
						<h2 className='text-sm font-semibold tracking-tight'>Workflow runs</h2>
					</div>
					<button
						type='button'
						aria-label='Close runs panel'
						onClick={() => dispatch({ type: 'TOGGLE_RUN_PANEL' })}
						className='flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white'>
						<X size={16} />
					</button>
				</div>
				<nav
					aria-label='Run views'
					className='mt-5 flex gap-5 border-b border-zinc-200 dark:border-white/10'>
					{tabs.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type='button'
							aria-pressed={state.ui.runPanelTab === id}
							onClick={() => dispatch({ type: 'SET_RUN_PANEL_TAB', tab: id })}
							className={`relative flex items-center gap-1.5 border-b-2 px-0.5 pb-3 text-xs font-medium transition ${state.ui.runPanelTab === id ? 'dark:border-primary-400 border-zinc-900 text-zinc-900 dark:text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}`}>
							<Icon size={14} />
							{label}
							{id === 'results' && resultCount > 0 && (
								<span className='rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-white/5 dark:text-zinc-400'>
									{resultCount}
								</span>
							)}
						</button>
					))}
				</nav>
			</header>
			<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
				{state.ui.runPanelTab === 'history' ? (
					<div className='px-5 py-5'>
						<RunHistory />
					</div>
				) : (
					<>
						<div className='border-b border-zinc-100 px-5 py-5 dark:border-white/[0.06]'>
							<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
								<span className='text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
									CURRENT RUN
								</span>
								<span
									role='status'
									aria-live='polite'
									className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${meta.color}`}>
									<span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
									{meta.label}
								</span>
							</div>
							<h3 className='text-base leading-snug font-semibold tracking-tight break-words'>
								{state.workflow.name}
							</h3>
							<dl className='mt-5 grid grid-cols-3 divide-x divide-zinc-200 dark:divide-white/10'>
								<div className='pr-3'>
									<dt className='text-[11px] text-zinc-500 dark:text-zinc-400'>
										Started
									</dt>
									<dd className='mt-1.5 text-xs font-medium tabular-nums'>
										{run.startedAt
											? new Date(run.startedAt).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})
											: '—'}
									</dd>
								</div>
								<div className='px-3'>
									<dt className='text-[11px] text-zinc-500 dark:text-zinc-400'>
										Duration
									</dt>
									<dd className='mt-1.5 text-xs font-medium tabular-nums'>
										{duration}
									</dd>
								</div>
								<div className='pl-3'>
									<dt className='text-[11px] text-zinc-500 dark:text-zinc-400'>
										Steps done
									</dt>
									<dd className='mt-1.5 text-xs font-medium tabular-nums'>
										{completed}
										<span className='font-normal text-zinc-400'>
											{' '}
											/ {steps.length}
										</span>
									</dd>
								</div>
							</dl>
							{state.ui.stepMode && (
								<p className='mt-4 border-l-2 border-amber-400 pl-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
									Practice mode. Actions are simulated; connected apps are not
									affected.
								</p>
							)}
						</div>
						{state.ui.runPanelTab === 'results' ? (
							<div className='px-5 py-5'>
								<div className='mb-4'>
									<h3 className='text-sm font-semibold'>Run results</h3>
									<p className='mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
										Open a step to explore what it returned.
									</p>
								</div>
								<NodeRunOutput nodes={steps} />
							</div>
						) : (
							<div className='px-5 py-5'>
								{run.status === 'error' && (
									<div className='mb-6 flex gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-500/15 dark:bg-rose-500/[0.05]'>
										<CircleAlert
											size={17}
											className='mt-0.5 shrink-0 text-rose-500'
										/>
										<div className='min-w-0'>
											<p className='text-xs font-semibold'>
												{failed
													? `Stopped at ${failed.data.label}`
													: 'This run could not finish'}
											</p>
											<p className='mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400'>
												{failed
													? 'Review this step’s settings before running again.'
													: 'Check the activity below for more details.'}
											</p>
											{failed && (
												<button
													type='button'
													onClick={() => focusStep(failed.id)}
													className='mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400'>
													Review step
													<ArrowUpRight size={13} />
												</button>
											)}
										</div>
									</div>
								)}
								<div className='mb-4 flex items-center justify-between'>
									<h3 className='text-xs font-semibold'>Step progress</h3>
									<span className='text-[11px] text-zinc-400'>
										{steps.length} steps
									</span>
								</div>
								{!steps.length ? (
									<div className='py-8 text-center'>
										<ListChecks
											size={28}
											className='mx-auto text-zinc-300 dark:text-zinc-600'
										/>
										<p className='mt-3 text-sm font-medium'>No steps yet</p>
										<p className='mt-1 text-xs text-zinc-500'>
											Add steps to your workflow to get started.
										</p>
									</div>
								) : (
									<ol>
										{steps.map((node, index) => {
											const status =
												run.status === 'idle'
													? 'idle'
													: (node.data.status ?? 'idle');
											const working =
												run.status === 'running' &&
												(status === 'running' ||
													run.currentNodeId === node.id);
											const label = working
												? 'In progress'
												: status === 'success'
													? 'Completed'
													: status === 'error'
														? 'Needs attention'
														: status === 'skipped'
															? 'Skipped'
															: run.status === 'stopped' ||
																  run.status === 'error'
																? 'Not completed'
																: run.status === 'success'
																	? 'Not run'
																	: 'Waiting';
											return (
												<li key={node.id} className='group relative pl-10'>
													{index < steps.length - 1 && (
														<span
															aria-hidden='true'
															className='absolute top-7 bottom-0 left-[13px] w-px bg-zinc-200 dark:bg-white/10'
														/>
													)}
													<span
														className={`absolute top-1 left-0 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium ${working ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400' : status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' : status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-500/20 dark:bg-rose-500/10' : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-white/[0.02]'}`}>
														{working ? (
															<Loader2
																size={13}
																className='animate-spin'
															/>
														) : status === 'success' ? (
															<Check size={13} strokeWidth={2.5} />
														) : status === 'error' ? (
															<X size={13} />
														) : (
															index + 1
														)}
													</span>
													<button
														type='button'
														aria-label={`Show ${node.data.label} on canvas: ${label}`}
														onClick={() => focusStep(node.id)}
														className='flex w-full items-start justify-between gap-3 rounded-md pt-1 pb-6 text-left'>
														<div className='min-w-0'>
															<p className='group-hover:text-primary-600 dark:group-hover:text-primary-400 text-[13px] leading-5 font-medium break-words transition'>
																{node.data.label}
															</p>
															<p
																className={`mt-1 text-[11px] ${status === 'error' ? 'text-rose-500' : working ? 'text-blue-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
																{label}
															</p>
														</div>
														<div className='flex shrink-0 items-center gap-1.5 pt-0.5'>
															<span className='text-[11px] text-zinc-400 tabular-nums'>
																{status === 'success' &&
																node.data.durationMs !== undefined
																	? `${(node.data.durationMs / 1000).toFixed(1)}s`
																	: ''}
															</span>
															<ArrowUpRight
																size={12}
																className='text-zinc-300 transition group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-300'
															/>
														</div>
													</button>
												</li>
											);
										})}
									</ol>
								)}
								{resultCount > 0 && (
									<button
										type='button'
										onClick={() =>
											dispatch({ type: 'SET_RUN_PANEL_TAB', tab: 'results' })
										}
										className='mb-5 flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-3 text-left transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]'>
										<FileText size={16} className='text-zinc-400' />
										<div className='flex-1'>
											<p className='text-xs font-medium'>View results</p>
											<p className='mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400'>
												{resultCount} result{resultCount === 1 ? '' : 's'}{' '}
												available
											</p>
										</div>
										<ChevronRight size={14} className='text-zinc-400' />
									</button>
								)}
								<details className='border-t border-zinc-100 pt-4 dark:border-white/[0.06]'>
									<summary className='cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400'>
										Run activity
									</summary>
									<p className='mt-2 mb-3 text-[11px] text-zinc-400'>
										Detailed messages for troubleshooting.
									</p>
									{failed?.data.error && (
										<p className='mb-3 text-xs leading-relaxed break-words text-rose-500'>
											{failed.data.error}
										</p>
									)}
									<RunConsole logs={run.logs} />
								</details>
							</div>
						)}
					</>
				)}
			</div>
			<footer className='flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/70 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.015]'>
				<span className='flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400'>
					<Clock3 size={12} />
					{state.ui.stepMode ? 'Practice mode' : 'Manual run'}
				</span>
				<div className='flex flex-wrap gap-2'>
					{state.ui.stepMode && state.ui.waitingForStep && (
						<button type='button' onClick={stepNext} className={secondaryButton}>
							<Play size={12} />
							Next step
						</button>
					)}
					{run.status === 'running' ? (
						<button
							type='button'
							onClick={() => void stopRun()}
							className={secondaryButton}>
							<Square size={12} />
							Stop run
						</button>
					) : (
						<button
							type='button'
							disabled={!steps.length}
							onClick={() => void runWorkflow()}
							className='dark:bg-primary-400 dark:text-primary-950 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:brightness-110'>
							{run.status === 'idle' ? <Play size={13} /> : <RotateCw size={13} />}
							{run.status === 'idle' ? 'Start run' : 'Run again'}
						</button>
					)}
				</div>
			</footer>
		</section>
	);
};

export default RunPanel;
