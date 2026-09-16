import { useRef } from 'react';
import { useWorkflow } from '@/api/modules/workflows';
import {
	RunService,
	subscribeToRun,
	type IRunStateChangedEvent,
	type INodeRunStateChangedEvent,
} from '@/api/modules/runs';
import type { TNodeRunDetail, TRunStatus } from '@/types/run.type';
import { useRealtime } from '@/context/realtime';
import { createId } from '../_context/WorkflowEditorStore.context';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { getRunOrder } from '../_helper/runGraph.helper';
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

/** Backend poll cadence and safety cap (~5 min) so a stuck execution can't poll forever. */
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150;

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

export const useRunWorkflow = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { echo } = useRealtime();
	const stopped = useRef(false);
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

	/** Mirror a single node result (from poll or realtime) onto the editor state. */
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

	/** Finalise a remote run: cancel on stop, otherwise flip status from the result. */
	const finishRemoteRun = async (ws: string, runId: string, status: TRunStatus | undefined) => {
		if (stopped.current) {
			try {
				await RunService.cancel(ws, runId);
			} catch (e) {
				console.error('Failed to cancel run on backend:', e);
			}
			dispatch({ type: 'RUN_FINISH', status: 'stopped' });
			return;
		}

		const finalStatus: 'success' | 'error' | 'stopped' =
			status === 'completed' ? 'success' : status === 'cancelled' ? 'stopped' : 'error';
		dispatch({ type: 'RUN_FINISH', status: finalStatus });
		dispatch({
			type: 'APPEND_LOG',
			log: {
				level: finalStatus === 'success' ? 'info' : 'error',
				message: `Run finished with status: ${status ?? 'unknown'}`,
			},
		});
	};

	/**
	 * Realtime path: subscribe to the run's private channel and mirror
	 * `run.state-changed` / `node-run.state-changed`. Resolves with the final
	 * run status.
	 */
	const runViaRealtime = (ws: string, runId: string) =>
		new Promise<TRunStatus>((resolve) => {
			let settled = false;
			const settle = (status: TRunStatus) => {
				if (settled) return;
				settled = true;
				unsubscribe();
				clearTimeout(safetyTimer);
				clearInterval(stopWatch);
				resolve(status);
			};

			const unsubscribe = subscribeToRun(echo!, ws, runId, {
				onRunState: (event: IRunStateChangedEvent) => {
					if (event.status === 'completed' || event.status === 'failed' || event.status === 'cancelled') {
						if (event.status === 'failed' && event.error) {
							dispatch({
								type: 'APPEND_LOG',
								log: { level: 'error', message: errorText(event.error) ?? 'Run failed' },
							});
						}
						settle(event.status);
						return;
					}
					if (event.status === 'awaiting_approval' || event.status === 'awaiting_callback') {
						dispatch({
							type: 'APPEND_LOG',
							log: { level: 'info', message: `Run paused: ${event.status}` },
						});
						return;
					}
					dispatch({
						type: 'APPEND_LOG',
						log: { level: 'info', message: `Run ${runId} ${event.status}` },
					});
				},
				onNodeState: (event: INodeRunStateChangedEvent) =>
					applyNodeResult(event.key, event.status, undefined, event.error, undefined, undefined),
			});

			// Backstops: overall time cap, and a watcher so Stop tears the run down.
			const safetyTimer = setTimeout(
				() => settle('failed'),
				MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS,
			);
			const stopWatch = setInterval(() => {
				if (stopped.current) settle('cancelled');
			}, 500);
		});

	/** Polling path (used when no realtime connection is available). */
	const runViaPolling = async (ws: string, runId: string, initialStatus: TRunStatus) => {
		let status = initialStatus;
		const poll = async () => {
			if (stopped.current) return;
			try {
				const detail = await RunService.detail(ws, runId);
				status = detail.status;

				const nodeRuns: TNodeRunDetail[] = await RunService.nodeRuns(ws, runId);
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
			} catch (e) {
				console.error('Error polling run:', e);
			}
		};

		let attempts = 0;
		while (ACTIVE_RUN_STATUSES.has(status) && !stopped.current) {
			if (attempts >= MAX_POLL_ATTEMPTS) {
				dispatch({
					type: 'APPEND_LOG',
					log: { level: 'warn', message: 'Stopped polling: run did not finish in time.' },
				});
				break;
			}
			attempts += 1;
			await wait(POLL_INTERVAL_MS);
			await poll();
		}
		return status;
	};

	/**
	 * Drive a real backend run. Prefers realtime when Echo is connected;
	 * falls back to polling otherwise.
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

			const status = echo
				? await runViaRealtime(ws, run.id)
				: await runViaPolling(ws, run.id, run.status);

			await finishRemoteRun(ws, run.id, status);
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
					log: { nodeId: node.id, level: 'info', message: `${node.data.label} skipped (inactive branch)` },
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
					message: usePinned ? `${node.data.label} using pinned data` : `${node.data.label} started`,
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
					log: { nodeId: node.id, level: 'error', message: `${node.data.label} failed: ${runError}` },
				});
				nodeRuns.push({ nodeId: node.id, label: node.data.label, status: 'error', durationMs, error: runError });
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
			nodeRuns.push({ nodeId: node.id, label: node.data.label, status: 'success', durationMs, output });
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
		const isRunDisabled = state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started';
		if (isRunDisabled) return;
		if (state.run.status === 'running') return;

		// Check for missing credentials.
		const hasMissingCredentials = state.nodes.some((node) => {
			const def = getNodeDefinition(node.data.defKey, node.data.definition);
			return Boolean(def?.requiresCredential) && !node.data.values.credential_id;
		});

		const isMockEmptyState = state.nodes.length === 0 && state.ui.emptyCanvasView === 'chat-started';

		if (hasMissingCredentials || isMockEmptyState) {
			dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: true });
			return;
		}

		stopped.current = false;
		const runId = createId('run');
		const runStartedAt = Date.now();

		if (ws && wfId && !isApiError) {
			await runRemoteWorkflow(ws, wfId);
			return;
		}

		dispatch({ type: 'RUN_START', id: runId });
		await runLocalWorkflow(runId, runStartedAt);
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
