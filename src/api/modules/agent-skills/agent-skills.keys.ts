import { createKeys } from '@/api/core';

export const agentSkillKeys = createKeys('agent-skills');

// Nested under a skill, so keys carry the skill id alongside the workspace.
export const skillReferenceKeys = {
	list: (ws: string, skillId: string) => ['agent-skills', ws, skillId, 'references'] as const,
};

export const skillScriptKeys = {
	list: (ws: string, skillId: string) => ['agent-skills', ws, skillId, 'scripts'] as const,
};
