import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import { buildPath } from '@/Routes/paths';

/**
 * Page paths are templates (`/:workspaceId/agents`). The id comes from the URL,
 * falling back to workspace context for the routes that render outside the
 * `/:workspaceId` tree (billing callbacks, the settings aside on a deep link).
 */
export const useWorkspaceId = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();

	return workspaceId || activeWorkspaceId;
};

const useResolvePath = () => {
	const workspaceId = useWorkspaceId();

	const resolvePath = useCallback(
		(to: string, params?: Record<string, string | number | undefined>) =>
			buildPath(to, { workspaceId, ...params }),
		[workspaceId],
	);

	return useMemo(() => ({ workspaceId, resolvePath }), [workspaceId, resolvePath]);
};

export default useResolvePath;
