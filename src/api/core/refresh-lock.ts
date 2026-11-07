// ============================================================
// Refresh Lock
// ------------------------------------------------------------
// Runs a task while holding a browser-wide lock, so only one tab
// refreshes the token at a time. Where the Web Locks API is missing
// the task just runs, which is how a single tab always behaved.
// ============================================================

const LOCK_NAME = 'a1o1_token_refresh';

export const withRefreshLock = <T>(task: () => Promise<T>): Promise<T> =>
	typeof navigator !== 'undefined' && navigator.locks
		? navigator.locks.request(LOCK_NAME, task)
		: task();
