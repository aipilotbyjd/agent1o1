import { useAiChatStore } from '@/store/aiChat.store';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * An empty canvas starts with the centered AI prompt as the only way in. The AI Chat panel
 * (and every button that opens it) joins once there is something to talk about: steps on
 * the canvas, or a chat already started from that prompt.
 */
export const useAiPanelAvailability = () => {
	const { state } = useWorkflowEditor();
	const isChatActive = useAiChatStore((store) => store.isChatActive);

	const isAiPanelAvailable =
		state.nodes.length > 0 || state.ui.emptyCanvasView === 'chat-started' || isChatActive;

	return {
		isAiPanelAvailable,
		isAiPanelShown: isAiPanelAvailable && state.ui.aiPanelOpen,
	};
};
