import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TAgentToolBinding, TCreateAgentToolBindingDto } from '@/types/agent.type';
import type { TWorkflow } from '@/types/workflow.type';
import type { TAgentSkill } from '@/types/agent-skill.type';
import {
	AgentToolBindingEndpoints as TB,
	AgentWorkflowToolEndpoints as WF,
	AgentSkillAttachmentEndpoints as SK,
} from './agents.endpoints';

export const AgentToolBindingService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ tool_bindings: TAgentToolBinding[] }>>(TB.list(ws, agentId), { signal })
			.then(unwrapKey<TAgentToolBinding[]>('tool_bindings')),

	create: (ws: string, agentId: string, payload: TCreateAgentToolBindingDto) =>
		axiosClient
			.post<TApiResponse<{ tool_binding: TAgentToolBinding }>>(TB.create(ws, agentId), payload)
			.then(unwrapKey<TAgentToolBinding>('tool_binding')),

	remove: (ws: string, agentId: string, id: string) =>
		axiosClient.delete(TB.delete(ws, agentId, id)).then(() => undefined),
};

export const AgentWorkflowToolService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workflows: TWorkflow[] }>>(WF.list(ws, agentId), { signal })
			.then(unwrapKey<TWorkflow[]>('workflows')),

	attach: (ws: string, agentId: string, workflowId: string) =>
		axiosClient
			.post<TApiResponse<{ workflows: TWorkflow[] }>>(WF.attach(ws, agentId, workflowId))
			.then(unwrapKey<TWorkflow[]>('workflows')),

	detach: (ws: string, agentId: string, workflowId: string) =>
		axiosClient.delete(WF.detach(ws, agentId, workflowId)).then(() => undefined),
};

export const AgentSkillAttachmentService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ skills: TAgentSkill[] }>>(SK.list(ws, agentId), { signal })
			.then(unwrapKey<TAgentSkill[]>('skills')),

	attach: (ws: string, agentId: string, skillId: string) =>
		axiosClient
			.post<TApiResponse<{ skills: TAgentSkill[] }>>(SK.attach(ws, agentId, skillId))
			.then(unwrapKey<TAgentSkill[]>('skills')),

	detach: (ws: string, agentId: string, skillId: string) =>
		axiosClient.delete(SK.detach(ws, agentId, skillId)).then(() => undefined),
};
