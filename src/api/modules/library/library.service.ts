import { axiosClient } from '@/api/client';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type { TLibraryItem, TLibraryListParams } from '@/types/library.type';
import { LibraryEndpoints as E } from './library.endpoints';

export const LibraryService = {
	list: (ws: string, params: TLibraryListParams & { page?: number }, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<TLibraryItem[]> & { meta: TPaginationMeta }
			>(E.list(ws), { params, signal })
			.then((r) => ({ items: r.data.data, meta: r.data.meta })),

	/** The file itself, to attach to a new message like a fresh upload. */
	fetchFile: async (ws: string, item: Pick<TLibraryItem, 'id' | 'filename' | 'mime_type'>) => {
		const response = await axiosClient.get(E.download(ws, item.id), { responseType: 'blob' });
		return new File([response.data as Blob], item.filename, { type: item.mime_type });
	},

	/** Fetched with the API token, then saved — a plain link would carry no auth. */
	download: async (ws: string, item: Pick<TLibraryItem, 'id' | 'filename'>) => {
		const response = await axiosClient.get(E.download(ws, item.id), { responseType: 'blob' });
		const url = URL.createObjectURL(response.data as Blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = item.filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	},
};
