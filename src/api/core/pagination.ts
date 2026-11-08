import type { AxiosResponse } from 'axios';
import type { TApiResponse, TCursorPaginationMeta, TPaginationMeta } from '@/types/api.type';

// ============================================================
// Cursor pagination
// ------------------------------------------------------------
// `ApiResponse::cursorPaginated()` returns `{ data: T[], meta }` with
// `meta.next_cursor` to pass back as `?cursor=`. The server caps every
// request (default 25, max 100 rows), so a workspace with thousands of
// rows is never loaded in one go.
//
// Two ways to consume it:
//   - `fetchPage` + `useInfiniteQuery` for a list that scrolls or has a
//     "load more" button.
//   - `fetchAllPages` for a picker, search or count that really needs
//     every row: it walks the cursors, one bounded request at a time.
// ============================================================

export type TCursorPage<T> = {
	items: T[];
	meta: TCursorPaginationMeta;
};

export type TCursorParams = {
	cursor?: string | null;
	per_page?: number;
};

/** Largest `per_page` the API accepts. */
export const MAX_PAGE_SIZE = 100;

/** Stops a runaway loop: 50 pages x 100 rows = 5,000 rows per walk. */
const MAX_WALKED_PAGES = 50;

/** Peels one cursor-paginated envelope into `{ items, meta }`. */
export const unwrapCursorPage = <T>(
	res: AxiosResponse<TApiResponse<T[]> & { meta: TCursorPaginationMeta }>,
): TCursorPage<T> => ({ items: res.data.data, meta: res.data.meta });

/** Pass to `useInfiniteQuery({ getNextPageParam })`. */
export const getNextCursor = <T>(page: TCursorPage<T>): string | undefined =>
	page.meta.has_more ? (page.meta.next_cursor ?? undefined) : undefined;

/** Flattens `useInfiniteQuery().data.pages` into one list. */
export const flattenPages = <T>(pages: TCursorPage<T>[] | undefined): T[] =>
	pages?.flatMap((page) => page.items) ?? [];

/**
 * Every row, fetched one capped page at a time. Prefer an infinite query for
 * anything the user scrolls; use this where the whole set is needed up front.
 */
export async function fetchAllPages<T>(
	fetchPage: (
		params: Required<Pick<TCursorParams, 'per_page'>> & TCursorParams,
	) => Promise<TCursorPage<T>>,
	maxPages: number = MAX_WALKED_PAGES,
): Promise<T[]> {
	const rows: T[] = [];
	let cursor: string | undefined;

	for (let fetched = 0; fetched < maxPages; fetched += 1) {
		const page = await fetchPage({ per_page: MAX_PAGE_SIZE, cursor });
		rows.push(...page.items);

		const next = getNextCursor(page);
		if (next === undefined) return rows;
		cursor = next;
	}

	if (import.meta.env.DEV) {
		console.warn(`fetchAllPages stopped after ${maxPages} pages; the list was truncated.`);
	}
	return rows;
}

// ------------------------------------------------------------
// Numbered pages
// ------------------------------------------------------------
// `ApiResponse::paginated()` returns `{ data: T[], meta }` with a `total`.
// Used where the list sorts by something a cursor can't follow and the UI
// shows how many rows match (the workflows page).
// ------------------------------------------------------------

export type TNumberedPage<T> = {
	items: T[];
	meta: TPaginationMeta;
};

/** Peels one numbered-page envelope into `{ items, meta }`. */
export const unwrapNumberedPage = <T>(
	res: AxiosResponse<TApiResponse<T[]> & { meta: TPaginationMeta }>,
): TNumberedPage<T> => ({ items: res.data.data, meta: res.data.meta });

/** Pass to `useInfiniteQuery({ getNextPageParam })`. */
export const getNextPageNumber = <T>(page: TNumberedPage<T>): number | undefined =>
	page.meta.current_page < page.meta.last_page ? page.meta.current_page + 1 : undefined;

/** Every row of a numbered-page list, one capped request per page. */
export async function fetchAllNumberedPages<T>(
	fetchPage: (params: { page: number; per_page: number }) => Promise<TNumberedPage<T>>,
	maxPages: number = MAX_WALKED_PAGES,
): Promise<T[]> {
	const rows: T[] = [];

	for (let page = 1; page <= maxPages; page += 1) {
		const result = await fetchPage({ page, per_page: MAX_PAGE_SIZE });
		rows.push(...result.items);

		if (getNextPageNumber(result) === undefined) return rows;
	}

	if (import.meta.env.DEV) {
		console.warn(
			`fetchAllNumberedPages stopped after ${maxPages} pages; the list was truncated.`,
		);
	}
	return rows;
}
