import { useWorkflowEditor } from './useWorkflowEditor.hook';

export const useNodeSelection = () => {
	const { state, dispatch } = useWorkflowEditor();
	const selectedNode = state.nodes.find((node) => node.id === state.ui.selectedNodeId) ?? null;

	return {
		selectedNode,
		selectNode: (id: string | null) => dispatch({ type: 'SELECT_NODE', id }),
	};
};
