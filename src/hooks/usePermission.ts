import { useCallback } from 'react';
import { useWorkspaceContext } from '@/context/workspace';
import type { TPermissionCheck, TPermissionMode } from '@/types/permission.type';
import type { TWorkspaceRole } from '@/types/workspace.type';
import { workspaceAllows } from '@/utils/permission.util';

/**
 * Permission checks against the active workspace. The backend still enforces
 * every rule: these only decide what the UI offers.
 */
const usePermission = () => {
	const { activeWorkspace } = useWorkspaceContext();

	const can = useCallback(
		(permission: TPermissionCheck, mode: TPermissionMode = 'any') =>
			workspaceAllows(activeWorkspace, permission, mode),
		[activeWorkspace],
	);

	const role: TWorkspaceRole | null = activeWorkspace?.role ?? null;

	return { can, role, isOwner: role === 'owner' };
};

export default usePermission;
