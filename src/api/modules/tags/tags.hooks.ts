import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateTagDto, TUpdateTagDto } from '@/types/tag.type';
import { TagService } from './tags.service';
import { tagKeys } from './tags.keys';

export const useTags = (ws: string) =>
	useQuery({
		queryKey: tagKeys.list(ws),
		queryFn: ({ signal }) => TagService.list(ws, signal),
		enabled: !!ws,
	});

export const useCreateTag = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateTagDto) => TagService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create tag' },
	});
};

export const useUpdateTag = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateTagDto }) => TagService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update tag' },
	});
};

export const useDeleteTag = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TagService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete tag' },
	});
};
