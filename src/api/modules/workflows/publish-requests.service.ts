import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TPublishApprovalPolicy,
	TPublishRequest,
	TPublishRequestList,
} from '@/types/workflow-extras.type';
import type { TWorkflow } from '@/types/workflow.type';
import { PublishRequestEndpoints as E } from './workflows.endpoints';

export const PublishRequestService = {
	list: (ws: string, workflowId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TPublishRequestList>>(E.list(ws, workflowId), { signal })
			.then((r) => r.data.data),

	detail: (ws: string, workflowId: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ request: TPublishRequest }>
			>(E.detail(ws, workflowId, id), { signal })
			.then(unwrapKey<TPublishRequest>('request')),

	/** Copies the saved draft into a review request; nothing goes live. */
	create: (ws: string, workflowId: string, notes: string | null) =>
		axiosClient
			.post<TApiResponse<{ request: TPublishRequest }>>(E.create(ws, workflowId), { notes })
			.then(unwrapKey<TPublishRequest>('request')),

	/** Publishes the reviewed copy as the next version. */
	approve: (ws: string, workflowId: string, id: string, notes: string | null) =>
		axiosClient
			.post<
				TApiResponse<{ request: TPublishRequest; workflow: TWorkflow }>
			>(E.approve(ws, workflowId, id), { notes })
			.then((r) => r.data.data),

	reject: (ws: string, workflowId: string, id: string, notes: string | null) =>
		axiosClient
			.post<
				TApiResponse<{ request: TPublishRequest }>
			>(E.reject(ws, workflowId, id), { notes })
			.then(unwrapKey<TPublishRequest>('request')),

	withdraw: (ws: string, workflowId: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ request: TPublishRequest }>>(E.withdraw(ws, workflowId, id))
			.then(unwrapKey<TPublishRequest>('request')),

	/** Every request waiting for review in the workspace, oldest first. */
	workspacePending: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ requests: TPublishRequest[] }>>(E.workspacePending(ws), { signal })
			.then(unwrapKey<TPublishRequest[]>('requests')),

	policy: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ policy: TPublishApprovalPolicy }>>(E.policy(ws), { signal })
			.then(unwrapKey<TPublishApprovalPolicy>('policy')),

	updatePolicy: (ws: string, requirePublishApproval: boolean) =>
		axiosClient
			.put<TApiResponse<{ policy: TPublishApprovalPolicy }>>(E.policy(ws), {
				require_publish_approval: requirePublishApproval,
			})
			.then(unwrapKey<TPublishApprovalPolicy>('policy')),
};
