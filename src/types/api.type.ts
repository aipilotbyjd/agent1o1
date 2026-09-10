// ============================================================
// Common API Types
// ------------------------------------------------------------
// Shared envelope and pagination shapes used by every module.
// Every response is `{ success, statusCode, message, data }` —
// most resource endpoints nest their payload one level deeper
// under a singular/plural key (`{ workflow: {...} }`), which each
// module's service unwraps with `unwrapKey`, not this envelope.
// ============================================================

export type TApiResponse<T> = {
	success: boolean;
	statusCode: number;
	message: string;
	data: T;
};

export type TMessageResponse = {
	success: boolean;
	statusCode: number;
	message: string;
	data: null;
};

export type TApiError = {
	success: false;
	statusCode: number;
	message: string;
	errors?: Record<string, string[]>;
};

// ─── Pagination ──────────────────────────────────────────────

/** `ApiResponse::paginated()` — `data` sits flat in the envelope, `meta`
 *  alongside it, for the handful of endpoints that page internally
 *  (runs, trigger events, notifications). */
export type TPaginationMeta = {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
};

/** `ApiResponse::cursorPaginated()` — for the one endpoint (Stripe
 *  invoices) that can't be offset-paginated. */
export type TCursorPaginationMeta = {
	per_page: number;
	next_cursor: string | null;
	prev_cursor: string | null;
	has_more: boolean;
};

export type TListParams = {
	page?: number;
	per_page?: number;
	[key: string]: unknown;
};

// ─── Shared primitives ───────────────────────────────────────

export type TId = string;
