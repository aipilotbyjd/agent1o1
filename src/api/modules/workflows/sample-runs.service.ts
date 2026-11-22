import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TRun } from '@/types/run.type';
import type { TSampleRunPlan, TStartRunDto } from '@/types/workflow.type';
import { WorkflowSampleRunEndpoints as E } from './workflows.endpoints';

/**
 * Sample runs: a run on example answers where app steps are shown instead of
 * executed, so nothing is sent. See `SampleRuns` in the API.
 */
export const SampleRunService = {
	plan: (ws: string, workflowId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TSampleRunPlan>>(E.plan(ws, workflowId), { signal })
			.then(unwrap<TSampleRunPlan>),

	start: (ws: string, workflowId: string, payload: TStartRunDto) =>
		axiosClient
			.post<TApiResponse<{ run: TRun }>>(E.start(ws, workflowId), payload)
			.then(unwrapKey<TRun>('run')),
};
