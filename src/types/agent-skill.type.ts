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
	/** Set when the skill is synced from GitHub — read-only unless two-way sync is enabled. */
	skill_source_id: string | null;
	source_two_way: boolean;
	source_path: string | null;
	source_url: string | null;
	origin_url: string | null;
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

export type TSkillSourceStatus =
	| 'pending'
	| 'syncing'
	| 'ready'
	| 'failed'
	| 'conflict'
	| 'forking'
	| 'cannot_publish';

export type TSkillSourceConflict = {
	path: string;
	base: Record<string, string> | null;
	local: Record<string, string> | null;
	remote: Record<string, string> | null;
	commit_sha: string;
	resolution?: 'local' | 'remote' | 'merged';
	merged?: Record<string, string>;
};
export type TUpdateSkillSourceDto = {
	two_way: boolean;
	branch?: string;
	credential_id?: string | null;
};
export type TExportSkillDto = { skill_id: string; path: string };
export type TResolveSkillSourceDto = Pick<TSkillSourceConflict, 'path' | 'commit_sha'> & {
	resolution: 'local' | 'remote' | 'merged';
	files?: Record<string, string>;
};

export type TRepositoryAccess = {
	repo: string;
	branch: string;
	private: boolean;
	can_push: boolean;
	reason: string | null;
	parent_repo: string | null;
};
export type TPublishSkillDto = {
	repo: string;
	branch: string;
	credential_id: string;
	path: string;
	keep_synced: boolean;
};
export type TSkillUpstream = {
	repo: string;
	fork_sha: string;
	upstream_sha: string;
	commits_ahead: number;
	files: { path: string; status: string; patch: string | null }[];
	files_truncated: boolean;
};
export type TSkillSource = {
	pending_changes: string[];
	publish_once: boolean;
	repository_private: boolean | null;
	upstream_repo: string | null;
	upstream_branch: string | null;
	fork_request: { repo: string } | null;
	two_way: boolean;
	conflicts: TSkillSourceConflict[];
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
	two_way?: boolean;
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
