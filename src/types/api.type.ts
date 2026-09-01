// Mirrors agent-1o1-ai's App\Http\Responses\ApiResponse.

export type TApiResponse<T> = {
	success: true;
	statusCode: number;
	message: string;
	data: T;
};

export type TPaginationMeta = {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
};

export type TPaginatedResponse<T> = {
	success: true;
	statusCode: number;
	message: string;
	data: T[];
	meta: TPaginationMeta;
};

export type TCursorPaginationMeta = {
	per_page: number;
	next_cursor: string | null;
	prev_cursor: string | null;
	has_more: boolean;
};

export type TCursorPaginatedResponse<T> = {
	success: true;
	statusCode: number;
	message: string;
	data: T[];
	meta: TCursorPaginationMeta;
};

export type TApiError = {
	success: false;
	statusCode: number;
	message: string;
	errors?: Record<string, string[]>;
};

export type TMessageResponse = {
	success: boolean;
	statusCode: number;
	message: string;
};
