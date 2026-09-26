import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkflowBuilderService } from '@/api/modules/workflow-builder/workflow-builder.service';
import { isSessionQueued } from '@/types/workflow-builder.type';
import type {
	IBuilderMessage,
	IBuilderMessageAction,
	IBuilderMessageReadyEvent,
	IBuilderSession,
} from '@/types/workflow-builder.type';

export type TAiChatMode = 'build' | 'ask';

/**
 * One entry in the live "scratchpad" — an ordered timeline of reasoning text
 * and tool calls exactly as they streamed in, rendered directly (no chat
 * bubble) the way Gumloop's builder shows its work.
 */
export type TAiTimelineItem =
	| { kind: 'text'; id: string; text: string }
	| {
			kind: 'tool';
			id: string;
			toolName: string;
			arguments: Record<string, unknown>;
			status: 'running' | 'done' | 'error';
	  };

export type TAiChatMessage = {
	id: string;
	role: 'assistant' | 'user';
	text: string;
	timestamp?: string;
	avatarUrl?: string;
	isThought?: boolean;
	isError?: boolean;
	/** Present on a failed send — lets the transcript offer a one-click Retry. */
	retryPrompt?: string;
	retryMode?: TAiChatMode;
	/**
	 * The live scratchpad (reasoning + tool calls) captured at the moment this
	 * reply finished, so "what the AI did" stays visible/collapsible under the
	 * message instead of disappearing once streaming ends. Populated for
	 * replies received live in this session.
	 */
	timeline?: TAiTimelineItem[];
	/** Lighter-weight equivalent for messages loaded from history — the backend
	 * only persists the before/after diff, not the full reasoning stream. */
	actionsSummary?: IBuilderMessageAction[];
};

export type TAiChatSession = {
	id: string;
	title: string;
	messages: TAiChatMessage[];
	createdAt: number;
	updatedAt: number;
};

type TAiChatState = {
	isChatActive: boolean;
	isThinking: boolean;
	messages: TAiChatMessage[];
	workflowBuildStep: number; // 0 = none, 3 = draft applied
	sessions: TAiChatSession[];
	activeSessionId: string;
	errorText: string | null;

	// Builder backend wiring
	builderSessionId: string | null;
	pendingMessageId: string | null;
	workspaceId: string | null;
	workflowId: string | null;
	// Persisted map of workflow → its builder session, so a reload resumes the
	// same backend conversation instead of showing stale local chat.
	sessionByWorkflow: Record<string, string>;
	// The builder session id the bridge has already hydrated chat/canvas from.
	hydratedSessionId: string | null;

	// Live reply-in-progress: an ordered timeline of reasoning text and tool
	// calls, exactly as they streamed in. The canvas is live-applied per tool
	// call by the bridge as this grows — see useAiBuilderBridge. Reset on every
	// new prompt and once the reply lands (success, failure, or stop).
	streamTimeline: TAiTimelineItem[];

	// Assistant message ids to silently ignore if they arrive after a stop —
	// the backend job isn't actually cancelled (no cancel endpoint exists), so
	// this is what makes "stop" not un-do itself later.
	ignoredMessageIds: Set<string>;

	// Set by the editor once route params are known so the store can call the API.
	setBuilderContext: (workspaceId: string | null, workflowId?: string | null) => void;

	startChat: (initialPrompt: string, mode?: TAiChatMode) => void;
	sendMessage: (prompt: string, mode?: TAiChatMode) => void;
	submitPrompt: (prompt: string, mode?: TAiChatMode) => void;

	// Called by the realtime bridge as a reply streams in.
	appendTextDelta: (delta: string) => void;
	pushToolCall: (id: string, toolName: string, args: Record<string, unknown>) => void;
	resolveToolResult: (id: string, successful: boolean) => void;

	// Called by the realtime bridge when the backend finishes processing.
	applyReadyMessage: (event: IBuilderMessageReadyEvent) => void;
	failPending: (message?: string, retryPrompt?: string, retryMode?: TAiChatMode) => void;
	// Rebuilds chat state from the authoritative backend session (on reload/resume).
	hydrateFromBackend: (session: IBuilderSession) => void;

	/** Soft stop — hides the in-flight reply and ignores it if it lands later. */
	stopThinking: () => void;

	setThinking: (thinking: boolean) => void;
	resetChat: () => void;
	exitChat: () => void;
	newChat: () => void;
	loadSession: (id: string) => void;
	deleteSession: (id: string) => void;
	/** Switch to a backend builder session; the editor bridge then rehydrates
	 *  the chat and canvas from it. */
	openBuilderSession: (id: string) => void;
};

const makeId = () => `ai_msg_${Math.random().toString(36).slice(2, 9)}`;
const makeSessionId = () => `ai_session_${Math.random().toString(36).slice(2, 9)}`;

