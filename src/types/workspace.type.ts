// ============================================================
// Workspace Types
// ------------------------------------------------------------
// `role` is the viewer's own role on this workspace — set from the
// membership pivot (or `owner` on the workspace the caller just
// created), not a fixed workspace attribute.
// ============================================================
import type { TUser } from './auth.type';

export type TWorkspaceRole = 'owner' | 'admin' | 'member';

/** Roles grantable via invite or role-update. Owner is derived from
 *  workspace ownership and can never be assigned directly. */
export type TAssignableWorkspaceRole = Exclude<TWorkspaceRole, 'owner'>;

export type TWorkspace = {
	id: string;
	name: string;
	slug: string;
	avatar: string | null;
	owner_id: string;
	owner: TUser | null;
	role: TWorkspaceRole | null;
	created_at: string;
	updated_at: string;
};

// ─── Request DTOs ────────────────────────────────────────────

export type TCreateWorkspaceDto = {
	name: string;
};

export type TUpdateWorkspaceDto = {
	name?: string;
};
