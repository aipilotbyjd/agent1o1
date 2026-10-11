import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TCreateWorkflowPageDto, TUpdateWorkflowPageDto, TWorkflowPage } from '@/types/workflow-page.type';
import { WorkflowPageService } from './workflow-pages.service';

export const workflowPageKeys = {
	all: (ws: string) => ['workspaces', ws, 'pages'] as const,
	list: (ws: string, workflowId?: string) =>
		['workspaces', ws, 'pages', 'list', workflowId ?? 'all'] as const,
	detail: (ws: string, id: string) => ['workspaces', ws, 'pages', 'detail', id] as const,
	view: (ws: string, id: string) => ['workspaces', ws, 'pages', 'view', id] as const,
	submissions: (ws: string, id: string) => ['workspaces', ws, 'pages', 'submissions', id] as const,
};

export const useWorkflowPages = (ws: string, workflowId?: string) =>
	useQuery({
		queryKey: workflowPageKeys.list(ws, workflowId),
		queryFn: ({ signal }) =>
			WorkflowPageService.list(ws, workflowId ? { workflow_id: workflowId } : undefined, signal),
		enabled: !!ws,
	});

export const useWorkflowPage = (ws: string, id: string) =>
	useQuery({
		queryKey: workflowPageKeys.detail(ws, id),
		queryFn: ({ signal }) => WorkflowPageService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useWorkflowPageView = (ws: string, id: string) =>
	useQuery({
		queryKey: workflowPageKeys.view(ws, id),
		queryFn: ({ signal }) => WorkflowPageService.view(ws, id, false, signal),
		enabled: !!ws && !!id,
		meta: { silent: true },
	});

export const useWorkflowPageSubmissions = (ws: string, id: string, enabled = true) =>
	useQuery({
		queryKey: workflowPageKeys.submissions(ws, id),
		queryFn: ({ signal }) => WorkflowPageService.submissions(ws, id, signal),
		enabled: enabled && !!ws && !!id,
		staleTime: 10_000,
	});

/** Writes a page the server returned into its detail cache and refreshes the lists. */
const useStorePage = (ws: string) => {
	const qc = useQueryClient();
	return (page: TWorkflowPage) => {
		qc.setQueryData(workflowPageKeys.detail(ws, page.id), page);
		qc.invalidateQueries({ queryKey: [...workflowPageKeys.all(ws), 'list'] });
		qc.invalidateQueries({ queryKey: workflowPageKeys.view(ws, page.id) });
	};
};

export const useCreateWorkflowPage = (ws: string) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: (payload: TCreateWorkflowPageDto) => WorkflowPageService.create(ws, payload),
		onSuccess: store,
		meta: { errorMessage: 'Could not create the page' },
	});
};

/** A 422 is always the caller's to show — it names the field at fault. */
export const useUpdateWorkflowPage = (ws: string, id: string, silentStatuses: number[] = []) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: (payload: TUpdateWorkflowPageDto) => WorkflowPageService.update(ws, id, payload),
		onSuccess: store,
		meta: { errorMessage: 'Could not save the page', silentStatuses: [422, ...silentStatuses] },
	});
};

export const useDuplicateWorkflowPage = (ws: string) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: (id: string) => WorkflowPageService.duplicate(ws, id),
		onSuccess: store,
		meta: { errorMessage: 'Could not duplicate the page' },
	});
};

export const useDeleteWorkflowPage = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowPageService.remove(ws, id),
		onSuccess: (_data, id) => {
			qc.removeQueries({ queryKey: workflowPageKeys.detail(ws, id) });
			qc.invalidateQueries({ queryKey: [...workflowPageKeys.all(ws), 'list'] });
		},
		meta: { errorMessage: 'Could not delete the page' },
	});
};

export const usePublishWorkflowPage = (ws: string, id: string) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: () => WorkflowPageService.publish(ws, id),
		onSuccess: store,
		meta: { errorMessage: 'Could not publish the page', silentStatuses: [422] },
	});
};

export const useUnpublishWorkflowPage = (ws: string, id: string) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: () => WorkflowPageService.unpublish(ws, id),
		onSuccess: store,
		meta: { errorMessage: 'Could not unpublish the page' },
	});
};

export const useRotateWorkflowPageLink = (ws: string, id: string) => {
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: () => WorkflowPageService.rotateLink(ws, id),
		onSuccess: store,
		meta: { errorMessage: 'Could not create a new link' },
	});
};