const getCurrentTimeStr = () => {
	const now = new Date();
	let hours = now.getHours();
	const minutes = now.getMinutes().toString().padStart(2, '0');
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	return `${hours}:${minutes} ${ampm}`;
};

const WELCOME_MESSAGE: TAiChatMessage = {
	id: 'welcome',
	role: 'assistant',
	text: "Hey! I'm your Workflow Builder. How can I help? Tell me about your idea, and I'll help you build it.",
	timestamp: getCurrentTimeStr(),
};

const makeTitle = (prompt: string) => {
	const clean = prompt.trim().replace(/\s+/g, ' ');
	return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || 'New chat';
};

/** Stable key for the per-workflow builder-session map. */
const workflowKey = (workflowId: string | null) => workflowId ?? '__default__';

const formatTs = (iso?: string) => {
	if (!iso) return getCurrentTimeStr();
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? getCurrentTimeStr() : formatTime(d);
};

const formatTime = (d: Date) => {
	let hours = d.getHours();
	const minutes = d.getMinutes().toString().padStart(2, '0');
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12 || 12;
	return `${hours}:${minutes} ${ampm}`;
};

/** Map a backend builder message into the chat UI shape. */
const mapBackendMessage = (m: IBuilderMessage): TAiChatMessage => ({
	id: m.id,
	role: m.role === 'user' ? 'user' : 'assistant',
	text: m.processing_status === 'failed' ? (m.error_message ?? 'Something went wrong.') : m.content,
	timestamp: formatTs(m.created_at),
	isError: m.processing_status === 'failed',
	actionsSummary: m.actions && m.actions.length > 0 ? m.actions : undefined,
});

const INITIAL_SESSION_ID = makeSessionId();

/** Persists the current session's messages/title/updatedAt back into the sessions list. */
const syncActiveSessionIntoList = (
	sessions: TAiChatSession[],
	activeSessionId: string,
	messages: TAiChatMessage[],
): TAiChatSession[] => {
	const idx = sessions.findIndex((s) => s.id === activeSessionId);
	const firstUserMsg = messages.find((m) => m.role === 'user');
	const title = firstUserMsg ? makeTitle(firstUserMsg.text) : 'New chat';

	if (idx === -1) {
		return [
			{ id: activeSessionId, title, messages, createdAt: Date.now(), updatedAt: Date.now() },
			...sessions,
		];
	}

	const updated = [...sessions];
	updated[idx] = { ...updated[idx], title, messages, updatedAt: Date.now() };
	return updated;
};

