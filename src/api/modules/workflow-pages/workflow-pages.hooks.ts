import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateWorkflowPageDto,
	TPageBlock,
	TPageSubmissionFilters,
	TUpdateWorkflowPageDto,
	TWorkflowPage,
} from '@/types/workflow-page.type';
import { pageTemplateKeys } from '../templates/templates.keys';
import { PageSectionService, WorkflowPageService } from './workflow-pages.service';

export const workflowPageKeys = {
	all: (ws: string) => ['workspaces', ws, 'pages'] as const,
	list: (ws: string, workflowId?: string) =>
		['workspaces', ws, 'pages', 'list', workflowId ?? 'all'] as const,
	detail: (ws: string, id: string) => ['workspaces', ws, 'pages', 'detail', id] as const,
	view: (ws: string, id: string) => ['workspaces', ws, 'pages', 'view', id] as const,
	submissions: (ws: string, id: string) => ['workspaces', ws, 'pages', 'submissions', id] as const,
	sections: (ws: string) => ['workspaces', ws, 'pages', 'sections'] as const,
	insights: (ws: string, id: string) => ['workspaces', ws, 'pages', 'insights', id] as const,
	versions: (ws: string, id: string) => ['workspaces', ws, 'pages', 'versions', id] as const,
	comments: (ws: string, id: string) => ['workspaces', ws, 'pages', 'comments', id] as const,
	generation: (ws: string, id: string, generationId: string) =>
		['workspaces', ws, 'pages', 'generations', id, generationId] as const,
};

export const useWorkflowPageVersions = (ws: string, id: string, enabled = true) =>
	useQuery({
		queryKey: workflowPageKeys.versions(ws, id),
		queryFn: ({ signal }) => WorkflowPageService.versions(ws, id, signal),
		enabled: enabled && !!ws && !!id,
	});

export const useSaveWorkflowPageVersion = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { label?: string | null; kind?: 'saved' | 'before_generation' }) =>
			WorkflowPageService.saveVersion(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowPageKeys.versions(ws, id) }),
		meta: { errorMessage: 'Could not save a version' },
	});
};

export const useRestoreWorkflowPageVersion = (ws: string, id: string) => {
	const qc = useQueryClient();
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: (versionId: string) => WorkflowPageService.restoreVersion(ws, id, versionId),
		onSuccess: (page) => {
			store(page);
			qc.invalidateQueries({ queryKey: workflowPageKeys.versions(ws, id) });
		},
		meta: { errorMessage: 'Could not restore the version' },
	});
};

export const useWorkflowPageComments = (ws: string, id: string) =>
	useQuery({
		queryKey: workflowPageKeys.comments(ws, id),
		queryFn: ({ signal }) => WorkflowPageService.comments(ws, id, signal),
		enabled: !!ws && !!id,
		// The page channel brings changes at once; this covers a dropped socket.
		refetchInterval: 30_000,
	});

/** Add, edit, resolve or delete a comment — each refreshes the threads. */
export const useWorkflowPageCommentActions = (ws: string, id: string) => {
	const qc = useQueryClient();
	const refresh = () => qc.invalidateQueries({ queryKey: workflowPageKeys.comments(ws, id) });
	return {
		add: useMutation({
			mutationFn: (payload: { body: string; block_id?: string | null; parent_id?: string | null }) =>
				WorkflowPageService.addComment(ws, id, payload),
			onSuccess: refresh,
			meta: { errorMessage: 'Could not post the comment' },
		}),
		update: useMutation({
			mutationFn: ({ commentId, ...payload }: { commentId: string; body?: string; resolved?: boolean }) =>
				WorkflowPageService.updateComment(ws, id, commentId, payload),
			onSuccess: refresh,
			meta: { errorMessage: 'Could not update the comment' },
		}),
		remove: useMutation({
			mutationFn: (commentId: string) => WorkflowPageService.deleteComment(ws, id, commentId),
			onSuccess: refresh,
			meta: { errorMessage: 'Could not delete the comment' },
		}),
	};
};

/** Polls until the generation finishes; realtime events refresh it sooner. */
export const useWorkflowPageGeneration = (ws: string, id: string, generationId: string | null) =>
	useQuery({
		queryKey: workflowPageKeys.generation(ws, id, generationId ?? ''),
		queryFn: ({ signal }) => WorkflowPageService.generation(ws, id, generationId!, signal),
		enabled: !!ws && !!id && !!generationId,
		refetchInterval: (query) =>
			query.state.data && ['completed', 'failed'].includes(query.state.data.status) ? false : 2500,
	});

export const useWorkflowPageInsights = (ws: string, id: string, params: { days: number; include_tests: boolean }) =>
	useQuery({
		queryKey: [...workflowPageKeys.insights(ws, id), params],
		queryFn: ({ signal }) => WorkflowPageService.insights(ws, id, params, signal),
		enabled: !!ws && !!id,
		placeholderData: keepPreviousData,
	});

export const useWorkflowPageSubmissionsPage = (ws: string, id: string, filters: TPageSubmissionFilters) =>
	useQuery({
		queryKey: [...workflowPageKeys.submissions(ws, id), 'table', filters],
		queryFn: ({ signal }) => WorkflowPageService.submissionsPage(ws, id, filters, signal),
		enabled: !!ws && !!id,
		placeholderData: keepPreviousData,
	});

/** Create, remove or promote version B — each answers with the page. */
export const useWorkflowPageVariant = (ws: string, id: string) => {
	const store = useStorePage(ws);
	const options = { onSuccess: store, meta: { errorMessage: 'Could not change version B' } };
	return {
		create: useMutation({ mutationFn: () => WorkflowPageService.createVariant(ws, id), ...options }),
		remove: useMutation({ mutationFn: () => WorkflowPageService.removeVariant(ws, id), ...options }),
		promote: useMutation({ mutationFn: () => WorkflowPageService.promoteVariant(ws, id), ...options }),
	};
};

export const usePageSections = (ws: string) =>
	useQuery({
		queryKey: workflowPageKeys.sections(ws),
		queryFn: ({ signal }) => PageSectionService.list(ws, signal),
		enabled: !!ws,
	});

export const useSavePageSection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { name: string; block: TPageBlock }) => PageSectionService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowPageKeys.sections(ws) }),
		meta: { errorMessage: 'Could not save the section' },
	});
};

export const useDeletePageSection = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => PageSectionService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowPageKeys.sections(ws) }),
		meta: { errorMessage: 'Could not delete the section' },
	});
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
	const qc = useQueryClient();
	const store = useStorePage(ws);
	return useMutation({
		mutationFn: (payload: TCreateWorkflowPageDto) => WorkflowPageService.create(ws, payload),
		onSuccess: (page, payload) => {
			store(page);
			if (payload.template_id) qc.invalidateQueries({ queryKey: pageTemplateKeys.lists(ws) });
		},
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
