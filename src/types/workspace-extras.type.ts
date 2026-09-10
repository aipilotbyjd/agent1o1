// ============================================================
// Workspace Extras
// ------------------------------------------------------------
// Membership and invitations — the only workspace-scoped
// sub-resources besides the workspace record itself, notification
// channels/preferences (notification.type.ts), and billing.
// ============================================================
import type { TUser } from './auth.type';
import type { TWorkspaceRole, TAssignableWorkspaceRole } from './workspace.type';

// ─── Members ─────────────────────────────────────────────────

export type TWorkspaceMember = {
	id: string;
	workspace_id: string;
	user_id: string;
	role: TWorkspaceRole;
	invited_by: string | null;
	joined_at: string | null;
	user: TUser | null;
};

export type TUpdateMemberRoleDto = {
	role: TAssignableWorkspaceRole;
};

// ─── Invitations ─────────────────────────────────────────────

export type TWorkspaceInvitation = {
	id: string;
	workspace_id: string;
	email: string;
	role: TWorkspaceRole;
	invited_by: string;
	expires_at: string;
	accepted_at: string | null;
	created_at: string;
};

export type TInviteMemberDto = {
	email: string;
	role: TAssignableWorkspaceRole;
};
