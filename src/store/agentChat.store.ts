import { create } from 'zustand';

/**
 * The chat the Agent Builder and its aside are both looking at.
 *
 * `AgentAside` renders as a sibling of the builder's `<Outlet />` (see
 * `layouts/Agent.layout.tsx`), so the two cannot share this through the router.
 * The aside lists the agent's past sessions and picks one to open; the builder
 * owns the transcript and, on the first message of a new chat, reports back the
 * session it created so the aside's list picks it up.
 */
type TAgentChatState = {
	/** Agent open in the builder — whose sessions the aside lists. */
	agentId: string | null;
	/** Session on screen. Null for a chat whose first message hasn't been sent. */
	sessionId: string | null;
	/** Set by the builder on load, and again when a draft agent is first saved. */
	setAgentId: (id: string | null) => void;
	/** Open an existing session; the builder replaces the transcript with it. */
	openSession: (id: string) => void;
	/** Start a fresh chat — the session itself is created by the next message. */
	newSession: () => void;
};

export const useAgentChatStore = create<TAgentChatState>((set) => ({
	agentId: null,
	sessionId: null,
	// Switching agents abandons the open session — a session belongs to one agent.
	setAgentId: (agentId) =>
		set((state) => (state.agentId === agentId ? state : { agentId, sessionId: null })),
	openSession: (sessionId) => set({ sessionId }),
	newSession: () => set({ sessionId: null }),
}));
