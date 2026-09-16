import { useCallback, useState } from 'react';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import type { TCanvasPosition } from '../_types/canvas.type';
import type { TNodeDefinition } from '../_types/node.type';

export const useCanvasDrop = (
	getCanvasPosition?: (event: React.DragEvent<HTMLElement>) => TCanvasPosition,
) => {
	const { dispatch } = useWorkflowEditor();
	const [isDraggingNode, setIsDraggingNode] = useState(false);

	const getFallbackCanvasPosition = useCallback(
		(event: React.DragEvent<HTMLElement>): TCanvasPosition => {
			const rect = event.currentTarget.getBoundingClientRect();
			return {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
		},
		[],
	);

	const onDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setIsDraggingNode(true);
	}, []);

	const onDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
		if (event.currentTarget === event.target) setIsDraggingNode(false);
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			setIsDraggingNode(false);
			const defKey = event.dataTransfer.getData('application/x-node-def');
			if (!defKey) return;
			const rawDefinition = event.dataTransfer.getData('application/x-node-definition');
			let definition: TNodeDefinition | undefined;
			if (rawDefinition) {
				try {
					definition = JSON.parse(rawDefinition) as TNodeDefinition;
				} catch {
					definition = undefined;
				}
			}
			dispatch({
				type: 'ADD_NODE',
				defKey,
				position: getCanvasPosition?.(event) ?? getFallbackCanvasPosition(event),
				definition,
			});
		},
		[dispatch, getCanvasPosition, getFallbackCanvasPosition],
	);

	return { isDraggingNode, onDragOver, onDragLeave, onDrop };
};
