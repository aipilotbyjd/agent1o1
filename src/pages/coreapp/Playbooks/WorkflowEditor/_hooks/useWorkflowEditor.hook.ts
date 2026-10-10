import { useContext } from 'react';
import { WorkflowEditorContext } from '../_context/WorkflowEditorStore.context';

export const useWorkflowEditor = () => {
	const context = useContext(WorkflowEditorContext);
	if (!context) throw new Error('useWorkflowEditor must be used inside WorkflowEditorProvider');
	return context;
};
