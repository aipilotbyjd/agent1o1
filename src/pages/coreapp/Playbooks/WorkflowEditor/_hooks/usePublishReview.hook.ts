import { usePublishApprovalPolicy, usePublishRequests } from '@/api/modules/workflows';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * Whether this workflow's changes go live directly or through a review, and
 * the review that's open, if any. A request can outlive the rule (an admin
 * switches review off while one is waiting), so the open one is read either way.
 */
export const usePublishReview = () => {
	const { state } = useWorkflowEditor();
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const policyQuery = usePublishApprovalPolicy(workspaceId);
	const requestsQuery = usePublishRequests(workspaceId, workflowId);

	const policy = policyQuery.data;
	const pending = requestsQuery.data?.pending ?? null;

	return {
		policy,
		requiresApproval: policy?.requires_approval ?? false,
		pending,
		history: requestsQuery.data?.requests ?? [],
		isLoading: policyQuery.isLoading || requestsQuery.isLoading,
	};
};
