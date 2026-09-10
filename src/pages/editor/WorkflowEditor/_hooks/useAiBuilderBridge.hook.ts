import { useEffect, useRef } from 'react';
import { useRealtime } from '@/context/realtimeContext';
import { useAiChatStore } from '@/store/aiChat.store';
import { WorkflowBuilderService } from '@/api/modules/workflow-builder/workflow-builder.service';
import {
	subscribeToBuilderSession,
	type IEchoLike,
} from '@/api/modules/workflow-builder/workflow-builder.realtime';
import type {
	IBuilderMessage,
	IBuilderMessageReadyEvent,
	IBuilderNodePosition,
} from '@/types/workflowBuilder.type';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useWorkflowRouteParams } from './useWorkflowRouteParams.hook';
import {
	builderDraftToCanvas,
	builderNodeToCanvas,
	canvasToBuilderDraft,
} from '../_helper/builderDraft.helper';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000;
const DRAFT_SYNC_DEBOUNCE_MS = 1500;

// Tool names as resolved by Laravel\Ai\Tools\ToolNameResolver — our tool
// classes don't define name(), so it falls back to class_basename(), i.e. the
// PascalCase class name verbatim (see App\Agents\Tools\Draft\*).
const TOOL_ADD_NODE = 'AddNodeTool';
const TOOL_REMOVE_NODE = 'RemoveNodeTool';
const TOOL_UPDATE_NODE = 'UpdateNodeTool';
const TOOL_CONNECT_NODES = 'ConnectNodesTool';
const TOOL_DISCONNECT_NODES = 'DisconnectNodesTool';

/** The tool handlers return `json_encode(...)` — parse it back, defensively. */
const parseToolResult = (result: unknown): Record<string, unknown> | null => {
	if (result && typeof result === 'object') return result as Record<string, unknown>;
	if (typeof result === 'string') {
		try {
			const parsed = JSON.parse(result);
			return parsed && typeof parsed === 'object' ? parsed : null;
		} catch {
			return null;
		}
	}
	return null;
};

/**
 * Connects the AI chat store to the real backend workflow builder.
 *
 * - Feeds the current workspace/workflow into the store so it can call the API.
 * - Subscribes to the builder session's private realtime channel for instant
 *   results, AND polls the session as a fallback (realtime auth can be flaky on
 *   some deploys). Whichever arrives first wins; the other is a no-op.
 * - Applies the canvas live, node-by-node, as each tool call in the agent's run
 *   succeeds (Gumloop-style) — not just once at the very end. The final
 *   `builder.message.ready` still runs APPLY_BUILDER_DRAFT as the authoritative
 *   reconciliation, in case any granular step was missed.
 *
 * Mount once inside the editor (where the WorkflowEditor + Realtime providers and
 * the route params are all available).
 */
