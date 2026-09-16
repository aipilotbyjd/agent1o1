import { AlertTriangle, CheckCircle2, CircleAlert, GitBranch, Timer } from 'lucide-react';
import { validateWorkflow } from '../../_helper/validation.helper';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';

const StatusBar = () => {
	const { state } = useWorkflowEditor();
	const issues = validateWorkflow(state.nodes, state.edges);
	const errorCount = issues.filter((i) => i.severity === 'error').length;
	const warningCount = issues.filter((i) => i.severity === 'warning').length;

	return (
		<footer className='flex h-9 shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950'>
			<div className='flex items-center gap-4'>
				<span className='flex items-center gap-1.5'>
					<Timer size={13} />
					{state.workflow.savingState}
				</span>
				{errorCount > 0 && (
					<span className='flex items-center gap-1.5 text-rose-600 dark:text-rose-300'>
						<CircleAlert size={13} />
						{errorCount} error{errorCount !== 1 ? 's' : ''}
					</span>
				)}
				{warningCount > 0 && (
					<span className='flex items-center gap-1.5 text-amber-600 dark:text-amber-300'>
						<AlertTriangle size={13} />
						{warningCount} warning{warningCount !== 1 ? 's' : ''}
					</span>
				)}
				{issues.length === 0 && state.nodes.length > 0 && (
					<span className='flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300'>
						<CheckCircle2 size={13} />
						Workflow is valid
					</span>
				)}
				<span className='flex items-center gap-1.5'>
					<GitBranch size={13} />
					{state.edges.length} edges
				</span>
			</div>
			<span>{state.workflow.folder}</span>
		</footer>
	);
};

export default StatusBar;
