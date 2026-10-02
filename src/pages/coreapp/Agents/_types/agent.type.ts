export type TAgent = {
	id: string;
	name: string;
	description: string;
	model: string;
	system_prompt: string;
	temperature: number;
	max_tokens?: number;
	is_active: boolean;
	skills_count: number;
	conversations_count: number;
	skills?: TAgentSkill[];
	created_at: number;
	updated_at: number;
};

export type TAgentSkill = {
	id: string;
	name: string;
	type: 'api_call' | 'vector_search' | 'workflow' | 'script';
	description: string;
	config: Record<string, unknown>;
	created_at: number;
};

export type TAgentConversation = {
	id: string;
	session_id: string;
	messages_count: number;
	started_at: number;
	last_message_at: number;
};

export type TAgentMessage = {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	created_at: number;
};

export type TSendAgentMessageDto = {
	content: string;
	metadata?: Record<string, unknown>;
};

export type TAgentTriggerType = 'cron' | 'webhook' | 'event';

export type TAgentTrigger = {
	id: string;
	agent_id: string;
	type: TAgentTriggerType;
	name: string;
	config: Record<string, unknown>;
	is_active: boolean;
	created_at: number;
	updated_at: number;
};

export type TAgentSkillReference = {
	id: string;
	skill_id: string;
	url?: string;
	title: string;
	type: string;
	created_at: number;
};

export type TAgentSkillScript = {
	id: string;
	skill_id: string;
	name: string;
	language: string;
	source: string;
	created_at: number;
	updated_at: number;
};

export type TAgentSortBy = 'name' | 'created_at' | 'updated_at' | 'conversations_count';
export type TSortOrder = 'asc' | 'desc';
