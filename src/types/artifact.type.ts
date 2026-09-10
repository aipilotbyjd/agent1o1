// ============================================================
// Artifact Types
// ------------------------------------------------------------
// A file a member uploaded or an agent exported. `group_id` ties
// versions of the same logical file together; `agent` is null for
// a plain member upload. `preview_url` is a short-lived signed
// URL, present only when the file type is previewable.
// ============================================================
import type { TUser } from './auth.type';

export type TArtifactGeneralAccess = 'restricted' | 'organization' | 'anyone';

export type TArtifactVersionSummary = {
	id: string;
	version: number;
	size: number;
	created_at: string;
};

export type TArtifactShare = {
	user_id: string;
	user: TUser | null;
};

export type TArtifact = {
	id: string;
	group_id: string;
	version: number;
	filename: string;
	mime_type: string;
	size: number;
	agent: { id: string; name: string } | null;
	creator: TUser | null;
	preview_url: string | null;
	general_access: TArtifactGeneralAccess;
	shared_with?: TArtifactShare[];
	versions_count?: number;
	versions?: TArtifactVersionSummary[];
	created_at: string;
	updated_at: string;
};

/** Sent as `multipart/form-data` — the service builds the `FormData`. */
export type TUploadArtifactDto = {
	file: File;
	filename?: string;
	agent_id?: string | null;
	group_id?: string | null;
	metadata?: Record<string, unknown> | null;
};

export type TUpdateArtifactAccessDto = {
	general_access: TArtifactGeneralAccess;
};

export type TShareArtifactDto = {
	user_id: string;
};
