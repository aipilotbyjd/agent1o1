export type TTag = {
	id: string;
	workspace_id: string;
	name: string;
	color: string | null;
	/** Present only when the endpoint eager-counts them. */
	workflow_count?: number;
	agent_count?: number;
	created_at: string;
};

export type TCreateTagDto = {
	name: string;
	color?: string | null;
};

export type TUpdateTagDto = {
	name?: string;
	color?: string | null;
};

export type TSyncTagsDto = {
	tag_ids: string[];
};
