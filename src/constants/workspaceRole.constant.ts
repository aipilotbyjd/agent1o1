import type { TAssignableWorkspaceRole, TWorkspaceRole } from '@/types/workspace.type';

/** How each workspace role is named across the app. */
export const WORKSPACE_ROLE_LABELS: Record<TWorkspaceRole, string> = {
	owner: 'Owner',
	admin: 'Admin',
	editor: 'Editor',
	member: 'Member',
	viewer: 'Viewer',
};

/** What each role can do, matching the backend's role grants. */
export const WORKSPACE_ROLE_DESCRIPTIONS: Record<TWorkspaceRole, string> = {
	owner: 'Full access, including deleting the workspace.',
	admin: 'Can manage members, billing, apps, and settings.',
	editor: 'Can build and publish workflows, agents, and pages.',
	member: 'Can view everything, run workflows, and chat with agents.',
	viewer: 'Read-only access to the workspace.',
};

/** Roles offered when inviting or changing a member, most access first. */
export const ASSIGNABLE_WORKSPACE_ROLES: TAssignableWorkspaceRole[] = [
	'admin',
	'editor',
	'member',
	'viewer',
];

export const formatWorkspaceRole = (role?: TWorkspaceRole | null) =>
	role ? WORKSPACE_ROLE_LABELS[role] : '';
