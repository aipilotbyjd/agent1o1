import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useRealtime } from '@/context/realtime';
import { ApiError, notify } from '@/api/core';
import { useAiChatStore } from '@/store/aiChat.store';
import {
	WorkflowBuilderMessageService,
	WorkflowBuilderSessionService,
} from '@/api/modules/workflow-builder/workflow-builder.service';
import {
	subscribeToBuilderSession,
	type IEchoLike,
} from '@/api/modules/workflow-builder/workflow-builder.realtime';
import type { TBuilderMessage, TBuilderSession } from '@/types/workflow-builder.type';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useWorkflowRouteParams } from './useWorkflowRouteParams.hook';
import { builderGraphToCanvas, canvasToBuilderGraph } from '../_helper/builderDraft.helper';

const POLL_INTERVAL_MS = 2500;
/** Comfortably above the backend job's 300s timeout. */
const POLL_TIMEOUT_MS = 6 * 60_000;
const DRAFT_SYNC_DEBOUNCE_MS = 1500;

/** The session's draft version the canvas was last reconciled with — what a
 *  canvas sync (or a restore) must send so the server can refuse a stale one.
 *  Kept in the store so the builder panel can send it too. */
const getLockVersion = () => useAiChatStore.getState().draftLockVersion;
const setLockVersion = (draftLockVersion: number | null) =>
	useAiChatStore.setState({ draftLockVersion });

const isTerminal = (message: TBuilderMessage) =>
	message.processing_status === 'completed' || message.processing_status === 'failed';

/** Tool-call arguments arrive as an object, or as a capped JSON string. */
const parseArguments = (value: unknown): Record<string, unknown> => {
	if (value && typeof value === 'object') return value as Record<string, unknown>;
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return parsed && typeof parsed === 'object' ? parsed : {};
		} catch {
			return {};
		}
	}
	return {};
};

