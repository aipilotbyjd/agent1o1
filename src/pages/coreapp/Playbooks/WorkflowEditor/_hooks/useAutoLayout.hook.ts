import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import type { TCanvasNode } from '../_types/canvas.type';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/** Lays the canvas out from the nodes' rendered sizes, then brings it all into view. */
export const useAutoLayout = ({ record = true }: { record?: boolean } = {}) => {
	const { dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow<TCanvasNode>();

	return useCallback(() => {
		const sizes = new Map<string, { width: number; height: number }>();
		reactFlow.getNodes().forEach((node) => {
			if (node.measured?.width && node.measured.height) {
				sizes.set(node.id, { width: node.measured.width, height: node.measured.height });
			}
		});
		dispatch({ type: 'AUTO_LAYOUT', sizes, record });
		// The store hands new positions to React Flow on the next commit.
		requestAnimationFrame(() =>
			requestAnimationFrame(() => reactFlow.fitView({ padding: 0.18, duration: 320 })),
		);
	}, [dispatch, reactFlow, record]);
};
