import type { AxiosResponse } from 'axios';
import type { TApiResponse, TPaginatedResponse, TCursorPaginatedResponse } from './types';

export const unwrap = <T>(res: AxiosResponse<TApiResponse<T>>): T => res.data.data;

export const unwrapPaginated = <T>(
	res: AxiosResponse<TPaginatedResponse<T>>,
): { data: T[]; meta: TPaginatedResponse<T>['meta'] } => ({
	data: res.data.data,
	meta: res.data.meta,
});

export const unwrapCursorPaginated = <T>(
	res: AxiosResponse<TCursorPaginatedResponse<T>>,
): { data: T[]; meta: TCursorPaginatedResponse<T>['meta'] } => ({
	data: res.data.data,
	meta: res.data.meta,
});
