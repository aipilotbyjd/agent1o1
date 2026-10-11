import { useMemo } from 'react';
import type { TApiIssue } from '@/api/core';
import { useDraftDryRun } from '@/api/modules/workflow-builder';
import { buildGraphPayload } from '../_helper/workflowApiTransform.helper';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

const NO_ISSUES: TApiIssue[] = [];

/**
 * References between steps that won't resolve — a step that no longer
 * exists, runs later, or doesn't output that field — found by a dry run of
 * the saved draft. Publishing doesn't check these, so they'd otherwise only
 * surface when a run reaches them. Re-checked whenever what steps do or how
 * they connect changes and has been saved; moving steps around doesn't count.
 */
export const useReferenceIssues = (): TApiIssue[] => {
	const { state } = useWorkflowEditor();
	const { workspaceId, apiId, savingState } = state.workflow;

	const revision = useMemo(() => {
		const { nodes, edges } = buildGraphPayload(state.nodes, state.edges);
		return JSON.stringify({
			nodes: nodes.map(({ key, type, config }) => ({ key, type, config })),
			edges,
		});
	}, [state.nodes, state.edges]);

	const { data } = useDraftDryRun(
		workspaceId ?? '',
		apiId ?? '',
		revision,
		savingState === 'saved' && state.nodes.length > 0,
	);

	return data?.findings ?? NO_ISSUES;
};
