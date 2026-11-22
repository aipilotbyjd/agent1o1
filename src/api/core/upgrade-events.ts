// ============================================================
// Upgrade Events
// ------------------------------------------------------------
// A request the plan does not cover (HTTP 402: a plan limit reached,
// credits used up) is announced here instead of shown as an error
// toast, so the app shell can offer the upgrade that unblocks it.
// ============================================================
export type TUpgradeRequest = {
	/** The server's reason, e.g. "Your plan is limited to 2 active triggers…". */
	message: string;
};

const listeners = new Set<(request: TUpgradeRequest) => void>();

export const upgradeEvents = {
	emit: (request: TUpgradeRequest) => listeners.forEach((listener) => listener(request)),
	subscribe: (listener: (request: TUpgradeRequest) => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};