export const useAiBuilderBridge = () => {
	const { echo } = useRealtime();
	const { state, dispatch } = useWorkflowEditor();
	const { workspaceId, workflowId } = useWorkflowRouteParams();

	const builderSessionId = useAiChatStore((s) => s.builderSessionId);
	const hydratedSessionId = useAiChatStore((s) => s.hydratedSessionId);
	const pendingMessageId = useAiChatStore((s) => s.pendingMessageId);
	const isThinking = useAiChatStore((s) => s.isThinking);
	const setBuilderContext = useAiChatStore((s) => s.setBuilderContext);
	const applyReadyMessage = useAiChatStore((s) => s.applyReadyMessage);
	const hydrateFromBackend = useAiChatStore((s) => s.hydrateFromBackend);
	const failPending = useAiChatStore((s) => s.failPending);
	const appendTextDelta = useAiChatStore((s) => s.appendTextDelta);
	const pushToolCall = useAiChatStore((s) => s.pushToolCall);
	const resolveToolResult = useAiChatStore((s) => s.resolveToolResult);

	// Guards against applying the same assistant message twice (e.g. realtime and
	// poll both delivering it).
	const appliedMessageIds = useRef<Set<string>>(new Set());

	// Arguments of tool calls currently in flight, keyed by tool_id, so the
	// matching tool_result can be turned into a canvas mutation without waiting
	// for the whole reply.
	const pendingToolArgs = useRef<Map<string, { toolName: string; args: Record<string, unknown> }>>(
		new Map(),
	);

	// Set right before the canvas is overwritten wholesale from the backend
	// (resume-on-mount, or the final reconciliation after an AI reply) so the
	// draft-sync effect below doesn't immediately echo that same state right
	// back to the server as a redundant "manual edit".
	const skipNextSyncRef = useRef(false);
	const lastSyncedDraftRef = useRef<string>('');
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Keep the store's API context in sync with the route.
	useEffect(() => {
		setBuilderContext(workspaceId ?? null, workflowId ?? null);
	}, [workspaceId, workflowId, setBuilderContext]);

	// Resume: when the store points at a backend session we haven't loaded yet
	// (e.g. after a page reload), pull it from the server and rebuild the chat +
	// canvas from that authoritative state.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || builderSessionId === hydratedSessionId) return;

		let cancelled = false;
		WorkflowBuilderService.getSession(workspaceId, builderSessionId)
			.then((session) => {
				if (cancelled) return;
				hydrateFromBackend(session);
				(session.messages ?? []).forEach((m) => {
					if (m.processing_status === 'completed' || m.processing_status === 'failed') {
						appliedMessageIds.current.add(m.id);
					}
				});
				const { nodes, edges } = builderDraftToCanvas({
					nodes: session.nodes_draft ?? [],
					edges: session.edges_draft ?? [],
				});
				if (nodes.length) {
					skipNextSyncRef.current = true;
					dispatch({ type: 'APPLY_BUILDER_DRAFT', nodes, edges });
				}
			})
			.catch(() => {
				/* stale/deleted session — leave the fresh chat as-is */
			});

		return () => {
			cancelled = true;
		};
	}, [workspaceId, builderSessionId, hydratedSessionId, hydrateFromBackend, dispatch]);

	// Turn one successful tool call into an immediate, targeted canvas mutation
	// — the tool's own call arguments carry everything needed (name/config/
	// position); the result is only consulted for AddNodeTool, since the
	// backend auto-generates the node id when the call left it blank.
	const applyToolMutation = (toolId: string, successful: boolean, result: unknown) => {
		const pending = pendingToolArgs.current.get(toolId);
		pendingToolArgs.current.delete(toolId);
		if (!pending || !successful) return;

		const { toolName, args } = pending;

		switch (toolName) {
			case TOOL_ADD_NODE: {
				const type = args.type as string | undefined;
				if (!type) return;
				const resultData = parseToolResult(result);
				const nodeId = (resultData?.node_id as string | undefined) || (args.id as string) || toolId;
				dispatch({
					type: 'BUILDER_ADD_NODE',
					node: builderNodeToCanvas({
						id: nodeId,
						type,
						name: (args.name as string) || type,
						config: (args.config as Record<string, unknown>) ?? {},
						position: (args.position as IBuilderNodePosition) ?? { x: 0, y: 200 },
					}),
				});
				return;
			}
			case TOOL_REMOVE_NODE: {
				const nodeId = args.node_id as string | undefined;
				if (nodeId) dispatch({ type: 'BUILDER_REMOVE_NODE', id: nodeId });
				return;
			}
			case TOOL_UPDATE_NODE: {
				const nodeId = args.node_id as string | undefined;
				if (!nodeId) return;
				dispatch({
					type: 'BUILDER_UPDATE_NODE',
					id: nodeId,
					name: args.name as string | undefined,
					config: args.config as Record<string, unknown> | undefined,
					position: args.position as IBuilderNodePosition | undefined,
				});
				return;
			}
			case TOOL_CONNECT_NODES: {
				const source = args.source as string | undefined;
				const target = args.target as string | undefined;
				if (!source || !target) return;
				dispatch({
					type: 'ADD_EDGE',
					source,
					target,
					sourceHandle: args.source_handle as string | undefined,
					targetHandle: args.target_handle as string | undefined,
				});
				return;
			}
			case TOOL_DISCONNECT_NODES: {
				const source = args.source as string | undefined;
				const target = args.target as string | undefined;
				if (source && target) dispatch({ type: 'BUILDER_REMOVE_EDGE', source, target });
			}
		}
	};

	// Shared handler: surface an assistant result (from realtime or poll) exactly
	// once. Nodes/edges have already been live-applied per tool call as the
	// agent worked — this runs once more as the authoritative reconciliation.
	const applyResult = (event: IBuilderMessageReadyEvent) => {
		if (appliedMessageIds.current.has(event.message.id)) return;
		if (useAiChatStore.getState().ignoredMessageIds.has(event.message.id)) return;
		appliedMessageIds.current.add(event.message.id);

		if (event.error) {
			failPending(event.message?.error_message ?? undefined);
			return;
		}

		applyReadyMessage(event);
		if ((event.draft?.nodes?.length ?? 0) > 0) {
			const { nodes, edges } = builderDraftToCanvas(event.draft);
			skipNextSyncRef.current = true;
			dispatch({ type: 'APPLY_BUILDER_DRAFT', nodes, edges });
		}
	};

	// Realtime path — instant when broadcasting is healthy.
	useEffect(() => {
		if (!echo || !builderSessionId) return;

		const unsubscribe = subscribeToBuilderSession(echo as unknown as IEchoLike, builderSessionId, {
			onReady: applyResult,
			onError: applyResult,
			onTextDelta: (event) => appendTextDelta(event.delta),
			onToolCall: (event) => {
				pendingToolArgs.current.set(event.tool_id, {
					toolName: event.tool_name,
					args: event.arguments,
				});
				pushToolCall(event.tool_id, event.tool_name, event.arguments);
			},
			onToolResult: (event) => {
				resolveToolResult(event.tool_id, event.successful);
				applyToolMutation(event.tool_id, event.successful, event.result);
			},
		});

		return unsubscribe;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [echo, builderSessionId]);

	// Polling fallback — works even when the WebSocket never connects. Waits for
	// the specific assistant message the backend queued (pendingMessageId) to
	// reach a terminal status, so it never applies a stale earlier reply. It
	// only ever sees the final state (no granular tool-call events), which is
	// fine — APPLY_BUILDER_DRAFT reconciles everything in one shot.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || !pendingMessageId || !isThinking) return;

		let cancelled = false;
		const startedAt = Date.now();

		const isTerminal = (m: IBuilderMessage) =>
			m.processing_status === 'completed' || m.processing_status === 'failed';

		const poll = async () => {
			try {
				const session = await WorkflowBuilderService.getSession(workspaceId, builderSessionId);
				if (cancelled) return;

				const target = (session.messages ?? []).find((m) => m.id === pendingMessageId);
				if (target && isTerminal(target)) {
					applyResult({
						message: target,
						draft: { nodes: session.nodes_draft ?? [], edges: session.edges_draft ?? [] },
						version: null,
						session: { id: session.id, title: session.title, status: session.status },
						error: target.processing_status === 'failed',
					});
					return;
				}

				if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
					failPending('The builder took too long to respond. Please try again.');
				}
			} catch {
				/* transient — the next tick will retry */
			}
		};

		void poll();
		const timer = window.setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [workspaceId, builderSessionId, pendingMessageId, isThinking]);

	// Sync manual canvas edits (drag, delete, add from the library, rename,
	// etc.) back into the builder session's draft, debounced, so the AI's next
	// message operates on what's actually on the canvas — not just whatever it
	// last wrote itself. Paused while the AI is mid-turn to avoid racing its
	// own writes to the same session.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || isThinking) return;

		const draft = canvasToBuilderDraft(state.nodes, state.edges);
		const snapshot = JSON.stringify(draft);

		if (skipNextSyncRef.current) {
			skipNextSyncRef.current = false;
			lastSyncedDraftRef.current = snapshot;
			return;
		}
		if (snapshot === lastSyncedDraftRef.current) return;

		if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		syncTimerRef.current = setTimeout(() => {
			lastSyncedDraftRef.current = snapshot;
			WorkflowBuilderService.syncDraft(workspaceId, builderSessionId, draft).catch(() => {
				// Best-effort — the next canvas edit (or the AI's own next turn,
				// which reads live state via read_draft_workflow) will retry.
			});
		}, DRAFT_SYNC_DEBOUNCE_MS);

		return () => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		};
	}, [state.nodes, state.edges, workspaceId, builderSessionId, isThinking]);
};
