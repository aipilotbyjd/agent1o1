import type { TPermissionCheck, TPermissionMode } from '@/types/permission.type';
import type { TWorkspace } from '@/types/workspace.type';

/**
 * Whether a workspace grants a permission. An array passes when any one of
 * them is granted, unless `mode` is `all`.
 */
export const workspaceAllows = (
	workspace: Pick<TWorkspace, 'permissions'> | null | undefined,
	permission: TPermissionCheck,
	mode: TPermissionMode = 'any',
): boolean => {
	const granted = workspace?.permissions ?? [];
	const required = Array.isArray(permission) ? permission : [permission];
	if (required.length === 0) return true;
	return mode === 'all'
		? required.every((item) => granted.includes(item))
		: required.some((item) => granted.includes(item));
};
