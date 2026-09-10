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
};

export type TUpdateAgentSkillDto = Partial<TCreateAgentSkillDto>;

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
