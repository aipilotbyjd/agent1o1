import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateTagDto, TUpdateTagDto } from '@/types/tag.type';
import { TagService } from './tags.service';
import { tagKeys } from './tags.keys';
import { workflowKeys } from '../workflows/workflows.keys';
import { agentKeys } from '../agents/agents.keys';

/** Workflow and agent lists embed their tags by name/color, so a rename or delete has to refetch them too. */
const invalidateTagged = (qc: ReturnType<typeof useQueryClient>, ws: string) => {
	qc.invalidateQueries({ queryKey: tagKeys.lists(ws) });
	qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) });
	qc.invalidateQueries({ queryKey: agentKeys.lists(ws) });
	qc.invalidateQueries({ queryKey: agentKeys.details(ws) });
};

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
		mutationFn: ({ id, body }: { id: string; body: TUpdateTagDto }) =>
			TagService.update(ws, id, body),
		onSuccess: () => invalidateTagged(qc, ws),
		meta: { errorMessage: 'Failed to update tag' },
	});
};

export const useDeleteTag = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TagService.remove(ws, id),
		onSuccess: () => invalidateTagged(qc, ws),
		meta: { errorMessage: 'Failed to delete tag' },
	});
};
