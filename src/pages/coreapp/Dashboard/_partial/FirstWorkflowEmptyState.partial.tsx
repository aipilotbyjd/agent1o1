import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, GitMerge, Loader2, Plus } from 'lucide-react';
import pages from '@/Routes/pages';
import { withWorkspace } from '@/Routes/paths';

type TFirstWorkflowEmptyStateProps = {
	ws: string;
	onCreateWorkflow: () => void;
	isCreating: boolean;
};

/**
 * What a workspace with nothing in it sees in place of empty charts: one
 * thing to do next. Run counters and failure lists only mean something once
 * there is a workflow to run.
 */
const FirstWorkflowEmptyState = ({
	ws,
	onCreateWorkflow,
	isCreating,
}: TFirstWorkflowEmptyStateProps) => {
	const navigate = useNavigate();

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className='border-border-main bg-bg-card flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center shadow-sm'>
			<div className='border-primary-100 bg-primary-50 text-primary-500 dark:border-primary-400/20 dark:bg-primary-400/10 dark:text-primary-400 flex h-14 w-14 items-center justify-center rounded-2xl border'>
				<GitMerge size={24} />
			</div>
			<h2 className='mt-5 text-xl font-black tracking-tight text-slate-950 dark:text-white'>
				Build your first workflow
			</h2>
			<p className='mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-zinc-400'>
				A workflow does a job for you: watch for something, then act on it across your apps.
				Run it once and your results show up right here.
			</p>
			<button
				type='button'
				onClick={onCreateWorkflow}
				disabled={isCreating}
				className='dark:from-primary-400 dark:to-primary-400 dark:text-primary-950 mt-6 flex h-11 items-center gap-2 rounded-xl bg-[#101828] px-6 text-sm font-bold text-white shadow-md shadow-slate-950/15 transition-all hover:bg-[#1e293b] active:scale-95 disabled:opacity-70 dark:bg-gradient-to-r dark:hover:brightness-110'>
				{isCreating ? (
					<Loader2 size={15} className='animate-spin' />
				) : (
					<Plus size={15} strokeWidth={3} />
				)}
				Create your first workflow
			</button>
			<button
				type='button'
				onClick={() => navigate(withWorkspace(pages.workspace.subPages!.blueprints.to, ws))}
				className='text-primary-600 dark:text-primary-400 mt-3 flex items-center gap-1 text-xs font-bold hover:underline'>
				or start from a template
				<ArrowRight size={12} />
			</button>
		</motion.section>
	);
};

export default FirstWorkflowEmptyState;
