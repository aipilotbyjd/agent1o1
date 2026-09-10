// ============================================================
// Folder Types
// ------------------------------------------------------------
// One folder tree per `type` — a workflow folder and an agent
// folder are distinct trees even if named alike. The list endpoint
// eager-loads `children` one level deep.
// ============================================================

export type TFolderType = 'workflow' | 'agent';

export type TFolder = {
	id: string;
	workspace_id: string;
	type: TFolderType;
	parent_id: string | null;
	name: string;
	color: string | null;
	position: number;
	children: TFolder[];
	/** Present only when the endpoint eager-counts them. */
	workflow_count?: number;
	agent_count?: number;
	created_at: string;
};

export type TCreateFolderDto = {
	type: TFolderType;
	name: string;
	parent_id?: string | null;
	color?: string | null;
	position?: number;
};

export type TUpdateFolderDto = {
	name?: string;
	parent_id?: string | null;
	color?: string | null;
	position?: number;
};

export type TMoveWorkflowsDto = {
	workflow_ids: string[];
	folder_id: string | null;
};

export type TMoveAgentsDto = {
	agent_ids: string[];
	folder_id: string | null;
};
