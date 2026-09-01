import type { TUser } from './auth.type';

export type TWorkspace = {
	id: string;
	name: string;
	slug: string;
	avatar: string | null;
	owner_id: string;
	// Only present when the backend eager-loads it (whenLoaded) — the list endpoint doesn't.
	owner?: TUser;
	created_at: string;
	updated_at: string;
};

export type TCreateWorkspaceDto = {
	name: string;
};
