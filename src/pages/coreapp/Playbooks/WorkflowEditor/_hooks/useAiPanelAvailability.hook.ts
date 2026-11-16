import { useAiChatStore } from '@/store/aiChat.store';
import usePermission from '@/hooks/usePermission';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * An empty canvas starts with the centered AI prompt as the only way in. The AI Chat panel
 * (and every button that opens it) joins once there is something to talk about: steps on
 * the canvas, or a chat already started from that prompt.
 */
export const useAiPanelAvailability = () => {
	const { state, canEdit } = useWorkflowEditor();
	const isChatActive = useAiChatStore((store) => store.isChatActive);
	// The builder edits the graph, and its endpoints refuse anyone below editor.
	const { can } = usePermission();
	const canUseBuilder = can('workflow.builder.use') && canEdit;

	const isAiPanelAvailable =
		canUseBuilder &&
		(state.nodes.length > 0 || state.ui.emptyCanvasView === 'chat-started' || isChatActive);

	return {
		isAiPanelAvailable,
		isAiPanelShown: isAiPanelAvailable && state.ui.aiPanelOpen,
	};
};
