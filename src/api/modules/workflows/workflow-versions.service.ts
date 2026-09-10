import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TWorkflowVersion } from '@/types/workflow-extras.type';
import type { TWorkflow, TPublishWorkflowDto } from '@/types/workflow.type';
import { WorkflowVersionEndpoints as E } from './workflows.endpoints';

export const WorkflowVersionService = {
	list: (ws: string, workflowId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ versions: TWorkflowVersion[] }>>(E.list(ws, workflowId), { signal })
			.then(unwrapKey<TWorkflowVersion[]>('versions')),

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
			.post<TApiResponse<{ version: TWorkflowVersion; workflow: TWorkflow }>>(
				E.publish(ws, workflowId),
				payload,
			)
			.then((r) => r.data.data),
};
