import type { TUser } from './auth.type';

export type TWorkspaceRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer';

export type TWorkspace = {
	id: string;
	name: string;
	slug: string;
	avatar: string | null;
	owner_id: string;
	// Only present when the backend eager-loads it (whenLoaded) — the list endpoint doesn't.
	owner?: TUser;
	// The requesting user's role in this workspace. Always present on
	// list/create/show/update; absent anywhere the backend doesn't resolve it.
	role?: TWorkspaceRole;
	created_at: string;
	updated_at: string;
};

export type TWorkspaceMember = {
	id: string;
	workspace_id: string;
	user_id: string;
	role: TWorkspaceRole;
	invited_by: string | null;
	joined_at: string | null;
	user?: TUser;
};

export type TWorkspaceInvitation = {
	id: string;
	workspace_id: string;
	email: string;
	role: TWorkspaceRole;
	invited_by: string | null;
	expires_at: string;
	accepted_at: string | null;
	created_at: string;
};

export type TCreateWorkspaceDto = {
	name: string;
};

export type TUpdateWorkspaceDto = {
	name?: string;
};

export type TInviteMemberDto = {
	email: string;
	role: TWorkspaceRole;
};

export type TUpdateMemberRoleDto = {
	role: TWorkspaceRole;
};
