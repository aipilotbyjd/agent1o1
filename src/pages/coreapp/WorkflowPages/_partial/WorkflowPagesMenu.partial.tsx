import { useState } from 'react';
import { Link } from 'react-router';
import { AppWindow, Plus } from 'lucide-react';
import { useWorkflowPages } from '@/api/modules/workflow-pages';
import paths from '@/Routes/paths';
import CreatePageModal from './CreatePageModal.partial';

const itemClass =
	'hover:bg-primary-100/70 hover:text-primary-900 dark:hover:bg-primary-400/10 dark:hover:text-primary-200 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition dark:text-zinc-300';

/**
 * The workflow editor's way into pages: the pages built on this workflow,
 * and a new one with the workflow already picked.
 */
const WorkflowPagesMenu = ({
	ws,
	workflowId,
	onNavigate,
}: {
	ws: string;
	workflowId: string;
	onNavigate: () => void;
}) => {
	const { data: pages } = useWorkflowPages(ws, workflowId);
	const [creating, setCreating] = useState(false);

	return (
		<>
			<p className='px-2.5 pt-1 pb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase'>
				Pages
			</p>
			{(pages ?? []).slice(0, 5).map((page) => (
				<Link
					key={page.id}
					to={paths.editPage(ws, page.id)}
					onClick={onNavigate}
					className={itemClass}>
					<AppWindow
						size={14}
						className='text-primary-700 dark:text-primary-400 shrink-0'
					/>
					<span className='min-w-0 flex-1 truncate'>{page.name}</span>
					<span
						className={`size-1.5 shrink-0 rounded-full ${page.is_published ? 'bg-emerald-500' : 'bg-zinc-300'}`}
					/>
				</Link>
			))}
			<button type='button' onClick={() => setCreating(true)} className={itemClass}>
				<Plus size={14} className='text-primary-700 dark:text-primary-400' />
				<span>Create a page for this workflow</span>
			</button>
			{creating && (
				<CreatePageModal
					ws={ws}
					isOpen={creating}
					workflowId={workflowId}
					onClose={() => {
						setCreating(false);
						onNavigate();
					}}
				/>
			)}
		</>
	);
};

export default WorkflowPagesMenu;
