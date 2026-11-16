import { useCallback } from 'react';
import { useWorkspaceContext } from '@/context/workspace';
import type { TPermission } from '@/types/permission.type';
import type { TWorkspace, TWorkspaceRole } from '@/types/workspace.type';

export type TPermissionCheck = TPermission | TPermission[];

/**
 * Whether a workspace grants a permission. An array passes when any one of
 * them is granted, unless `mode` is `all`.
 */
export const workspaceAllows = (
	workspace: Pick<TWorkspace, 'permissions'> | null | undefined,
	permission: TPermissionCheck,
	mode: 'any' | 'all' = 'any',
): boolean => {
	const granted = workspace?.permissions ?? [];
	const required = Array.isArray(permission) ? permission : [permission];
	if (required.length === 0) return true;
	return mode === 'all'
		? required.every((item) => granted.includes(item))
		: required.some((item) => granted.includes(item));
};

/**
 * Permission checks against the active workspace. The backend still enforces
 * every rule: these only decide what the UI offers.
 */
export const usePermission = () => {
	const { activeWorkspace } = useWorkspaceContext();

	const can = useCallback(
		(permission: TPermissionCheck, mode: 'any' | 'all' = 'any') =>
			workspaceAllows(activeWorkspace, permission, mode),
		[activeWorkspace],
	);

	const role: TWorkspaceRole | null = activeWorkspace?.role ?? null;

	return { can, role, isOwner: role === 'owner' };
};

/** Shorthand for a single check in a component. */
export const useCan = (permission: TPermissionCheck, mode: 'any' | 'all' = 'any'): boolean => {
	const { activeWorkspace } = useWorkspaceContext();
	return workspaceAllows(activeWorkspace, permission, mode);
};

export default usePermission;
