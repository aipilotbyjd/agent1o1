import { useState } from 'react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { getAiWorkflowDraft } from '../../_helper/aiWorkflowDraft.helper';
import Icon from '@/components/icon/Icon';

const PromptToWorkflow = () => {
	const { dispatch } = useWorkflowEditor();
	const [prompt, setPrompt] = useState(
		'When a customer submits feedback, classify sentiment, draft a reply, and notify Slack',
	);

	const generate = () => {
		const draft = getAiWorkflowDraft(prompt);

		dispatch({
			type: 'ADD_TEMPLATE',
			name: draft.name,
			defKeys: draft.defKeys,
		});
	};

	return (
		<div className='space-y-3'>
			<textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				aria-label='Workflow prompt'
				placeholder='Describe the workflow'
				className='h-36 w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-900 transition outline-none placeholder:text-zinc-500 focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
			/>
			<button
				type='button'
				onClick={generate}
				className='flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-600'>
				<Icon icon='AiMagic' className='text-base' />
				Build workflow
			</button>
		</div>
	);
};

export default PromptToWorkflow;
