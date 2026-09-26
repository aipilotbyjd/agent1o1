import { create } from 'zustand';

/** Sections of the builder's Data tab, in the order its sub-nav lists them. */
export type TAgentDataSection = 'knowledge' | 'memory' | 'versions';

/**
 * A panel the aside has asked the Agent Builder to reveal.
 *
 * `AgentAside` renders as a sibling of the builder's `<Outlet />` (see
 * `layouts/Agent.layout.tsx`), so it cannot reach into the builder's settings
 * drawer directly — same constraint that `agentChat.store.ts` works around for
 * the open session. The aside posts a request here; the builder opens its
 * drawer on the Data tab, and `AgentDataPanel` selects the section and clears
 * the request so a later re-render doesn't re-trigger it.
 */
type TAgentBuilderState = {
	/** Section the aside asked for, or null when there is nothing pending. */
	requestedDataSection: TAgentDataSection | null;
	requestDataSection: (section: TAgentDataSection) => void;
	clearRequestedDataSection: () => void;
};

export const useAgentBuilderStore = create<TAgentBuilderState>((set) => ({
	requestedDataSection: null,
	requestDataSection: (requestedDataSection) => set({ requestedDataSection }),
	clearRequestedDataSection: () => set({ requestedDataSection: null }),
}));
