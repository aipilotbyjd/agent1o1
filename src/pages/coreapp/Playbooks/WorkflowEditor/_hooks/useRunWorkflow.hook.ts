import { createContext, createElement, useContext, useRef, type ReactNode } from 'react';
import { useWorkflow, WorkflowService, WorkflowVersionService } from '@/api/modules/workflows';
import { RunService } from '@/api/modules/runs';
import { useConfirm } from '@/context/confirm';
import type { TNodeRunDetail, TRun, TRunStatus } from '@/types/run.type';
import { createId } from '../_context/WorkflowEditorStore.context';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { getRunOrder } from '../_helper/runGraph.helper';
import { persistWorkflowDraft } from '../_helper/persistDraft.helper';
import {
	buildRuntimeContext,
	executeNode,
	firstList,
	isEdgeActive,
	resolveNodeValues,
	type TNodeOutputs,
} from '../_helper/runtime.helper';
import { getNodeDefinition } from '../_helper/nodeCatalog.constants';
import type { TNodeRunRecord, TRunRecord } from '../_types/run.type';
import type { TNodeRunStatus } from '../_types/node.type';
import { notify } from '@/api/core/notify';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Poll quickly during active work, then less often for approval/callback waits. */
const POLL_INTERVAL_MS = 2000;
const WAITING_POLL_INTERVAL_MS = 10000;

/** How long a breakpoint waits for a manual step before auto-continuing. */
const BREAKPOINT_TIMEOUT_MS = 60_000;

/** Map a backend node-run status onto the editor's local run status. */
const API_NODE_STATUS_MAP: Record<string, TNodeRunStatus> = {
	completed: 'success',
	failed: 'error',
	cancelled: 'error',
	running: 'running',
	pending: 'queued',
	awaiting_approval: 'queued',
	awaiting_callback: 'queued',
	skipped: 'skipped',
};

/** Normalise an error field that may be a string or a `{ message }` object. */
const errorText = (error: unknown): string | undefined => {
	if (!error) return undefined;
	if (typeof error === 'string') return error;
	if (typeof error === 'object' && 'message' in error) {
		return String((error as { message?: unknown }).message ?? '');
	}
	return undefined;
};

const ACTIVE_RUN_STATUSES = new Set<TRunStatus>([
	'pending',
	'running',
	'awaiting_approval',
	'awaiting_callback',
]);

