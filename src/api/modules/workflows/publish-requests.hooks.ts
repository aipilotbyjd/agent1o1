import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PublishRequestService } from './publish-requests.service';
import { workflowVersionKeys } from './workflow-versions.hooks';
import { workflowKeys } from './workflows.keys';

export const publishRequestKeys = {
	list: (ws: string, workflowId: string) =>
		['workflows', ws, workflowId, 'publish-requests'] as const,
	detail: (ws: string, workflowId: string, id: string) =>
		['workflows', ws, workflowId, 'publish-requests', id] as const,
	policy: (ws: string) => ['workspaces', ws, 'publish-approval-policy'] as const,
	workspacePending: (ws: string) => ['workspaces', ws, 'publish-requests'] as const,
};

export const useWorkspacePendingPublishRequests = (ws: string) =>
	useQuery({
		queryKey: publishRequestKeys.workspacePending(ws),
		queryFn: ({ signal }) => PublishRequestService.workspacePending(ws, signal),
		enabled: !!ws,
	});

export const usePublishApprovalPolicy = (ws: string) =>
	useQuery({
		queryKey: publishRequestKeys.policy(ws),
		queryFn: ({ signal }) => PublishRequestService.policy(ws, signal),
		enabled: !!ws,
	});

export const useUpdatePublishApprovalPolicy = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (requirePublishApproval: boolean) =>
			PublishRequestService.updatePolicy(ws, requirePublishApproval),
		onSuccess: (policy) => qc.setQueryData(publishRequestKeys.policy(ws), policy),
		meta: { errorMessage: 'Could not change the review setting' },
	});
};

export const usePublishRequests = (ws: string, workflowId: string, enabled = true) =>
	useQuery({
		queryKey: publishRequestKeys.list(ws, workflowId),
		queryFn: ({ signal }) => PublishRequestService.list(ws, workflowId, signal),
		enabled: enabled && !!ws && !!workflowId,
	});

export const usePublishRequest = (ws: string, workflowId: string, id: string | null) =>
	useQuery({
		queryKey: publishRequestKeys.detail(ws, workflowId, id ?? ''),
		queryFn: ({ signal }) => PublishRequestService.detail(ws, workflowId, id ?? '', signal),
		enabled: !!ws && !!workflowId && !!id,
	});

const useInvalidateRequests = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return () => {
		qc.invalidateQueries({ queryKey: publishRequestKeys.list(ws, workflowId) });
		qc.invalidateQueries({ queryKey: publishRequestKeys.workspacePending(ws) });
	};
};

export const useCreatePublishRequest = (ws: string, workflowId: string) => {
	const invalidate = useInvalidateRequests(ws, workflowId);
	return useMutation({
		mutationFn: (notes: string | null) => PublishRequestService.create(ws, workflowId, notes),
		onSuccess: invalidate,
		// A refused draft (422) lists what to fix; the editor shows that itself.
		meta: { errorMessage: 'Could not request a review', silentStatuses: [422] },
	});
};

export const useApprovePublishRequest = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	const invalidate = useInvalidateRequests(ws, workflowId);
	return useMutation({
		mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
			PublishRequestService.approve(ws, workflowId, id, notes),
		onSuccess: () => {
			invalidate();
			qc.invalidateQueries({ queryKey: workflowVersionKeys.list(ws, workflowId) });
			qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, workflowId) });
		},
		meta: { errorMessage: 'Could not approve this request', silentStatuses: [422] },
	});
};

export const useRejectPublishRequest = (ws: string, workflowId: string) => {
	const invalidate = useInvalidateRequests(ws, workflowId);
	return useMutation({
		mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
			PublishRequestService.reject(ws, workflowId, id, notes),
		onSuccess: invalidate,
		meta: { errorMessage: 'Could not reject this request' },
	});
};

export const useWithdrawPublishRequest = (ws: string, workflowId: string) => {
	const invalidate = useInvalidateRequests(ws, workflowId);
	return useMutation({
		mutationFn: (id: string) => PublishRequestService.withdraw(ws, workflowId, id),
		onSuccess: invalidate,
		meta: { errorMessage: 'Could not withdraw this request' },
	});
};
