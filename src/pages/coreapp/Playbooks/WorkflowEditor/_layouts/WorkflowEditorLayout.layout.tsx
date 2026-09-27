import { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowEditorProvider } from '../_context/WorkflowEditorProvider.context';
import { WorkflowRunProvider } from '../_hooks/useRunWorkflow.hook';
import { useWorkflowRouteParams } from '../_hooks/useWorkflowRouteParams.hook';

const WorkflowEditorLayout = ({ children }: { children: ReactNode }) => {
	const { workspaceId, workflowId } = useWorkflowRouteParams();
	return (
		<WorkflowEditorProvider key={`${workspaceId}:${workflowId}`}>
			<ReactFlowProvider>
				<WorkflowRunProvider>
					<div className='flex h-dvh w-screen flex-col overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-[#07080b] dark:text-zinc-100'>
						{children}
					</div>
				</WorkflowRunProvider>
			</ReactFlowProvider>
		</WorkflowEditorProvider>
	);
};

export default WorkflowEditorLayout;
