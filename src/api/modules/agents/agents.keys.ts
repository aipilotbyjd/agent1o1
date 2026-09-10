import { createKeys } from '@/api/core';

export const agentKeys = createKeys('agents');

export const agentSessionKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'sessions'] as const,
	detail: (ws: string, agentId: string, id: string) => ['agents', ws, agentId, 'sessions', id] as const,
};

export const agentVersionKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'versions'] as const,
	detail: (ws: string, agentId: string, version: number) =>
		['agents', ws, agentId, 'versions', version] as const,
};

export const agentToolBindingKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'tool-bindings'] as const,
};

export const agentWorkflowToolKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'workflows'] as const,
};

export const agentSkillAttachmentKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'skills'] as const,
};

export const agentKnowledgeKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'knowledge'] as const,
};

export const agentKnowledgeSourceKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'knowledge-sources'] as const,
};

export const agentMemoryKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'memories'] as const,
};

export const agentEvalKeys = {
	suites: (ws: string, agentId: string) => ['agents', ws, agentId, 'eval-suites'] as const,
	suite: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId] as const,
	cases: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'cases'] as const,
	runs: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'runs'] as const,
	run: (ws: string, agentId: string, suiteId: string, runId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'runs', runId] as const,
};

export const agentReflectionKeys = {
	settings: (ws: string, agentId: string) => ['agents', ws, agentId, 'reflection-settings'] as const,
	runs: (ws: string, agentId: string) => ['agents', ws, agentId, 'reflection-runs'] as const,
	run: (ws: string, agentId: string, runId: string) =>
		['agents', ws, agentId, 'reflection-runs', runId] as const,
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'reflections'] as const,
	detail: (ws: string, agentId: string, id: string) => ['agents', ws, agentId, 'reflections', id] as const,
};

export const agentEvaluationKeys = {
	settings: (ws: string, agentId: string) => ['agents', ws, agentId, 'evaluation-settings'] as const,
	sessionEvaluations: (ws: string, agentId: string, params?: { grade?: string; page?: number }) =>
		['agents', ws, agentId, 'session-evaluations', params ?? {}] as const,
	sessionEvaluation: (ws: string, agentId: string, id: string) =>
		['agents', ws, agentId, 'session-evaluations', id] as const,
};
