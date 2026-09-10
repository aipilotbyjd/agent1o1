import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateWorkflowTemplateDto,
	TUpdateWorkflowTemplateDto,
	TUseWorkflowTemplateDto,
	TSaveWorkflowAsTemplateDto,
	TCreateAgentTemplateDto,
	TUpdateAgentTemplateDto,
	TUseAgentTemplateDto,
	TSaveAgentAsTemplateDto,
	TCreateTemplateCollectionDto,
	TUpdateTemplateCollectionDto,
	TUseTemplateCollectionDto,
	TAddTemplateCollectionItemDto,
	TReorderTemplateCollectionItemsDto,
} from '@/types/template.type';
import {
	WorkflowTemplateService,
	AgentTemplateService,
	TemplateCollectionService,
} from './templates.service';
import { workflowTemplateKeys, agentTemplateKeys, templateCollectionKeys } from './templates.keys';
import { workflowKeys } from '../workflows/workflows.keys';
import { agentKeys } from '../agents/agents.keys';

// ─── Workflow templates ────────────────────────────────────────

export const useWorkflowTemplates = (ws: string) =>
	useQuery({
		queryKey: workflowTemplateKeys.lists(ws),
		queryFn: ({ signal }) => WorkflowTemplateService.list(ws, signal),
		enabled: !!ws,
	});

export const useWorkflowTemplate = (ws: string, id: string) =>
	useQuery({
		queryKey: workflowTemplateKeys.detail(ws, id),
		queryFn: ({ signal }) => WorkflowTemplateService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateWorkflowTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateWorkflowTemplateDto) => WorkflowTemplateService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create workflow template' },
	});
};

export const useUpdateWorkflowTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateWorkflowTemplateDto }) =>
			WorkflowTemplateService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update workflow template' },
	});
};

export const useDeleteWorkflowTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowTemplateService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete workflow template' },
	});
};

export const useUseWorkflowTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body?: TUseWorkflowTemplateDto }) =>
			WorkflowTemplateService.use(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create workflow from template' },
	});
};

export const useSaveWorkflowAsTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ workflowId, body }: { workflowId: string; body?: TSaveWorkflowAsTemplateDto }) =>
			WorkflowTemplateService.saveWorkflowAsTemplate(ws, workflowId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to save workflow as template' },
	});
};

// ─── Agent templates ───────────────────────────────────────────

export const useAgentTemplates = (ws: string) =>
	useQuery({
		queryKey: agentTemplateKeys.lists(ws),
		queryFn: ({ signal }) => AgentTemplateService.list(ws, signal),
		enabled: !!ws,
	});

export const useAgentTemplate = (ws: string, id: string) =>
	useQuery({
		queryKey: agentTemplateKeys.detail(ws, id),
		queryFn: ({ signal }) => AgentTemplateService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateAgentTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentTemplateDto) => AgentTemplateService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create agent template' },
	});
};

export const useUpdateAgentTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAgentTemplateDto }) =>
			AgentTemplateService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update agent template' },
	});
};

export const useDeleteAgentTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentTemplateService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete agent template' },
	});
};

export const useUseAgentTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body?: TUseAgentTemplateDto }) =>
			AgentTemplateService.use(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create agent from template' },
	});
};

export const useSaveAgentAsTemplate = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ agentId, body }: { agentId: string; body?: TSaveAgentAsTemplateDto }) =>
			AgentTemplateService.saveAgentAsTemplate(ws, agentId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentTemplateKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to save agent as template' },
	});
};

// ─── Template collections ──────────────────────────────────────

export const useTemplateCollections = (ws: string) =>
	useQuery({
		queryKey: templateCollectionKeys.lists(ws),
		queryFn: ({ signal }) => TemplateCollectionService.list(ws, signal),
		enabled: !!ws,
	});

export const useTemplateCollection = (ws: string, id: string) =>
	useQuery({
		queryKey: templateCollectionKeys.detail(ws, id),
		queryFn: ({ signal }) => TemplateCollectionService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateTemplateCollection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateTemplateCollectionDto) => TemplateCollectionService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create collection' },
	});
};

export const useUpdateTemplateCollection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateTemplateCollectionDto }) =>
			TemplateCollectionService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update collection' },
	});
};

export const useDeleteTemplateCollection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TemplateCollectionService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete collection' },
	});
};

export const useUseTemplateCollection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body?: TUseTemplateCollectionDto }) =>
			TemplateCollectionService.use(ws, id, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: agentKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to create from collection' },
	});
};

export const useAddTemplateCollectionItem = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TAddTemplateCollectionItemDto) =>
			TemplateCollectionService.addItem(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to add item to collection' },
	});
};

export const useReorderTemplateCollectionItems = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TReorderTemplateCollectionItemsDto) =>
			TemplateCollectionService.reorderItems(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to reorder items' },
	});
};

export const useRemoveTemplateCollectionItem = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (itemId: string) => TemplateCollectionService.removeItem(ws, id, itemId),
		onSuccess: () => qc.invalidateQueries({ queryKey: templateCollectionKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to remove item from collection' },
	});
};
