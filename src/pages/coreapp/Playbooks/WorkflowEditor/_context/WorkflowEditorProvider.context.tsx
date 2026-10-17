import { ReactNode, useEffect, useMemo, useReducer } from 'react';
import {
	initialWorkflowEditorState,
	WorkflowEditorContext,
	workflowEditorReducer,
} from './WorkflowEditorStore.context';
import type { TRunRecord } from '../_types/run.type';
import { useWorkflowRouteParams } from '../_hooks/useWorkflowRouteParams.hook';
import safeStorage from '@/utils/safeStorage.util';

const RUN_HISTORY_KEY = 'wf-editor-run-history';
/**
 * The AI chat panel survives a reload of the same workflow, but opening the editor fresh
 * (another workflow, a new tab, or navigating back in) always starts with it closed.
 */
const AI_PANEL_OPEN_KEY = 'wf-editor-ai-panel-open';

const loadRunHistory = (key: string): TRunRecord[] => {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as TRunRecord[]) : [];
	} catch {
		return [];
	}
};

/**
 * Strip per-node input and output payloads before persisting. These can carry sensitive
 * data (AI responses, API payloads, scraped content) and bloat the localStorage
 * quota, so only run metadata + node status/timing/error survive a reload.
 */
const toPersistableHistory = (history: TRunRecord[]): TRunRecord[] =>
	history.map((record) => ({
		...record,
		nodeRuns: record.nodeRuns.map(({ output: _output, input: _input, ...rest }) => rest),
	}));

const saveRunHistory = (key: string, history: TRunRecord[]) => {
	try {
		localStorage.setItem(key, JSON.stringify(toPersistableHistory(history)));
	} catch {
		/* ignore quota / serialization errors */
	}
};

export const WorkflowEditorProvider = ({ children }: { children: ReactNode }) => {
	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const runHistoryKey = `${RUN_HISTORY_KEY}:${workspaceId}:${workflowId}`;
	const aiPanelOpenKey = `${AI_PANEL_OPEN_KEY}:${workspaceId}:${workflowId}`;
	const [state, dispatch] = useReducer(
		workflowEditorReducer,
		initialWorkflowEditorState,
		(initial) => {
			const isAddWorkflow = window.location.pathname.endsWith('/new');
			const runHistory = loadRunHistory(runHistoryKey);
			const ui = {
				...initial.ui,
				aiPanelOpen: safeStorage.get(aiPanelOpenKey, 'session') === 'true',
			};
			if (isAddWorkflow) {
				return {
					...initial,
					nodes: [],
					edges: [],
					ui,
					runHistory,
				};
			}
			return { ...initial, ui, runHistory };
		},
	);

	// Persist run history so past runs survive reloads (frontend-only store).
	useEffect(() => {
		saveRunHistory(runHistoryKey, state.runHistory);
	}, [runHistoryKey, state.runHistory]);

	const isAiPanelOpen = state.ui.aiPanelOpen;
	useEffect(() => {
		if (isAiPanelOpen) safeStorage.set(aiPanelOpenKey, 'true', 'session');
		else safeStorage.remove(aiPanelOpenKey, 'session');
	}, [aiPanelOpenKey, isAiPanelOpen]);

	// Leaving the editor in-app forgets the panel; a reload skips this cleanup, so it reopens.
	useEffect(() => () => safeStorage.remove(aiPanelOpenKey, 'session'), [aiPanelOpenKey]);

	// Drop the old global flag that opened the panel on every workflow.
	useEffect(() => safeStorage.remove(AI_PANEL_OPEN_KEY), []);

	const value = useMemo(() => ({ state, dispatch }), [state]);

	return (
		<WorkflowEditorContext.Provider value={value}>{children}</WorkflowEditorContext.Provider>
	);
};
