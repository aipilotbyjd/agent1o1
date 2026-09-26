import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';

const TemplateLibrary = () => {
	const { dispatch } = useWorkflowEditor();

	return (
		<div className='border-t border-zinc-200 p-3 dark:border-white/10'>
			<button
				type='button'
				onClick={() =>
					dispatch({
						type: 'ADD_TEMPLATE',
						name: 'New AI workflow',
						defKeys: ['input.ask', 'ai.chat', 'output.display'],
					})
				}
				className='w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50'>
				Generate starter flow
			</button>
		</div>
	);
};

export default TemplateLibrary;
