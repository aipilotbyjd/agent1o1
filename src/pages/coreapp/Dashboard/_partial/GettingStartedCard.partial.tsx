import type { ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, Check, Circle, FileText, Mail, Play, Plug, X, Zap } from 'lucide-react';
import { useDashboardOverview, useDismissGettingStarted } from '@/api/modules/dashboard';
import { useUseWorkflowTemplate } from '@/api/modules/templates';
import usePermission from '@/hooks/usePermission';
import pages from '@/Routes/pages';
import paths, { withWorkspace } from '@/Routes/paths';
import type { TGettingStartedMilestoneKey } from '@/types/dashboard.type';

const milestoneIcons: Record<TGettingStartedMilestoneKey, ComponentType<{ size?: number }>> = {
	run_workflow: Play,
	connect_app: Plug,
	activate_trigger: Zap,
	create_agent: Bot,
	invite_teammate: Mail,
};

/**
 * The checklist a new workspace works through. Milestones tick themselves off
 * from what the workspace does, so each one links to where that happens. A
 * workspace with no workflow yet is also offered templates to start from.
 */
const GettingStartedCard = ({ ws }: { ws: string }) => {
	const navigate = useNavigate();
	const { can } = usePermission();
	// Same query (and key) the dashboard itself reads, so this costs no request.
	const { data: overview } = useDashboardOverview(ws, { days: 7 });
	const dismiss = useDismissGettingStarted(ws);
	const useTemplate = useUseWorkflowTemplate(ws);

	const gettingStarted = overview?.getting_started;
	const isVisible = !!gettingStarted && !gettingStarted.completed && !gettingStarted.dismissed;

	const milestones = gettingStarted?.milestones ?? [];
	const completedCount = milestones.filter((item) => item.completed).length;
	const nextMilestone = milestones.find((item) => !item.completed);
	const templates = can('workflow.manage') ? (gettingStarted?.recommended_templates ?? []) : [];
	const hasWorkflows = (overview?.counts.workflows ?? 0) > 0;

	const workspacePages = pages.workspace.subPages!;
	const milestonePaths: Record<TGettingStartedMilestoneKey, string> = {
		run_workflow: hasWorkflows
			? paths.playbooks(ws)
			: withWorkspace(workspacePages.blueprints.to, ws),
		connect_app: paths.apps(ws),
		activate_trigger: paths.playbooks(ws),
		create_agent: paths.agents(ws),
		invite_teammate: paths.members(ws),
	};

	const startFromTemplate = (id: string) => {
		if (useTemplate.isPending) return;
		useTemplate.mutate(
			{ id },
			{ onSuccess: (workflow) => navigate(paths.editPlaybook(ws, workflow.id)) },
		);
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10, height: 0 }}
					transition={{ duration: 0.3 }}
					className='border-border-main bg-bg-card overflow-hidden rounded-3xl border p-5 shadow-sm'>
					<div className='flex flex-wrap items-start justify-between gap-4'>
						<div>
							<p className='text-primary-600 dark:text-primary-400 text-[10px] font-black tracking-[0.18em] uppercase'>
								Getting started
							</p>
							<h2 className='mt-1 text-sm font-black text-slate-950 dark:text-white'>
								{completedCount} of {milestones.length} milestones complete
							</h2>
						</div>
						<button
							type='button'
							onClick={() => dismiss.mutate()}
							disabled={dismiss.isPending}
							className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
							<X className='h-3.5 w-3.5' />
							Dismiss
						</button>
					</div>

					<div className='bg-primary-100/50 dark:bg-primary-900/20 mt-3 h-1.5 overflow-hidden rounded-full'>
						<div
							className='from-primary-400 to-primary-400 h-full rounded-full bg-gradient-to-r transition-all duration-500'
							style={{
								width: `${(completedCount / Math.max(milestones.length, 1)) * 100}%`,
							}}
						/>
					</div>

					{templates.length > 0 && (
						<div className='mt-5'>
							<div className='flex items-center justify-between gap-3'>
								<p className='text-xs font-black text-slate-800 dark:text-zinc-100'>
									Start with a template picked for you
								</p>
								<button
									type='button'
									onClick={() =>
										navigate(withWorkspace(workspacePages.blueprints.to, ws))
									}
									className='text-primary-600 dark:text-primary-400 flex items-center gap-1 text-[11px] font-bold hover:underline'>
									Browse all
									<ArrowRight className='h-3 w-3' />
								</button>
							</div>
							<div className='mt-3 grid gap-3 md:grid-cols-3'>
								{templates.map((template) => (
									<button
										key={template.id}
										type='button'
										onClick={() => startFromTemplate(template.id)}
										disabled={useTemplate.isPending}
										className='border-primary-400/60 bg-primary-50/40 hover:border-primary-400 dark:bg-primary-950/10 flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60'>
										<div className='flex items-center gap-2.5'>
											<div className='bg-primary-100/60 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
												<FileText size={15} />
											</div>
											<div className='min-w-0'>
												<span className='block truncate text-xs font-black text-slate-800 dark:text-zinc-100'>
													{template.name}
												</span>
												{template.category && (
													<span className='block truncate text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
														{template.category}
													</span>
												)}
											</div>
										</div>
										{template.description && (
											<p className='line-clamp-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
												{template.description}
											</p>
										)}
										<span className='text-primary-600 dark:text-primary-400 mt-auto flex items-center gap-1 text-[11px] font-black'>
											Use this template
											<ArrowRight className='h-3 w-3' />
										</span>
									</button>
								))}
							</div>
						</div>
					)}

					<div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
						{milestones.map((item) => {
							const isNext = nextMilestone?.key === item.key;
							const IconComp = milestoneIcons[item.key] ?? Circle;
							const cardBorder = isNext
								? 'border-primary-400 shadow-sm'
								: 'border-border-main';
							const iconStyle =
								item.completed || isNext
									? 'bg-primary-100/60 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
									: 'bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600';
							return (
								<button
									key={item.key}
									type='button'
									onClick={() => navigate(milestonePaths[item.key])}
									className={`bg-bg-card hover:border-primary-400 flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md ${cardBorder}`}>
									<div className='flex min-w-0 flex-1 items-center gap-3.5'>
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}>
											<IconComp size={16} />
										</div>
										<div className='min-w-0 flex-1'>
											<span
												className={`block truncate text-xs font-black ${item.completed ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-100'}`}>
												{item.label}
											</span>
											<span className='mt-0.5 block truncate text-[10px] leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
												{item.description}
											</span>
										</div>
									</div>
									<div className='shrink-0 pl-1'>
										{item.completed ? (
											<div className='bg-primary-400 text-primary-950 flex h-4.5 w-4.5 items-center justify-center rounded-full'>
												<Check className='h-3 w-3 stroke-[3]' />
											</div>
										) : (
											<Circle
												className={`h-4.5 w-4.5 shrink-0 ${isNext ? 'text-primary-500' : 'text-slate-300 dark:text-zinc-600'}`}
											/>
										)}
									</div>
								</button>
							);
						})}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default GettingStartedCard;
