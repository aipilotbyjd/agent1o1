import { useCallback, useEffect, useRef } from 'react';
import { AUTOSAVE_DEBOUNCE_MS } from '../_helper/builder.constants';
import { exportWorkflow } from '../_helper/importExport.helper';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useQueryClient } from '@tanstack/react-query';
import { WorkflowService, workflowKeys } from '@/api/modules/workflows';
import { WorkflowDiagnosticsService } from '@/api/modules/workflow-builder';
import { buildGraphPayload } from '../_helper/workflowApiTransform.helper';

export const useAutosave = () => {
	const { state, dispatch } = useWorkflowEditor();
	const queryClient = useQueryClient();
	const timer = useRef<number | null>(null);

	// The save reads the latest state through a ref, so the debounce effect below
	// only has to depend on the things that actually get persisted. It used to
	// depend on the whole state object, which meant any UI-only change — selecting
	// a node, toggling a panel, a run status tick — restarted the 700ms timer and
	// could starve autosave for as long as the user kept interacting.
	const stateRef = useRef(state);
	stateRef.current = state;

	const isMounted = useRef(true);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	const save = useCallback(
		async (options?: { silent?: boolean }) => {
			const silent = options?.silent ?? false;
			const setState = (savingState: 'saving' | 'saved' | 'error' | 'dirty') => {
				if (silent || !isMounted.current) return;
				dispatch({ type: 'SET_SAVE_STATE', savingState });
			};

			const current = stateRef.current;
			const { workspaceId, apiId } = current.workflow;
			// What this save covers. If either changes while the request is in flight
			// the user edited during the save, so it stays dirty instead of being
			// marked saved — otherwise that edit would never be persisted.
			const savedNodes = current.nodes;
			const savedEdges = current.edges;

			setState('saving');

			if (workspaceId && apiId) {
				try {
					// Name/description and the graph are separate resources on this
					// backend: PATCH ignores nodes/edges, the draft lives behind PUT /graph.
					await WorkflowService.update(workspaceId, apiId, {
						name: current.workflow.name,
						description: current.workflow.description || undefined,
					});
					const saved = await WorkflowDiagnosticsService.replaceGraph(
						workspaceId,
						apiId,
						buildGraphPayload(savedNodes, savedEdges),
					);
					// Reopening the editor reads the cached detail — keep it on the saved draft.
					queryClient.setQueryData(workflowKeys.detail(workspaceId, apiId), saved);
					const stale =
						stateRef.current.nodes !== savedNodes || stateRef.current.edges !== savedEdges;
					setState(stale ? 'dirty' : 'saved');
				} catch (err) {
					console.error('Failed to autosave workflow to API:', err);
					setState('error');
				}
			} else {
				try {
					localStorage.setItem(`workflow-editor:${current.workflow.id}`, exportWorkflow(current));
					setState('saved');
				} catch {
					setState('error');
				}
			}
		},
		[dispatch, queryClient],
	);

	const saveRef = useRef(save);
	saveRef.current = save;

	const { savingState, workspaceId, apiId, name, description } = state.workflow;

	useEffect(() => {
		if (savingState !== 'dirty') return;
		if (timer.current) window.clearTimeout(timer.current);

		timer.current = window.setTimeout(() => {
			void saveRef.current();
		}, AUTOSAVE_DEBOUNCE_MS);

		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [savingState, workspaceId, apiId, name, description, state.nodes, state.edges]);

	// Leaving the editor in-app unmounts it and the cleanup above clears the pending
	// timer with it, which silently dropped anything edited in the last 700ms. Flush
	// the save instead — the request outlives the unmount, so there is nothing to
	// prompt about.
	useEffect(
		() => () => {
			if (timer.current) window.clearTimeout(timer.current);
			if (stateRef.current.workflow.savingState === 'dirty') {
				void saveRef.current({ silent: true });
			}
		},
		[],
	);

	// A tab close or reload cannot be flushed the same way — the request is not
	// guaranteed to finish — so warn while there is anything unsaved or in flight.
	useEffect(() => {
		if (savingState !== 'dirty' && savingState !== 'saving') return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [savingState]);
};
