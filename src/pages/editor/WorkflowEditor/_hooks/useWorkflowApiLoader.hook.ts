import { useEffect, useMemo, useRef } from 'react';
import { useWorkflow, useWorkflowVersions } from '@/api/modules/workflows';
import { versionToExportedWorkflow } from '../_helper/workflowApiTransform.helper';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useNodeCategories } from '@/api/modules/node-types';
import { mapApiCategoriesToGroups } from '../_helper/apiNodeCatalog.helper';
import { NODE_CATALOG_MAP } from '../_helper/nodeCatalog.constants';

export const useWorkflowApiLoader = (workspaceId: string, workflowId: string) => {
	const { dispatch } = useWorkflowEditor();
	const loadedKey = useRef<string | null>(null);
	const workflowQuery = useWorkflow(workspaceId, workflowId);
	const versionsQuery = useWorkflowVersions(workspaceId, workflowId);

	// Load dynamic node categories/definitions from the API
	const { data: apiCategories, isLoading: categoriesLoading } = useNodeCategories({
		include_nodes: true,
	});

	// Register dynamic definitions so they are globally resolvable in the editor
	useEffect(() => {
		if (!apiCategories) return;
		try {
			const groups = mapApiCategoriesToGroups(apiCategories);
			groups.forEach((group) => {
				group.nodes.forEach((node) => {
					NODE_CATALOG_MAP[node.key] = node;
				});
			});
		} catch (err) {
			console.error('Failed to register dynamic node definitions:', err);
		}
	}, [apiCategories]);

	const selectedVersion = useMemo(() => {
		const versions = versionsQuery.data ?? [];
		const currentVersionId = workflowQuery.data?.current_version_id;
		return (
			versions.find((version) => version.id === currentVersionId) ??
			versions.find((version) => version.is_published) ??
			versions[0]
		);
	}, [versionsQuery.data, workflowQuery.data?.current_version_id]);

	useEffect(() => {
		if (!workspaceId || !workflowId || !workflowQuery.data) return;
		if (versionsQuery.isLoading) return;
		// Wait for the node catalog to load/register first. NODE_CATALOG_MAP is a
		// plain module object mutated in the effect above; mutating it does not
		// re-render already-mounted nodes, so if we load the workflow before the
		// definitions are registered the nodes render as generic "· Node" with no
		// fields. Gating here guarantees definitions exist before nodes mount.
		if (categoriesLoading) return;

		const versionKey = selectedVersion?.id ?? 'empty';
		const loadKey = `${workspaceId}:${workflowId}:${versionKey}`;
		if (loadedKey.current === loadKey) return;
		loadedKey.current = loadKey;

		// NOTE: we intentionally do NOT reset the AI chat here. The builder store
		// keys its session per-workflow (setBuilderContext) and resumes/clears the
		// conversation to match the active workflow, so wiping it here would drop a
		// valid in-progress or resumable session for the workflow being loaded.

		dispatch({
			type: 'LOAD_WORKFLOW',
			workflow: versionToExportedWorkflow(workflowQuery.data, selectedVersion, workspaceId),
		});
	}, [
		dispatch,
		selectedVersion,
		versionsQuery.isLoading,
		categoriesLoading,
		workflowId,
		workflowQuery.data,
		workspaceId,
	]);

	return {
		isApiWorkflow: Boolean(workspaceId && workflowId),
		isLoading: workflowQuery.isLoading || versionsQuery.isLoading,
		isError: workflowQuery.isError || versionsQuery.isError,
		workflow: workflowQuery.data,
		version: selectedVersion,
	};
};
