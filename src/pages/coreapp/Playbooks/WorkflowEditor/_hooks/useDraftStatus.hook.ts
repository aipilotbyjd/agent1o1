import { useMemo } from 'react';
import { useWorkflowVersion } from '@/api/modules/workflows';
import type { TBuilderGraph } from '@/types/workflow-builder.type';
import { buildGraphPayload } from '../_helper/workflowApiTransform.helper';
import { diffGraphs, hasDifferences, type TGraphDiff } from '../_helper/versionDiff.helper';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/**
 * - `unpublished`: never published, so nothing is live yet.
 * - `changed`: the draft has edits the live version doesn't.
 * - `live`: the draft is what's live.
 * - `checking`: the live version is still loading.
 */
export type TDraftStatus = 'unpublished' | 'changed' | 'live' | 'checking';

/**
 * Where the draft on the canvas stands against the live version: compared
 * by content, so autosaving or moving steps around doesn't count as a change.
 */
export const useDraftStatus = () => {
	const { state } = useWorkflowEditor();
	const { workspaceId, apiId, currentVersionId, currentVersionNumber } = state.workflow;
	const liveQuery = useWorkflowVersion(workspaceId ?? '', apiId ?? '', currentVersionId ?? '');

	const draftGraph: TBuilderGraph = useMemo(
		() => buildGraphPayload(state.nodes, state.edges) as TBuilderGraph,
		[state.nodes, state.edges],
	);
	const liveGraph = liveQuery.data?.editor_graph;

	const diff: TGraphDiff | null = useMemo(
		() => (liveGraph ? diffGraphs(liveGraph, draftGraph) : null),
		[liveGraph, draftGraph],
	);

	const status: TDraftStatus = !currentVersionId
		? 'unpublished'
		: !diff
			? 'checking'
			: hasDifferences(diff)
				? 'changed'
				: 'live';

	const liveVersionNumber = liveQuery.data?.version ?? currentVersionNumber;
	const version = liveVersionNumber ? `v${liveVersionNumber}` : '';
	const label = {
		live: `Live · ${version}`,
		changed: 'Unpublished changes',
		unpublished: 'Not published',
		checking: version ? `Live · ${version}` : 'Draft',
	}[status];

	return {
		status,
		label,
		diff,
		draftGraph,
		liveGraph,
		liveVersionId: currentVersionId ?? null,
		liveVersionNumber,
	};
};
