import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TStartRunDto } from '@/types/workflow.type';
import { runKeys } from '@/api/modules/runs/runs.keys';
import { SampleRunService } from './sample-runs.service';
import { workflowKeys } from './workflows.keys';

export const sampleRunKeys = {
	plan: (ws: string, workflowId: string) => ['workflows', ws, workflowId, 'sample-run'] as const,
};

export const useSampleRunPlan = (ws: string, workflowId: string) =>
	useQuery({
		queryKey: sampleRunKeys.plan(ws, workflowId),
		queryFn: ({ signal }) => SampleRunService.plan(ws, workflowId, signal),
		enabled: !!ws && !!workflowId,
	});

/** The first sample run publishes a never-published workflow, so the workflow is read again. */
export const useStartSampleRun = (ws: string, workflowId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TStartRunDto) => SampleRunService.start(ws, workflowId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: runKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, workflowId) });
		},
		meta: { errorMessage: 'Could not start the run' },
	});
};
