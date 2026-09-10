import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TWorkflowInterface,
	TUpdateWorkflowInterfaceDto,
	TSubmitWorkflowInterfaceDto,
} from '@/types/workflow-extras.type';
import type { TRun } from '@/types/run.type';
import { WorkflowInterfaceEndpoints as E } from './workflows.endpoints';

export const WorkflowInterfaceService = {
	show: (ws: string, workflowId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ interface: TWorkflowInterface }>>(E.show(ws, workflowId), { signal })
			.then(unwrapKey<TWorkflowInterface>('interface')),

	update: (ws: string, workflowId: string, payload: TUpdateWorkflowInterfaceDto) =>
		axiosClient
			.put<TApiResponse<{ interface: TWorkflowInterface }>>(E.update(ws, workflowId), payload)
			.then(unwrapKey<TWorkflowInterface>('interface')),

	/** Starts a run from a filled-in form, validated against the same
	 *  contract `show()` returns. */
	submit: (ws: string, workflowId: string, payload?: TSubmitWorkflowInterfaceDto) =>
		axiosClient
			.post<TApiResponse<{ run: TRun }>>(E.submit(ws, workflowId), payload)
			.then(unwrapKey<TRun>('run')),
};
