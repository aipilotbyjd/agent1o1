import { ReactNode, useContext, useEffect, useMemo, useReducer } from 'react';
import {
	initialWorkflowEditorState,
	WorkflowEditorContext,
	workflowEditorReducer,
} from './WorkflowEditorStore.context';
import type { TRunRecord } from '../_types/run.type';

const RUN_HISTORY_KEY = 'wf-editor-run-history';

const loadRunHistory = (): TRunRecord[] => {
	try {
		const raw = localStorage.getItem(RUN_HISTORY_KEY);
		return raw ? (JSON.parse(raw) as TRunRecord[]) : [];
	} catch {
		return [];
	}
};

/**
 * Strip per-node output payloads before persisting. Outputs can carry sensitive
 * data (AI responses, API payloads, scraped content) and bloat the localStorage
 * quota, so only run metadata + node status/timing/error survive a reload.
 */
const toPersistableHistory = (history: TRunRecord[]): TRunRecord[] =>
	history.map((record) => ({
		...record,
		nodeRuns: record.nodeRuns.map(({ output: _output, ...rest }) => rest),
	}));

const saveRunHistory = (history: TRunRecord[]) => {
	try {
		localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(toPersistableHistory(history)));
	} catch {
		/* ignore quota / serialization errors */
	}
};

export const WorkflowEditorProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(
		workflowEditorReducer,
		initialWorkflowEditorState,
		(initial) => {
			const isAddWorkflow = window.location.pathname.endsWith('/add-workflow');
			const runHistory = loadRunHistory();
			if (isAddWorkflow) {
				return {
					...initial,
					nodes: [],
					edges: [],
					runHistory,
				};
			}
			return { ...initial, runHistory };
		},
	);

	// Persist run history so past runs survive reloads (frontend-only store).
	useEffect(() => {
		saveRunHistory(state.runHistory);
	}, [state.runHistory]);

	const value = useMemo(() => ({ state, dispatch }), [state]);

	return (
		<WorkflowEditorContext.Provider value={value}>{children}</WorkflowEditorContext.Provider>
	);
};

export const useWorkflowEditor = () => {
	const context = useContext(WorkflowEditorContext);
	if (!context) throw new Error('useWorkflowEditor must be used inside WorkflowEditorProvider');
	return context;
};
