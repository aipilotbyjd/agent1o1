import { useMutation } from '@tanstack/react-query';
import type { ITestNodeDto, ITestNodeResult } from '@/pages/coreapp/Playbooks/_types/workflow.type';

/**
 * Ported-frontend adapter.
 *
 * The old editor could test a node standalone: it posted a node *type* plus the
 * parameters typed into the inspector, with no workflow involved, and got the
 * output back. This backend's equivalent (`WorkflowDiagnosticsService.testNode`)
 * only runs a node that already exists inside a saved workflow — it is addressed
 * by `workflowId` + `nodeId` — so the old call cannot be expressed against it.
 *
 * Kept so the ported editor compiles and so the gap surfaces at the point of use
 * instead of silently doing nothing. Wiring the inspector's test button to a
 * saved node is the backend-adaptation pass's job.
 */
export const useTestNode = (_ws: string) =>
	useMutation<ITestNodeResult, Error, ITestNodeDto>({
		mutationFn: () =>
			Promise.reject(
				new Error(
					'Testing an unsaved node is not supported by this backend — save the workflow first',
				),
			),
		meta: { errorMessage: 'Node test is not supported yet' },
	});
