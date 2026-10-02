import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';

export const useNodeSelection = () => {
	const { state, dispatch } = useWorkflowEditor();
	const selectedNode = state.nodes.find((node) => node.id === state.ui.selectedNodeId) ?? null;

	return {
		selectedNode,
		selectNode: (id: string | null) => dispatch({ type: 'SELECT_NODE', id }),
	};
};
