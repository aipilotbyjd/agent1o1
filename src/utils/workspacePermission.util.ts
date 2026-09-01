import type { TWorkspaceRole } from '@/types/workspace.type';

export type TWorkspacePermission =
	| 'workspace.view'
	| 'workspace.update'
	| 'workspace.delete'
	| 'member.view'
	| 'member.invite'
	| 'member.update-role'
	| 'member.remove'
	| 'invitation.view';

const VIEWER_GRANTS: TWorkspacePermission[] = ['workspace.view', 'member.view', 'invitation.view'];
const MEMBER_GRANTS: TWorkspacePermission[] = [];
const EDITOR_GRANTS: TWorkspacePermission[] = [];
const ADMIN_GRANTS: TWorkspacePermission[] = [
	'workspace.update',
	'member.invite',
	'member.update-role',
	'member.remove',
];
const OWNER_GRANTS: TWorkspacePermission[] = ['workspace.delete'];

const MEMBER = [...VIEWER_GRANTS, ...MEMBER_GRANTS];
const EDITOR = [...MEMBER, ...EDITOR_GRANTS];
const ADMIN = [...EDITOR, ...ADMIN_GRANTS];
const OWNER = [...ADMIN, ...OWNER_GRANTS];

const ROLE_PERMISSIONS: Record<TWorkspaceRole, TWorkspacePermission[]> = {
	viewer: VIEWER_GRANTS,
	member: MEMBER,
	editor: EDITOR,
	admin: ADMIN,
	owner: OWNER,
};

export const hasWorkspacePermission = (
	role: TWorkspaceRole | null | undefined,
	permission: TWorkspacePermission,
): boolean => !!role && ROLE_PERMISSIONS[role].includes(permission);
