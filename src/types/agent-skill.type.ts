// ============================================================
// Agent Skill Types
// ------------------------------------------------------------
// A skill bundles instructions plus optional reference docs and
// executable scripts an agent can call on. References and scripts
// are nested under a skill, not independent workspace resources.
// ============================================================

export type TAgentSkill = {
	id: string;
	workspace_id: string;
	created_by: string;
	name: string;
	slug: string;
	description: string | null;
	category: string | null;
	icon: string | null;
	color: string | null;
	tags: string[] | null;
	instructions: string;
	is_shared: boolean;
	version: number;
	/** Set when the skill is synced from GitHub — then it's read-only here. */
	skill_source_id: string | null;
	source_path: string | null;
	source_url: string | null;
	created_at: string;
	updated_at: string;
};

export type TCreateAgentSkillDto = {
	name: string;
	slug?: string;
	description?: string | null;
	category?: string | null;
	icon?: string | null;
	color?: string | null;
	tags?: string[] | null;
	instructions: string;
	is_shared?: boolean;
	/** Saved together with the skill, in order — `skills.store` only. */
	references?: TSkillDraftReference[];
	scripts?: TSkillDraftScript[];
};

export type TUpdateAgentSkillDto = Partial<Omit<TCreateAgentSkillDto, 'references' | 'scripts'>>;

export type TDraftSkillDto = {
	prompt: string;
	model_catalog_id: string;
};

export type TSkillDraftReference = {
	title: string;
	content: string;
};

export type TSkillDraftScript = {
	name: string;
	description: string | null;
	language: string;
	code: string;
};

/** What `skills.draft` returns — unsaved; the drawer saves it via `skills.store`. */
export type TSkillDraft = {
	name: string;
	description: string;
	category: string;
	icon: string;
	color: string;
	tags: string[];
	instructions: string;
	references: TSkillDraftReference[];
	scripts: TSkillDraftScript[];
};

export type TAgentSkillReference = {
	id: string;
	skill_id: string;
	title: string;
	content: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type TCreateSkillReferenceDto = {
	title: string;
	content: string;
	sort_order?: number;
};

export type TUpdateSkillReferenceDto = Partial<TCreateSkillReferenceDto>;

export type TAgentSkillScript = {
	id: string;
	skill_id: string;
	name: string;
	description: string;
	language: string;
	code: string;
	is_enabled: boolean;
	created_at: string;
	updated_at: string;
};

export type TCreateSkillScriptDto = {
	name: string;
	description: string;
	language?: string;
	code: string;
	is_enabled?: boolean;
};

export type TUpdateSkillScriptDto = Partial<TCreateSkillScriptDto>;

// ============================================================
// Skill sources — GitHub repositories skills are synced from
// ============================================================

export type TSkillSourceStatus = 'pending' | 'syncing' | 'ready' | 'failed';

export type TSkillSource = {
	id: string;
	repo: string;
	branch: string | null;
	path: string | null;
	url: string;
	is_shared: boolean;
	credential_id: string | null;
	account: string | null;
	status: TSkillSourceStatus;
	last_error: string | null;
	last_commit_sha: string | null;
	last_synced_at: string | null;
	skills_count: number;
	created_at: string;
};

export type TCreateSkillSourceDto = {
	/** `owner/name`, or any GitHub link to it — a folder link also sets branch and path. */
	repo: string;
	branch?: string | null;
	path?: string | null;
	/** Omitted: the member's GitHub account if they have one, else anonymous (public repos). */
	credential_id?: string | null;
	is_shared?: boolean;
};

/** What a repository holds, read before connecting it. */
export type TSkillSourcePreview = {
	repo: string;
	branch: string;
	path: string | null;
	commit_sha: string;
	skills: { path: string; name: string; description: string | null }[];
};

export type TPreviewSkillSourceDto = Pick<
	TCreateSkillSourceDto,
	'repo' | 'branch' | 'path' | 'credential_id'
>;
