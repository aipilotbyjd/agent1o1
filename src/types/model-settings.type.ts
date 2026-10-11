// ============================================================
// Workspace Model Settings
// ------------------------------------------------------------
// The model new agents, skills and workflow AI steps start on, and —
// when set — the only catalog models members may pick (null = all).
// ============================================================

export type TWorkspaceModelSettings = {
	default_model_catalog_id: string | null;
	allowed_model_catalog_ids: string[] | null;
	can_manage: boolean;
};

export type TUpdateWorkspaceModelSettingsDto = {
	default_model_catalog_id?: string | null;
	allowed_model_catalog_ids?: string[] | null;
};

export type TModelTrial = {
	text: string;
	duration_ms: number;
	prompt_tokens: number;
	completion_tokens: number;
	credits: number;
	served_by_own_key: boolean;
};
