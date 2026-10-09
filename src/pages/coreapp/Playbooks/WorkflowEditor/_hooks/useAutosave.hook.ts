import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { AUTOSAVE_DEBOUNCE_MS } from '../_helper/builder.constants';
import { exportWorkflow } from '../_helper/importExport.helper';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { usePersistWorkflowDraft } from './usePersistWorkflowDraft.hook';
import { messageFromError, notify } from '@/api/core/notify';

export const useAutosave = () => {
	const { state, dispatch } = useWorkflowEditor();
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const timer = useRef<number | null>(null);

	// The save reads the latest state through a ref, so the debounce effect below
	// only has to depend on the things that actually get persisted. It used to
	// depend on the whole state object, which meant any UI-only change — selecting
	// a node, toggling a panel, a run status tick — restarted the 700ms timer and
	// could starve autosave for as long as the user kept interacting.
	const stateRef = useRef(state);
	useLayoutEffect(() => {
		stateRef.current = state;
	});

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
			const savedName = current.workflow.name;
			const savedDescription = current.workflow.description;

			setState('saving');

			if (workspaceId && apiId) {
				try {
					// Name/description and the graph are separate resources on this
					// backend: PATCH ignores nodes/edges, the draft lives behind PUT /graph.
					await persistWorkflowDraft({
						workspaceId,
						workflowId: apiId,
						name: savedName,
						description: savedDescription,
						nodes: savedNodes,
						edges: savedEdges,
					});
					const stale =
						stateRef.current.nodes !== savedNodes ||
						stateRef.current.edges !== savedEdges ||
						stateRef.current.workflow.name !== savedName ||
						stateRef.current.workflow.description !== savedDescription;
					setState(stale ? 'dirty' : 'saved');
				} catch (err) {
					if (!silent) notify.error(messageFromError(err, 'Could not save the workflow'));
					setState('error');
				}
			} else {
				try {
					localStorage.setItem(
						`workflow-editor:${current.workflow.id}`,
						exportWorkflow(current),
					);
					setState('saved');
				} catch {
					setState('error');
				}
			}
		},
		[dispatch, persistWorkflowDraft],
	);

	const saveRef = useRef(save);
	useLayoutEffect(() => {
		saveRef.current = save;
	});

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
