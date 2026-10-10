import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import type { TLibraryItem, TLibraryListParams } from '@/types/library.type';
import { LibraryService } from './library.service';
import { libraryKeys } from './library.keys';

/** Page by page, newest first; `fetchNextPage` loads older files. */
export const useLibrary = (ws: string, params: TLibraryListParams = {}) =>
	useInfiniteQuery({
		queryKey: libraryKeys.list(ws, params),
		queryFn: ({ pageParam, signal }) =>
			LibraryService.list(ws, { ...params, page: pageParam }, signal),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
		enabled: !!ws,
	});

export const useDownloadLibraryItem = (ws: string) =>
	useMutation({
		mutationFn: (item: Pick<TLibraryItem, 'id' | 'filename'>) =>
			LibraryService.download(ws, item),
		meta: { errorMessage: 'Failed to download the file' },
	});
