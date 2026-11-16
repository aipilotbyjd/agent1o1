import { useCallback } from 'react';
import { useWorkspaceContext } from '@/context/workspace';
import type { TPermission, TPermissionCheck, TPermissionMode } from '@/types/permission.type';
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

	/** Whether a page, nav entry or search result that may declare a `permission` is open to the viewer. */
	const canOpen = useCallback(
		(target: { permission?: TPermission }) => !target.permission || can(target.permission),
		[can],
	);

	const role: TWorkspaceRole | null = activeWorkspace?.role ?? null;

	return { can, canOpen, role, isOwner: role === 'owner' };
};

export default usePermission;
