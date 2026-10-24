import { useWorkspaceContext } from '@/context/workspace';
import { useWorkflowRouteParams } from './useWorkflowRouteParams.hook';

/** The workspace the open workflow belongs to: the URL's, not the member's current one. */
export const useEditorWorkspaceId = () => {
	const { workspaceId } = useWorkflowRouteParams();
	const { activeWorkspaceId } = useWorkspaceContext();
	return workspaceId || activeWorkspaceId;
};
