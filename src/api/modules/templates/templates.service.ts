import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TWorkflowTemplate,
	TCreateWorkflowTemplateDto,
	TUpdateWorkflowTemplateDto,
	TUseWorkflowTemplateDto,
	TSaveWorkflowAsTemplateDto,
	TAgentTemplate,
	TCreateAgentTemplateDto,
	TUpdateAgentTemplateDto,
	TUseAgentTemplateDto,
	TSaveAgentAsTemplateDto,
	TTemplateCollection,
	TCreateTemplateCollectionDto,
	TUpdateTemplateCollectionDto,
	TUseTemplateCollectionDto,
	TAddTemplateCollectionItemDto,
	TReorderTemplateCollectionItemsDto,
	TTemplateCollectionItem,
} from '@/types/template.type';
import type { TWorkflow } from '@/types/workflow.type';
import type { TAgent } from '@/types/agent.type';
import {
	WorkflowTemplateEndpoints as WT,
	AgentTemplateEndpoints as AT,
	TemplateCollectionEndpoints as TC,
} from './templates.endpoints';

export const WorkflowTemplateService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workflow_templates: TWorkflowTemplate[] }>>(WT.list(ws), { signal })
			.then(unwrapKey<TWorkflowTemplate[]>('workflow_templates')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ workflow_template: TWorkflowTemplate }>>(WT.detail(ws, id), { signal })
			.then(unwrapKey<TWorkflowTemplate>('workflow_template')),

	create: (ws: string, payload: TCreateWorkflowTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ workflow_template: TWorkflowTemplate }>>(WT.create(ws), payload)
			.then(unwrapKey<TWorkflowTemplate>('workflow_template')),

	update: (ws: string, id: string, payload: TUpdateWorkflowTemplateDto) =>
		axiosClient
			.patch<TApiResponse<{ workflow_template: TWorkflowTemplate }>>(WT.update(ws, id), payload)
			.then(unwrapKey<TWorkflowTemplate>('workflow_template')),

	remove: (ws: string, id: string) => axiosClient.delete(WT.delete(ws, id)).then(() => undefined),

	use: (ws: string, id: string, payload?: TUseWorkflowTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(WT.use(ws, id), payload)
			.then(unwrapKey<TWorkflow>('workflow')),

	saveWorkflowAsTemplate: (ws: string, workflowId: string, payload?: TSaveWorkflowAsTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ workflow_template: TWorkflowTemplate }>>(
				WT.saveWorkflowAsTemplate(ws, workflowId),
				payload,
			)
			.then(unwrapKey<TWorkflowTemplate>('workflow_template')),
};

export const AgentTemplateService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ agent_templates: TAgentTemplate[] }>>(AT.list(ws), { signal })
			.then(unwrapKey<TAgentTemplate[]>('agent_templates')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ agent_template: TAgentTemplate }>>(AT.detail(ws, id), { signal })
			.then(unwrapKey<TAgentTemplate>('agent_template')),

	create: (ws: string, payload: TCreateAgentTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ agent_template: TAgentTemplate }>>(AT.create(ws), payload)
			.then(unwrapKey<TAgentTemplate>('agent_template')),

	update: (ws: string, id: string, payload: TUpdateAgentTemplateDto) =>
		axiosClient
			.patch<TApiResponse<{ agent_template: TAgentTemplate }>>(AT.update(ws, id), payload)
			.then(unwrapKey<TAgentTemplate>('agent_template')),

	remove: (ws: string, id: string) => axiosClient.delete(AT.delete(ws, id)).then(() => undefined),

	use: (ws: string, id: string, payload?: TUseAgentTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ agent: TAgent }>>(AT.use(ws, id), payload)
			.then(unwrapKey<TAgent>('agent')),

	saveAgentAsTemplate: (ws: string, agentId: string, payload?: TSaveAgentAsTemplateDto) =>
		axiosClient
			.post<TApiResponse<{ agent_template: TAgentTemplate }>>(
				AT.saveAgentAsTemplate(ws, agentId),
				payload,
			)
			.then(unwrapKey<TAgentTemplate>('agent_template')),
};

export const TemplateCollectionService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ template_collections: TTemplateCollection[] }>>(TC.list(ws), { signal })
			.then(unwrapKey<TTemplateCollection[]>('template_collections')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ template_collection: TTemplateCollection }>>(TC.detail(ws, id), { signal })
			.then(unwrapKey<TTemplateCollection>('template_collection')),

	create: (ws: string, payload: TCreateTemplateCollectionDto) =>
		axiosClient
			.post<TApiResponse<{ template_collection: TTemplateCollection }>>(TC.create(ws), payload)
			.then(unwrapKey<TTemplateCollection>('template_collection')),

	update: (ws: string, id: string, payload: TUpdateTemplateCollectionDto) =>
		axiosClient
			.patch<TApiResponse<{ template_collection: TTemplateCollection }>>(TC.update(ws, id), payload)
			.then(unwrapKey<TTemplateCollection>('template_collection')),

	remove: (ws: string, id: string) => axiosClient.delete(TC.delete(ws, id)).then(() => undefined),

	use: (ws: string, id: string, payload?: TUseTemplateCollectionDto) =>
		axiosClient
			.post<TApiResponse<{ workflows: TWorkflow[]; agents: TAgent[] }>>(TC.use(ws, id), payload)
			.then((r) => r.data.data),

	addItem: (ws: string, id: string, payload: TAddTemplateCollectionItemDto) =>
		axiosClient
			.post<TApiResponse<{ item: TTemplateCollectionItem }>>(TC.addItem(ws, id), payload)
			.then(unwrapKey<TTemplateCollectionItem>('item')),

	reorderItems: (ws: string, id: string, payload: TReorderTemplateCollectionItemsDto) =>
		axiosClient.patch(TC.reorderItems(ws, id), payload).then(() => undefined),

	removeItem: (ws: string, id: string, itemId: string) =>
		axiosClient.delete(TC.removeItem(ws, id, itemId)).then(() => undefined),
};
