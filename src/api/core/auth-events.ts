// ============================================================
// Auth Events
// ------------------------------------------------------------
// The API layer announces session state changes; the app shell
// decides what to do about them. Nothing under `src/api/**` should
// ever touch `window.location` or navigation directly — a hard
// redirect destroys router state and any in-flight UI work.
// ============================================================
export type TAuthEvent = 'session-expired' | 'signed-out';

const listeners = new Set<(event: TAuthEvent) => void>();

export const authEvents = {
	emit: (event: TAuthEvent) => listeners.forEach((listener) => listener(event)),
	subscribe: (listener: (event: TAuthEvent) => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};