export const useAiChatStore = create<TAiChatState>()(
	persist(
		(set, get) => ({
			isChatActive: false,
			isThinking: false,
			messages: [WELCOME_MESSAGE],
			workflowBuildStep: 0,
			sessions: [],
			activeSessionId: INITIAL_SESSION_ID,
			errorText: null,
			builderSessionId: null,
			pendingMessageId: null,
			workspaceId: null,
			workflowId: null,
			sessionByWorkflow: {},
			hydratedSessionId: null,
			streamTimeline: [],
			ignoredMessageIds: new Set(),

			setBuilderContext: (workspaceId, workflowId) =>
				set((state) => {
					const wfId = workflowId ?? null;
					// Resolve the builder session bound to this workflow (if any) so a
					// reload or workflow switch resumes the correct conversation.
					const resumed = state.sessionByWorkflow[workflowKey(wfId)] ?? null;
					const switched = resumed !== state.builderSessionId;

					return {
						workspaceId,
						workflowId: wfId,
						builderSessionId: resumed,
						// If we switched to a different session, force re-hydration and
						// clear stale live chat until the backend session loads.
						...(switched
							? {
									hydratedSessionId: null,
									pendingMessageId: null,
									isThinking: false,
									messages: [WELCOME_MESSAGE],
									isChatActive: false,
									workflowBuildStep: 0,
									errorText: null,
									streamTimeline: [],
								}
							: {}),
					};
				}),

			startChat: (initialPrompt, mode) => {
				const clean = initialPrompt.trim();
				if (!clean) return;

				const userMsg: TAiChatMessage = {
					id: makeId(),
					role: 'user',
					text: clean,
					timestamp: getCurrentTimeStr(),
				};

				const messages = [WELCOME_MESSAGE, userMsg];
				set((state) => ({
					isChatActive: true,
					isThinking: true,
					errorText: null,
					workflowBuildStep: 0,
					builderSessionId: null, // fresh conversation → new backend session
					streamTimeline: [],
					messages,
					sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
				}));

				get().submitPrompt(clean, mode);
			},

			sendMessage: (prompt, mode) => {
				const clean = prompt.trim();
				if (!clean) return;

				const userMsg: TAiChatMessage = {
					id: makeId(),
					role: 'user',
					text: clean,
					timestamp: getCurrentTimeStr(),
				};

				const messages = [...get().messages, userMsg];
				set((state) => ({
					isChatActive: true,
					isThinking: true,
					errorText: null,
					streamTimeline: [],
					messages,
					sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
				}));

				get().submitPrompt(clean, mode);
			},

			/**
			 * Fire the prompt at the backend builder. Creates a session on the first
			 * message, then reuses it for follow-ups. The assistant reply + generated
			 * nodes arrive asynchronously over the `builder.session.*` realtime channel
			 * (handled by the editor's builder bridge), so we only start the request
			 * here and surface transport-level failures.
			 */
			submitPrompt: (prompt, mode) => {
				const { workspaceId, workflowId, builderSessionId } = get();

				if (!workspaceId) {
					get().failPending('No active workspace — open a workspace to build workflows.', prompt, mode);
					return;
				}

				// "Ask" mode sends the same message but tells the builder not to touch
				// the canvas — the displayed chat bubble stays the clean prompt text.
				const apiPrompt =
					mode === 'ask'
						? `[Ask mode: answer the question below about this workflow. Do not add, remove, or modify any nodes or connections — just explain.]\n\n${prompt}`
						: prompt;

				const request = builderSessionId
					? WorkflowBuilderService.sendMessage(workspaceId, builderSessionId, {
							message: apiPrompt,
						}).then((res) => set({ pendingMessageId: res.message_id }))
					: WorkflowBuilderService.createSession(workspaceId, {
							prompt: apiPrompt,
							workflow_id: workflowId ?? undefined,
						}).then((res) => {
							const newId = isSessionQueued(res) ? res.session_id : res.id;
							set((state) => ({
								builderSessionId: newId,
								hydratedSessionId: newId, // freshly created — nothing to re-hydrate
								pendingMessageId: isSessionQueued(res) ? res.message_id : null,
								sessionByWorkflow: {
									...state.sessionByWorkflow,
									[workflowKey(workflowId)]: newId,
								},
							}));
						});

				Promise.resolve(request).catch((error: unknown) => {
					const message =
						(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
						'Could not reach the workflow builder. Please try again.';
					get().failPending(message, prompt, mode);
				});
			},

			appendTextDelta: (delta) =>
				set((state) => {
					const timeline = state.streamTimeline;
					const last = timeline[timeline.length - 1];
					if (last && last.kind === 'text') {
						return {
							streamTimeline: [
								...timeline.slice(0, -1),
								{ ...last, text: last.text + delta },
							],
						};
					}
					return { streamTimeline: [...timeline, { kind: 'text', id: makeId(), text: delta }] };
				}),

			pushToolCall: (id, toolName, args) =>
				set((state) => ({
					streamTimeline: [
						...state.streamTimeline,
						{ kind: 'tool', id, toolName, arguments: args, status: 'running' },
					],
				})),

			resolveToolResult: (id, successful) =>
				set((state) => ({
					streamTimeline: state.streamTimeline.map((item) =>
						item.kind === 'tool' && item.id === id
							? { ...item, status: successful ? 'done' : 'error' }
							: item,
					),
				})),

			applyReadyMessage: (event) => {
				set((state) => {
					// Avoid duplicating a message we've already appended.
					if (state.messages.some((m) => m.id === event.message.id)) {
						return { isThinking: false, streamTimeline: [] };
					}

					// Carry the live scratchpad over onto the finished message so
					// "what the AI did" stays visible (collapsed) instead of
					// vanishing the moment streaming ends.
					const assistantMsg: TAiChatMessage = {
						id: event.message.id,
						role: 'assistant',
						text: event.message.content,
						timestamp: getCurrentTimeStr(),
						timeline: state.streamTimeline.length > 0 ? state.streamTimeline : undefined,
						actionsSummary:
							event.message.actions && event.message.actions.length > 0
								? event.message.actions
								: undefined,
					};

					const messages = [...state.messages, assistantMsg];
					return {
						isThinking: false,
						errorText: null,
						builderSessionId: event.session.id,
						pendingMessageId: null,
						workflowBuildStep: (event.draft?.nodes?.length ?? 0) > 0 ? 3 : 0,
						streamTimeline: [],
						messages,
						sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
					};
				});
			},

			failPending: (message, retryPrompt, retryMode) => {
				const text = message ?? 'Something went wrong generating the workflow.';
				set((state) => {
					const errMsg: TAiChatMessage = {
						id: makeId(),
						role: 'assistant',
						text,
						timestamp: getCurrentTimeStr(),
						isError: true,
						retryPrompt,
						retryMode,
					};
					const messages = [...state.messages, errMsg];
					return {
						isThinking: false,
						errorText: text,
						pendingMessageId: null,
						streamTimeline: [],
						messages,
						sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
					};
				});
			},

			hydrateFromBackend: (session) => {
				const backendMsgs = (session.messages ?? []).filter(
					(m) => m.role === 'user' || m.processing_status === 'completed' || m.processing_status === 'failed',
				);
				const messages: TAiChatMessage[] = [WELCOME_MESSAGE, ...backendMsgs.map(mapBackendMessage)];

				// If the newest message is still processing, keep the thinking state so
				// the poll/realtime picks it up and appends the reply.
				const last = (session.messages ?? [])[session.messages!.length - 1];
				const stillPending =
					!!last &&
					last.role === 'assistant' &&
					(last.processing_status === 'pending' || last.processing_status === 'processing');

				set((state) => ({
					builderSessionId: session.id,
					hydratedSessionId: session.id,
					isChatActive: backendMsgs.some((m) => m.role === 'user'),
					isThinking: stillPending,
					pendingMessageId: stillPending ? last.id : null,
					workflowBuildStep: (session.nodes_draft?.length ?? 0) > 0 ? 3 : 0,
					errorText: null,
					messages,
					sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
				}));
			},

			stopThinking: () => {
				set((state) => {
					const nextIgnored = new Set(state.ignoredMessageIds);
					if (state.pendingMessageId) nextIgnored.add(state.pendingMessageId);
					return {
						isThinking: false,
						pendingMessageId: null,
						streamTimeline: [],
						ignoredMessageIds: nextIgnored,
					};
				});
			},

			setThinking: (thinking) => set({ isThinking: thinking }),

			resetChat: () => {
				const messages = [{ ...WELCOME_MESSAGE, timestamp: getCurrentTimeStr() }];
				set((state) => ({
					isThinking: false,
					workflowBuildStep: 0,
					errorText: null,
					builderSessionId: null,
					streamTimeline: [],
					messages,
					sessions: syncActiveSessionIntoList(state.sessions, state.activeSessionId, messages),
				}));
			},

			exitChat: () => {
				set({
					isChatActive: false,
					isThinking: false,
					workflowBuildStep: 0,
					errorText: null,
					builderSessionId: null,
					streamTimeline: [],
					messages: [WELCOME_MESSAGE],
				});
			},

			/** Archives the current session and starts a fresh backend conversation. */
			newChat: () => {
				set((state) => {
					const { [workflowKey(state.workflowId)]: _removed, ...rest } = state.sessionByWorkflow;
					return {
						isChatActive: false,
						isThinking: false,
						workflowBuildStep: 0,
						errorText: null,
						builderSessionId: null,
						pendingMessageId: null,
						hydratedSessionId: null,
						streamTimeline: [],
						sessionByWorkflow: rest,
						messages: [WELCOME_MESSAGE],
						activeSessionId: makeSessionId(),
					};
				});
			},

			loadSession: (id) => {
				const session = get().sessions.find((s) => s.id === id);
				if (!session) return;
				set({
					activeSessionId: id,
					messages: session.messages,
					isChatActive: session.messages.some((m) => m.role === 'user'),
					isThinking: false,
					workflowBuildStep: 0,
					errorText: null,
					builderSessionId: null, // continuing an old chat starts a fresh backend session
					streamTimeline: [],
				});
			},

			deleteSession: (id) => {
				set((state) => {
					const sessions = state.sessions.filter((s) => s.id !== id);
					if (state.activeSessionId !== id) return { sessions };

					const newId = makeSessionId();
					return {
						sessions,
						activeSessionId: newId,
						messages: [WELCOME_MESSAGE],
						isChatActive: false,
						isThinking: false,
						workflowBuildStep: 0,
						errorText: null,
						builderSessionId: null,
					};
				});
			},

			openBuilderSession: (id) => {
				set((state) => ({
					builderSessionId: id,
					hydratedSessionId: null,
					pendingMessageId: null,
					isThinking: false,
					isChatActive: false,
					workflowBuildStep: 0,
					errorText: null,
					streamTimeline: [],
					messages: [WELCOME_MESSAGE],
					sessionByWorkflow: { ...state.sessionByWorkflow, [workflowKey(state.workflowId)]: id },
				}));
			},
		}),
		{
			name: 'agent101-ai-chat-history',
			// Persist only the workflow→session binding (so reloads resume the right
			// backend conversation) and the local session list. Live chat state
			// (messages/isChatActive) is NOT persisted — it is rehydrated from the
			// authoritative backend session to avoid showing stale/disconnected chat.
			partialize: (state) => ({
				sessions: state.sessions,
				activeSessionId: state.activeSessionId,
				sessionByWorkflow: state.sessionByWorkflow,
			}),
		},
	),
);
