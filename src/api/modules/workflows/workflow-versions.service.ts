import { axiosClient } from '@/api/client';
import { fetchAllPages, unwrapCursorPage, unwrapKey } from '@/api/core';
import type { TApiResponse, TCursorPaginationMeta } from '@/api/core';
import type { TWorkflowVersion } from '@/types/workflow-extras.type';
import type { TWorkflow, TPublishWorkflowDto } from '@/types/workflow.type';
import { WorkflowVersionEndpoints as E } from './workflows.endpoints';

export const WorkflowVersionService = {
	// Newest first. The API pages by cursor, so this walks every page.
	list: (ws: string, workflowId: string, signal?: AbortSignal) =>
		fetchAllPages((page) =>
			axiosClient
				.get<
					TApiResponse<TWorkflowVersion[]> & { meta: TCursorPaginationMeta }
				>(E.list(ws, workflowId), { params: page, signal })
				.then(unwrapCursorPage<TWorkflowVersion>),
		),

	detail: (ws: string, workflowId: string, version: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ version: TWorkflowVersion }>>(E.detail(ws, workflowId, version), {
				signal,
			})
			.then(unwrapKey<TWorkflowVersion>('version')),

	/** Validates the current draft and, if it passes, snapshots it as a new
	 *  immutable version. */
	publish: (ws: string, workflowId: string, payload?: TPublishWorkflowDto) =>
		axiosClient
			.post<
				TApiResponse<{ version: TWorkflowVersion; workflow: TWorkflow }>
			>(E.publish(ws, workflowId), payload)
			.then((r) => r.data.data),

	/** Replaces the draft with a published version's canvas. Nothing goes
	 *  live; restoring the live version discards unpublished changes. */
	restore: (ws: string, workflowId: string, version: string) =>
		axiosClient
			.post<TApiResponse<{ workflow: TWorkflow }>>(E.restore(ws, workflowId, version))
			.then(unwrapKey<TWorkflow>('workflow')),
};
