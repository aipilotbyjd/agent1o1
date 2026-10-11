import { useMemo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, CircleCheck, Lightbulb, TriangleAlert, X } from 'lucide-react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { issuesToFix, type TValidationIssue } from '../../_helper/validation.helper';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';

/**
 * The "Fix before publishing" checklist: a quiet pill in the top bar that
 * appears only while something needs attention, opening a list of what — by
 * step name, in plain words, split into what blocks publishing and what's
 * only a suggestion. Choosing an item centres the canvas on that step and
 * glows the field. Opens by itself when a publish is refused.
 */
const IssuesChecklist = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();
	const setPreviewVersionId = useWorkflowShellStore((store) => store.setPreviewVersionId);
	const ref = useRef<HTMLDivElement>(null);

	const issues = useMemo(
		() => issuesToFix(state.nodes, state.edges, state.ui.serverIssues),
		[state.nodes, state.edges, state.ui.serverIssues],
	);
	const blocking = issues.filter((issue) => issue.blocksPublish);
	const tips = issues.filter((issue) => !issue.blocksPublish);
	const open = state.ui.issuesPanelOpen;
	const close = () => dispatch({ type: 'SET_ISSUES_PANEL', open: false });

	useOnClickOutside(ref, () => open && close());

	const stepName = (issue: TValidationIssue) => {
		const node = state.nodes.find((n) => n.id === issue.nodeId);
		if (!node) return 'Workflow';
		return (
			node.data.label ||
			getNodeDefinition(node.data.defKey, node.data.definition)?.label ||
			'Step'
		);
	};

	const jump = (issue: TValidationIssue) => {
		if (!issue.nodeId) return;
		setPreviewVersionId(null);
		reactFlow.fitView({
			nodes: [{ id: issue.nodeId }],
			padding: 0.6,
			duration: 400,
			maxZoom: 1.1,
		});
		dispatch({ type: 'FOCUS_FIELD', nodeId: issue.nodeId, fieldKey: issue.fieldKey ?? null });
	};

	if (issues.length === 0 && !open) return null;

	return (
		<div ref={ref} className='relative'>
			<button
				type='button'
				onClick={() => dispatch({ type: 'SET_ISSUES_PANEL', open: !open })}
				aria-expanded={open}
				aria-haspopup='dialog'
				className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
					blocking.length > 0
						? 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-400/10'
						: 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
				}`}>
				{blocking.length > 0 ? <TriangleAlert size={13} /> : <Lightbulb size={13} />}
				<span>
					{blocking.length > 0
						? `${blocking.length} to fix`
						: `${tips.length} tip${tips.length === 1 ? '' : 's'}`}
				</span>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						role='dialog'
						aria-label={blocking.length > 0 ? 'Fix before publishing' : 'Suggestions'}
						initial={{ opacity: 0, y: -6, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -6, scale: 0.98 }}
						transition={{ duration: 0.14 }}
						className='absolute top-10 right-0 z-50 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/50'>
						<div className='flex items-start justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
							<div>
								<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
									{blocking.length > 0
										? 'Fix before publishing'
										: 'Ready to publish'}
								</p>
								<p className='mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
									{blocking.length > 0
										? 'Your draft is saved. These need to be done before it can go live.'
										: 'Nothing blocks publishing. A few suggestions below.'}
								</p>
							</div>
							<button
								type='button'
								onClick={close}
								aria-label='Close'
								className='rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5'>
								<X size={14} />
							</button>
						</div>

						{issues.length === 0 ? (
							<p className='flex items-center gap-2 px-4 py-5 text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
								<CircleCheck size={15} />
								All set — nothing left to fix.
							</p>
						) : (
							<div className='max-h-80 overflow-y-auto p-1.5'>
								{blocking.length > 0 && (
									<IssueGroup
										title='Needed to publish'
										issues={blocking}
										stepName={stepName}
										onJump={jump}
									/>
								)}
								{tips.length > 0 && (
									<IssueGroup
										title='Suggestions'
										issues={tips}
										stepName={stepName}
										onJump={jump}
									/>
								)}
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

interface IIssueGroupProps {
	title: string;
	issues: TValidationIssue[];
	stepName: (issue: TValidationIssue) => string;
	onJump: (issue: TValidationIssue) => void;
}

const IssueGroup = ({ title, issues, stepName, onJump }: IIssueGroupProps) => (
	<div className='mb-1 last:mb-0'>
		<p className='px-2.5 pt-1.5 pb-1 text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
			{title}
		</p>
		<ul>
			{issues.map((issue) => (
				<li key={issue.id}>
					<button
						type='button'
						onClick={() => onJump(issue)}
						disabled={!issue.nodeId}
						className='group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition enabled:hover:bg-zinc-50 disabled:cursor-default dark:enabled:hover:bg-white/5'>
						<span
							className={`h-1.5 w-1.5 shrink-0 rounded-full ${
								!issue.blocksPublish
									? 'bg-zinc-300'
									: issue.severity === 'error'
										? 'bg-rose-500'
										: 'bg-amber-400'
							}`}
						/>
						<span className='min-w-0 flex-1'>
							<span className='block truncate text-xs font-bold text-zinc-800 dark:text-zinc-100'>
								{stepName(issue)}
							</span>
							<span className='block text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
								{issue.message}
							</span>
						</span>
						{issue.nodeId && (
							<ChevronRight
								size={14}
								className='shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500'
							/>
						)}
					</button>
				</li>
			))}
		</ul>
	</div>
);

export default IssuesChecklist;
