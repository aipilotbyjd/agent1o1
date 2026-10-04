// Folder entity for organizing workflows
export interface IFolder {
	id: string;
	name: string;
	color: string;
	icon: string;
	workspace_id: string;
	parent_id: string | null;
	workflow_count: number;
	created_at: number;
	updated_at: number;
}

// Create folder request
export interface ICreateFolderDto {
	name: string;
	color?: string;
	icon?: string;
	parent_id?: string;
}

// Update folder request
export interface IUpdateFolderDto {
	name?: string;
	color?: string;
	icon?: string;
	parent_id?: string;
}

// Folder colors
export const FOLDER_COLORS = [
	{ value: '#3b82f6', label: 'Blue' },
	{ value: '#10b981', label: 'Green' },
	{ value: '#8b5cf6', label: 'Purple' },
	{ value: '#f59e0b', label: 'Yellow' },
	{ value: '#ef4444', label: 'Red' },
	{ value: '#ec4899', label: 'Pink' },
	{ value: '#06b6d4', label: 'Cyan' },
	{ value: '#f97316', label: 'Orange' },
	{ value: '#6366f1', label: 'Indigo' },
	{ value: '#14b8a6', label: 'Teal' },
	{ value: '#d946ef', label: 'Fuchsia' },
	{ value: '#84cc16', label: 'Lime' },
	{ value: '#64748b', label: 'Slate' },
	{ value: '#eab308', label: 'Gold' },
] as const;

// Folder icons
export const FOLDER_ICONS = [
	{ value: 'Folder02', label: 'Folder' },
	{ value: 'Mail01', label: 'Mail' },
	{ value: 'UserAdd01', label: 'Users' },
	{ value: 'Link01', label: 'Link' },
	{ value: 'Analytics01', label: 'Analytics' },
	{ value: 'Settings02', label: 'Settings' },
	{ value: 'Code', label: 'Code' },
	{ value: 'Api', label: 'API' },
] as const;
