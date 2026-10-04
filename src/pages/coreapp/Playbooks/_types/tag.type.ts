/**
 * Tag Types
 * Matches Laravel TagResource
 */

export interface ITag {
	id: string;
	name: string;
	color: string | null;
	workflows_count?: number;
	created_at: string;
	updated_at: string;
}

// POST /workspaces/{id}/tags
export interface ICreateTagDto {
	name: string;
	color?: string;
}

// PUT /workspaces/{id}/tags/{id}
export interface IUpdateTagDto {
	name?: string;
	color?: string;
}

// POST/DELETE /workspaces/{id}/tags/{id}/workflows
export interface ITagWorkflowsDto {
	workflow_ids: string[];
}
