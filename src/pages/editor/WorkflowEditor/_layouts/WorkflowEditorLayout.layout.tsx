import { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowEditorProvider } from '../_context/WorkflowEditorProvider.context';

const WorkflowEditorLayout = ({ children }: { children: ReactNode }) => {
	return (
		<WorkflowEditorProvider>
			<ReactFlowProvider>
				<div className='flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-[#07080b] dark:text-zinc-100'>
					{children}
				</div>
			</ReactFlowProvider>
		</WorkflowEditorProvider>
	);
};

export default WorkflowEditorLayout;