/**
 * Connects the AI chat store, the backend builder session and the canvas.
 *
 * - The assistant's reply streams in over the session's private channel
 *   (`builder.delta`, `builder.tool-call`, `builder.tool-result`); each draft
 *   change (`builder.draft`) refetches the session and applies it to the
 *   canvas, so nodes appear as the assistant adds them. `builder.status`
 *   completes or fails the reply.
 * - A poll on the pending reply covers deploys where the socket never
 *   connects. Whichever delivers first wins; the other is a no-op.
 * - Manual canvas edits are pushed into the session's draft (debounced, and
 *   flushed right before each message) with the draft's lock version, so the
 *   assistant always works from what the user sees — and a canvas that is
 *   behind the assistant gets a 409 instead of silently undoing its work.
 *
 * Mount once inside the editor.
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
	const setBeforeSend = useAiChatStore((s) => s.setBeforeSend);
	const applyReadyMessage = useAiChatStore((s) => s.applyReadyMessage);
	const hydrateFromBackend = useAiChatStore((s) => s.hydrateFromBackend);
	const failPending = useAiChatStore((s) => s.failPending);
	const appendTextDelta = useAiChatStore((s) => s.appendTextDelta);
	const pushToolCall = useAiChatStore((s) => s.pushToolCall);
	const resolveToolResult = useAiChatStore((s) => s.resolveToolResult);

	// Latest canvas, read from callbacks that outlive a render.
	const canvasRef = useRef({ nodes: state.nodes, edges: state.edges });
	useLayoutEffect(() => {
		canvasRef.current = { nodes: state.nodes, edges: state.edges };
	});

	// The draft (as JSON) last known to match the server, so an unchanged
	// canvas isn't synced back.
	const lastSyncedRef = useRef('');
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Replies already shown — realtime and the poll can both deliver one.
	const finalizedMessageIds = useRef<Set<string>>(new Set());

	// One draft refetch at a time; a change that lands mid-fetch queues one more.
	const refreshingRef = useRef(false);
	const refreshAgainRef = useRef(false);

	useEffect(() => {
		setBuilderContext(workspaceId ?? null, workflowId ?? null);
	}, [workspaceId, workflowId, setBuilderContext]);

	/** Put the server's draft on the canvas, keeping the user's layout. */
	const applySessionDraft = useCallback(
		(session: TBuilderSession) => {
			setLockVersion(session.draft_lock_version);
			const next = builderGraphToCanvas(session.draft_graph, canvasRef.current.nodes);
			lastSyncedRef.current = JSON.stringify(canvasToBuilderGraph(next.nodes, next.edges));
			if (next.nodes.length === 0 && canvasRef.current.nodes.length === 0) return;
			dispatch({ type: 'APPLY_BUILDER_DRAFT', nodes: next.nodes, edges: next.edges });
		},
		[dispatch],
	);

	const refreshDraft = useCallback(async () => {
		const sessionId = useAiChatStore.getState().builderSessionId;
		if (!workspaceId || !sessionId) return;

		if (refreshingRef.current) {
			refreshAgainRef.current = true;
			return;
		}

		refreshingRef.current = true;
		try {
			do {
				refreshAgainRef.current = false;
				const currentSessionId = useAiChatStore.getState().builderSessionId;
				if (!currentSessionId) break;
				try {
					const session = await WorkflowBuilderSessionService.detail(
						workspaceId,
						currentSessionId,
					);
					applySessionDraft(session);
				} catch {
					/* the next draft event or the final reconciliation retries */
				}
			} while (refreshAgainRef.current);
		} finally {
			refreshingRef.current = false;
		}
	}, [workspaceId, applySessionDraft]);

	/** Show a finished reply exactly once, with the draft it left behind. */
	const finalizeReply = useCallback(
		async (messageId: string) => {
			const sessionId = useAiChatStore.getState().builderSessionId;
			if (!workspaceId || !sessionId || finalizedMessageIds.current.has(messageId)) return;
			if (useAiChatStore.getState().ignoredMessageIds.has(messageId)) return;

			const session = await WorkflowBuilderSessionService.detail(workspaceId, sessionId);
			const reply = session.messages?.find((message) => message.id === messageId);
			if (!reply || !isTerminal(reply) || finalizedMessageIds.current.has(messageId)) return;

			finalizedMessageIds.current.add(messageId);
			applySessionDraft(session);

			if (reply.processing_status === 'failed') {
				failPending(reply.error_message ?? undefined);
				return;
			}
			applyReadyMessage(reply);
		},
		[workspaceId, applySessionDraft, applyReadyMessage, failPending],
	);

	/**
	 * Push the canvas into the draft if it differs from what the server has.
	 * On 409 the assistant (or another tab) changed the draft since: its
	 * version wins and is reloaded, rather than overwritten by a stale canvas.
	 */
	const syncCanvas = useCallback(
		async (sessionId: string) => {
			const lockVersion = getLockVersion();
			if (!workspaceId || lockVersion === null) return;

			const graph = canvasToBuilderGraph(canvasRef.current.nodes, canvasRef.current.edges);
			const snapshot = JSON.stringify(graph);
			if (snapshot === lastSyncedRef.current) return;

			try {
				const session = await WorkflowBuilderSessionService.syncDraft(
					workspaceId,
					sessionId,
					{
						...graph,
						draft_lock_version: lockVersion,
					},
				);
				setLockVersion(session.draft_lock_version);
				lastSyncedRef.current = snapshot;
			} catch (error) {
				if (ApiError.is(error) && error.isConflict) {
					const session = await WorkflowBuilderSessionService.detail(
						workspaceId,
						sessionId,
					);
					applySessionDraft(session);
					notify.info('The assistant changed the draft — reloaded its latest version.');
					return;
				}
				// 422: the canvas is mid-edit (e.g. a node missing a required
				// setting). Remember it so it isn't resent until it changes.
				lastSyncedRef.current = snapshot;
			}
		},
		[workspaceId, applySessionDraft],
	);

	// Before each message: make sure the draft is what's on the canvas. A
	// session created for this message starts from the *saved* workflow, which
	// may be a moment behind the canvas.
	useEffect(() => {
		setBeforeSend(async (sessionId, created) => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
			if (created) {
				setLockVersion(created.draft_lock_version);
				lastSyncedRef.current = JSON.stringify(created.draft_graph);
			}
			await syncCanvas(sessionId);
		});
		return () => setBeforeSend(null);
	}, [setBeforeSend, syncCanvas]);

	// Resume: when the store points at a session we haven't loaded (a reload,
	// or picking one from history), rebuild the chat and canvas from it.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || builderSessionId === hydratedSessionId) return;

		let cancelled = false;
		WorkflowBuilderSessionService.detail(workspaceId, builderSessionId)
			.then((session) => {
				if (cancelled) return;
				(session.messages ?? [])
					.filter(isTerminal)
					.forEach((m) => finalizedMessageIds.current.add(m.id));
				hydrateFromBackend(session);

				// An empty draft never replaces a canvas with work on it (e.g. the
				// first sync never landed) — that would blank the canvas and let
				// autosave blank the workflow. Keep the canvas and push it up.
				const canvasHasNodes =
					canvasToBuilderGraph(canvasRef.current.nodes, []).nodes.length > 0;
				if (session.draft_graph.nodes.length === 0 && canvasHasNodes) {
					setLockVersion(session.draft_lock_version);
					lastSyncedRef.current = JSON.stringify(session.draft_graph);
					void syncCanvas(session.id);
					return;
				}
				applySessionDraft(session);
			})
			.catch(() => {
				/* stale/deleted session — leave the fresh chat as-is */
			});

		return () => {
			cancelled = true;
		};
	}, [
		workspaceId,
		builderSessionId,
		hydratedSessionId,
		hydrateFromBackend,
		applySessionDraft,
		syncCanvas,
	]);

	// No session (new chat) means no draft version to sync against yet.
	useEffect(() => {
		if (!builderSessionId) setLockVersion(null);
	}, [builderSessionId]);

	// Realtime — instant when broadcasting is healthy.
	useEffect(() => {
		if (!echo || !workspaceId || !builderSessionId) return;

		const isLive = () => useAiChatStore.getState().isThinking;

		return subscribeToBuilderSession(
			echo as unknown as IEchoLike,
			workspaceId,
			builderSessionId,
			{
				onStatus: (event) => {
					if (event.status === 'completed' || event.status === 'failed') {
						void finalizeReply(event.message_id);
					}
				},
				onDelta: (event) => {
					if (isLive()) appendTextDelta(event.delta);
				},
				onToolCall: (event) => {
					if (isLive())
						pushToolCall(event.id, event.name, parseArguments(event.arguments));
				},
				onToolResult: (event) => {
					if (isLive()) resolveToolResult(event.id, event.successful);
				},
				onDraft: () => {
					void refreshDraft();
				},
			},
		);
	}, [
		echo,
		workspaceId,
		builderSessionId,
		finalizeReply,
		refreshDraft,
		appendTextDelta,
		pushToolCall,
		resolveToolResult,
	]);

	// Poll fallback — works even when the socket never connects. Watches the
	// specific reply the backend queued, so it never applies an older one.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || !pendingMessageId || !isThinking) return;

		let cancelled = false;
		const startedAt = Date.now();

		const poll = async () => {
			try {
				const reply = await WorkflowBuilderMessageService.detail(
					workspaceId,
					builderSessionId,
					pendingMessageId,
				);
				if (cancelled) return;
				if (isTerminal(reply)) {
					await finalizeReply(reply.id);
					return;
				}
				if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
					failPending('The builder took too long to respond. Please try again.');
				}
			} catch {
				/* transient — the next tick retries */
			}
		};

		const timer = window.setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [workspaceId, builderSessionId, pendingMessageId, isThinking, finalizeReply, failPending]);

	// Manual canvas edits → the session's draft, debounced. Paused while the
	// assistant is mid-turn: it is editing the same draft, and its changes are
	// streaming onto this canvas.
	useEffect(() => {
		if (!workspaceId || !builderSessionId || isThinking) return;

		if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		syncTimerRef.current = setTimeout(
			() => void syncCanvas(builderSessionId),
			DRAFT_SYNC_DEBOUNCE_MS,
		);

		return () => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		};
	}, [state.nodes, state.edges, workspaceId, builderSessionId, isThinking, syncCanvas]);
};