const useRunWorkflowController = () => {
	const { state, dispatch } = useWorkflowEditor();
	const stopped = useRef(false);
	const starting = useRef(false);
	// Set once the user has agreed that Run may publish the draft.
	const publishConfirmed = useRef(false);
	const { confirm } = useConfirm();
	const stepResolveRef = useRef<(() => void) | null>(null);

	const ws = state.workflow.workspaceId;
	const wfId = state.workflow.apiId;
	const workflowQuery = useWorkflow(ws || '', wfId || '');
	const isApiError = workflowQuery.isError;

	/** Finalise a local run: flip status and push the record into history. */
	const finishLocalRun = (
		status: TRunRecord['status'],
		runId: string,
		runStartedAt: number,
		nodeRuns: TNodeRunRecord[],
	) => {
		dispatch({ type: 'RUN_FINISH', status });
		dispatch({
			type: 'PUSH_RUN_HISTORY',
			record: {
				id: runId,
				startedAt: runStartedAt,
				finishedAt: Date.now(),
				status,
				trigger: 'manual',
				nodeRuns,
				logs: [],
			},
		});
	};

	/** Mirror a single node result onto the editor state. */
	const applyNodeResult = (
		nodeRunKey: string,
		status: string | undefined,
		durationMs: number | undefined,
		error: unknown,
		output: unknown,
		input?: unknown,
	) => {
		dispatch({
			type: 'SET_NODE_STATUS',
			id: nodeRunKey,
			status: API_NODE_STATUS_MAP[status ?? ''] ?? 'idle',
			durationMs,
			error: errorText(error),
			inputPreview: input,
			outputPreview: output,
		});
		if (status === 'running') {
			dispatch({ type: 'RUN_CURRENT_NODE', nodeId: nodeRunKey });
		}
	};

	/** Finalise a remote run from the backend's recorded status. */
	const finishRemoteRun = async (ws: string, run: TRun, nodeRuns: TNodeRunDetail[]) => {
		let finalRun = run;
		if (stopped.current && ACTIVE_RUN_STATUSES.has(run.status)) {
			try {
				finalRun = await RunService.cancel(ws, run.id);
			} catch (e) {
				console.error('Failed to cancel run on backend:', e);
				try {
					finalRun = await RunService.detail(ws, run.id);
				} catch {
					notify.error('Could not confirm whether the run stopped. Check Run History.');
					dispatch({ type: 'RUN_FINISH', status: 'error' });
					return;
				}
			}
		}

		const finalStatus: 'success' | 'error' | 'stopped' =
			finalRun.status === 'completed'
				? 'success'
				: finalRun.status === 'cancelled'
					? 'stopped'
					: 'error';
		dispatch({ type: 'RUN_FINISH', status: finalStatus });
		dispatch({
			type: 'APPEND_LOG',
			log: {
				level: finalStatus === 'success' ? 'info' : 'error',
				message: finalRun.error ?? `Run finished with status: ${finalRun.status}`,
			},
		});
		dispatch({
			type: 'PUSH_RUN_HISTORY',
			record: {
				id: finalRun.id,
				startedAt: finalRun.started_at ? Date.parse(finalRun.started_at) : Date.now(),
				finishedAt: finalRun.finished_at ? Date.parse(finalRun.finished_at) : Date.now(),
				status: finalStatus,
				trigger: 'manual',
				nodeRuns: nodeRuns.map((nodeRun) => ({
					nodeId: nodeRun.key,
					label:
						state.nodes.find((node) => node.id === nodeRun.key)?.data.label ??
						nodeRun.key,
					status:
						nodeRun.status === 'completed'
							? 'success'
							: nodeRun.status === 'skipped'
								? 'skipped'
								: 'error',
					durationMs: nodeRun.duration_ms ?? undefined,
					output: nodeRun.output,
					input: nodeRun.input,
					error: nodeRun.error ?? undefined,
				})),
				logs: [],
			},
		});
	};

	/** Poll the backend because a realtime completion event may precede subscription. */
	const runViaPolling = async (ws: string, initialRun: TRun) => {
		let run = initialRun;
		let nodeRuns: TNodeRunDetail[] = [];
		let attempts = 0;
		do {
			if (attempts > 0) {
				await wait(
					run.status === 'awaiting_approval' || run.status === 'awaiting_callback'
						? WAITING_POLL_INTERVAL_MS
						: POLL_INTERVAL_MS,
				);
			}
			if (stopped.current) break;
			try {
				run = await RunService.detail(ws, run.id);
				nodeRuns = await RunService.nodeRuns(ws, run.id);
				for (const nodeRun of nodeRuns) {
					applyNodeResult(
						nodeRun.key,
						nodeRun.status,
						nodeRun.duration_ms ?? undefined,
						nodeRun.error,
						nodeRun.output,
						nodeRun.input,
					);
				}
			} catch (error) {
				console.error('Error polling run:', error);
			}
			attempts += 1;
		} while (ACTIVE_RUN_STATUSES.has(run.status) && !stopped.current);
		return { run, nodeRuns };
	};

	/**
	 * Drive a real backend run and use the backend record as the source of truth.
	 */
	const runRemoteWorkflow = async (ws: string, wfId: string) => {
		try {
			const run = await RunService.start(ws, wfId, { input: {} });
			dispatch({ type: 'RUN_START', id: run.id });
			dispatch({
				type: 'APPEND_LOG',
				log: {
					level: 'info',
					message: `Run ${run.id} started with status ${run.status || 'running'}`,
				},
			});

			const result = await runViaPolling(ws, run);
			await finishRemoteRun(ws, result.run, result.nodeRuns);
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to start run';
			notify.error(msg);
			dispatch({ type: 'RUN_FINISH', status: 'error' });
		}
	};

	/**
	 * Run the deterministic frontend simulation. Outputs flow node → node,
	 * branches gate edges, and nodes whose inbound edges are all inactive skip.
	 */
	const runLocalWorkflow = async (runId: string, runStartedAt: number) => {
		const order = getRunOrder(state.nodes, state.edges);

		const outputs: TNodeOutputs = {};
		const branches: Record<string, string> = {};
		const skipped = new Set<string>();
		const nodeRuns: TNodeRunRecord[] = [];

		for (const node of order) {
			if (stopped.current) break;

			const incoming = state.edges.filter((edge) => edge.target === node.id);
			const activeIncoming = incoming.filter((edge) =>
				isEdgeActive(edge, outputs, branches, skipped),
			);

			// Skip when every inbound path is gated off by an upstream branch/skip.
			if (incoming.length > 0 && activeIncoming.length === 0) {
				skipped.add(node.id);
				dispatch({ type: 'SET_NODE_STATUS', id: node.id, status: 'skipped' });
				nodeRuns.push({ nodeId: node.id, label: node.data.label, status: 'skipped' });
				dispatch({
					type: 'APPEND_LOG',
					log: {
						nodeId: node.id,
						level: 'info',
						message: `${node.data.label} skipped (inactive branch)`,
					},
				});
				continue;
			}

			// Breakpoint: pause until the user steps (or a safety timeout fires).
			if (node.data.breakpoint && state.ui.stepMode) {
				dispatch({
					type: 'APPEND_LOG',
					log: {
						nodeId: node.id,
						level: 'info',
						message: `⏸ Breakpoint hit at ${node.data.label}`,
					},
				});
				dispatch({ type: 'RUN_CURRENT_NODE', nodeId: node.id });
				dispatch({ type: 'STEP_WAIT' });
				let resolved = false;
				let safetyTimer: ReturnType<typeof setTimeout>;
				await new Promise<void>((resolve) => {
					stepResolveRef.current = () => {
						resolved = true;
						clearTimeout(safetyTimer);
						resolve();
					};
					safetyTimer = setTimeout(() => {
						if (!resolved) resolve();
					}, BREAKPOINT_TIMEOUT_MS);
				});
				stepResolveRef.current = null;
				dispatch({ type: 'STEP_NEXT' });
				if (stopped.current) break;
			}

			const started = performance.now();
			dispatch({ type: 'RUN_CURRENT_NODE', nodeId: node.id });
			dispatch({ type: 'SET_NODE_STATUS', id: node.id, status: 'running' });

			// Pinned nodes reuse their saved output instead of re-executing.
			const usePinned = node.data.pinned && node.data.pinnedOutput !== undefined;

			dispatch({
				type: 'APPEND_LOG',
				log: {
					nodeId: node.id,
					level: 'info',
					message: usePinned
						? `${node.data.label} using pinned data`
						: `${node.data.label} started`,
				},
			});

			if (!usePinned) {
				await wait(state.ui.stepMode ? 150 : 300);
			}

			if (stopped.current) break;

			// Resolve {{expressions}} against upstream outputs, gather active inputs.
			const ctx = buildRuntimeContext(state.nodes, outputs);
			const resolvedValues = resolveNodeValues(node.data.values, ctx);
			const inputs = activeIncoming.map((edge) => outputs[edge.source]);

			let output: unknown;
			let runError: string | undefined;
			try {
				if (usePinned) {
					output = node.data.pinnedOutput;
				} else if (node.data.loopMode) {
					// Per-node Loop Mode: fan out over the incoming list, running the
					// node once per item and collecting outputs — mirrors the backend
					// NodeRunner. Falls back to a single run when no list is available.
					const primaryInput = inputs.length <= 1 ? inputs[0] : inputs;
					const list = firstList(primaryInput);
					if (list) {
						const itemOutputs = list.map(
							(item) => executeNode(node, [item], resolvedValues).output,
						);
						output = { items: itemOutputs, count: itemOutputs.length };
					} else {
						const result = executeNode(node, inputs, resolvedValues);
						output = result.output;
						if (result.branch) branches[node.id] = result.branch;
					}
				} else {
					const result = executeNode(node, inputs, resolvedValues);
					output = result.output;
					if (result.branch) branches[node.id] = result.branch;
				}
			} catch (error) {
				runError = error instanceof Error ? error.message : 'Node execution failed';
			}

			const durationMs = Math.round(performance.now() - started);

			if (runError) {
				dispatch({
					type: 'SET_NODE_STATUS',
					id: node.id,
					status: 'error',
					durationMs,
					error: runError,
				});
				dispatch({
					type: 'APPEND_LOG',
					log: {
						nodeId: node.id,
						level: 'error',
						message: `${node.data.label} failed: ${runError}`,
					},
				});
				nodeRuns.push({
					nodeId: node.id,
					label: node.data.label,
					status: 'error',
					durationMs,
					error: runError,
				});
				finishLocalRun('error', runId, runStartedAt, nodeRuns);
				return;
			}

			outputs[node.id] = output;
			dispatch({
				type: 'SET_NODE_STATUS',
				id: node.id,
				status: 'success',
				durationMs,
				// Mirrors the backend's persisted shape (`{ config: <resolved config> }`)
				// so the card renders identically for simulated and real runs.
				inputPreview: { config: resolvedValues },
				outputPreview: output,
			});
			nodeRuns.push({
				nodeId: node.id,
				label: node.data.label,
				status: 'success',
				durationMs,
				output,
			});
			dispatch({
				type: 'APPEND_LOG',
				log: {
					nodeId: node.id,
					level: 'info',
					message:
						branches[node.id] !== undefined
							? `${node.data.label} → branch "${branches[node.id]}" (${durationMs}ms)`
							: `${node.data.label} finished in ${durationMs}ms`,
				},
			});

			// In step mode (non-breakpoint), pause between every node.
			if (state.ui.stepMode && !node.data.breakpoint) {
				await wait(80);
			}
		}

		finishLocalRun(stopped.current ? 'stopped' : 'success', runId, runStartedAt, nodeRuns);
	};

	const runWorkflow = async () => {
		const isRunDisabled =
			state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started';
		if (isRunDisabled) return;
		if (state.run.status === 'running' || starting.current) return;

		// Check for missing credentials.
		const missingCredentialNode = state.nodes.find((node) => {
			const def = getNodeDefinition(node.data.defKey, node.data.definition);
			const field = def?.fields.find((item) => item.kind === 'credential');
			return Boolean(def?.requiresCredential) && (!field || !node.data.values[field.key]);
		});

		const isMockEmptyState =
			state.nodes.length === 0 && state.ui.emptyCanvasView === 'chat-started';

		if (missingCredentialNode || isMockEmptyState) {
			dispatch({
				type: 'SET_LINK_CREDENTIALS_OPEN',
				open: true,
			});
			return;
		}

		stopped.current = false;
		const runId = createId('run');
		const runStartedAt = Date.now();

		// Step-through is a local debugger: the backend cannot pause between
		// nodes, so step mode runs the in-browser simulation — and says so.
		if (state.ui.stepMode) {
			dispatch({ type: 'RUN_START', id: runId });
			dispatch({
				type: 'APPEND_LOG',
				log: {
					level: 'warn',
					message:
						'Step mode runs a local simulation. Nothing is executed on the server.',
				},
			});
			await runLocalWorkflow(runId, runStartedAt);
			return;
		}

		// Every other run goes to the server. When that is not possible, fail
		// loudly: a simulated "success" here would look like the workflow ran.
		if (!ws || !wfId) {
			notify.error('This workflow is not saved to the server yet, so it cannot run.');
			return;
		}
		if (isApiError) {
			notify.error(
				'Could not load this workflow from the server, so the run was not started. Reload and try again.',
			);
			return;
		}

		starting.current = true;
		try {
			// Runs are pinned to a published version on this backend. Save any
			// pending canvas edits, then publish the draft if it differs from live.
			const workflow =
				state.workflow.savingState === 'saved'
					? await WorkflowService.detail(ws, wfId)
					: await persistWorkflowDraft({
							workspaceId: ws,
							workflowId: wfId,
							name: state.workflow.name,
							description: state.workflow.description,
							nodes: state.nodes,
							edges: state.edges,
						});
			if (workflow.has_unpublished_changes || !workflow.current_version_id) {
				// Publishing replaces the live version — the one triggers and every
				// other caller run — so ask once per editor session before doing it
				// on the user's behalf. A first publish replaces nothing.
				if (workflow.current_version_id && !publishConfirmed.current) {
					const confirmed = await confirm({
						title: 'Publish and run',
						message:
							'Runs use the published version, so your changes will be published as the new live version first. Triggers and anything else that runs this workflow will use it from then on.',
						confirmText: 'Publish & run',
						tone: 'primary',
					});
					if (!confirmed) return;
					publishConfirmed.current = true;
				}
				const published = await WorkflowVersionService.publish(ws, wfId);
				dispatch({
					type: 'SET_WORKFLOW_META',
					patch: {
						currentVersionId: published.version.id,
						currentVersionNumber: published.version.version,
					},
				});
				notify.info(`Published v${published.version.version} — running it now.`);
			}
			await runRemoteWorkflow(ws, wfId);
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: 'Could not save the workflow before running',
			);
			dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' });
		} finally {
			starting.current = false;
		}
	};

	const stopRun = () => {
		stopped.current = true;
		stepResolveRef.current?.();
		dispatch({ type: 'RUN_FINISH', status: 'stopped' });
	};

	const stepNext = () => {
		stepResolveRef.current?.();
		dispatch({ type: 'STEP_NEXT' });
	};

	return { runWorkflow, stopRun, stepNext };
};

type TRunWorkflowController = ReturnType<typeof useRunWorkflowController>;
const WorkflowRunContext = createContext<TRunWorkflowController | null>(null);

export const WorkflowRunProvider = ({ children }: { children: ReactNode }) => {
	const controller = useRunWorkflowController();
	return createElement(WorkflowRunContext.Provider, { value: controller }, children);
};

export const useRunWorkflow = () => {
	const controller = useContext(WorkflowRunContext);
	if (!controller) throw new Error('useRunWorkflow must be used inside WorkflowRunProvider');
	return controller;
};
