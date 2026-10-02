import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';

export const useWorkflowRouteParams = () => {
	const params = useParams();
	const [searchParams] = useSearchParams();

	return useMemo(
		() => ({
			workspaceId:
				params.workspaceId ??
				searchParams.get('workspace') ??
				searchParams.get('workspaceId') ??
				'',
			workflowId:
				params.workflowId ??
				searchParams.get('workflow') ??
				searchParams.get('workflowId') ??
				'',
		}),
		[params.workflowId, params.workspaceId, searchParams],
	);
};
