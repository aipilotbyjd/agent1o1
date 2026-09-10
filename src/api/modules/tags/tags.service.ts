import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TTag, TCreateTagDto, TUpdateTagDto } from '@/types/tag.type';
import { TagEndpoints as E } from './tags.endpoints';

export const TagService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ tags: TTag[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TTag[]>('tags')),

	create: (ws: string, payload: TCreateTagDto) =>
		axiosClient
			.post<TApiResponse<{ tag: TTag }>>(E.create(ws), payload)
			.then(unwrapKey<TTag>('tag')),

	update: (ws: string, id: string, payload: TUpdateTagDto) =>
		axiosClient
			.patch<TApiResponse<{ tag: TTag }>>(E.update(ws, id), payload)
			.then(unwrapKey<TTag>('tag')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};
