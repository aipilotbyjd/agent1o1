import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateCustomNodeDto, TUpdateCustomNodeDto } from '@/types/node.type';
import { NodeService } from './nodes.service';
import { nodeKeys } from './nodes.keys';

type TNodeListParams = { category?: string; search?: string };

export const useGlobalNodeCatalog = (params?: TNodeListParams) =>
	useQuery({
		queryKey: nodeKeys.globalCatalog(params),
		queryFn: ({ signal }) => NodeService.globalCatalog(params, signal),
		staleTime: 30 * 60_000,
	});

export const useNodes = (ws: string, params?: TNodeListParams) =>
	useQuery({
		queryKey: nodeKeys.list(ws, params),
		queryFn: ({ signal }) => NodeService.list(ws, params, signal),
		enabled: !!ws,
	});

export const useCustomNodes = (ws: string) =>
	useQuery({
		queryKey: nodeKeys.custom(ws),
		queryFn: ({ signal }) => NodeService.custom(ws, signal),
		enabled: !!ws,
	});

export const useRecentlyUsedNodes = (ws: string) =>
	useQuery({
		queryKey: nodeKeys.recentlyUsed(ws),
		queryFn: ({ signal }) => NodeService.recentlyUsed(ws, signal),
		enabled: !!ws,
	});

export const useNode = (ws: string, id: string) =>
	useQuery({
		queryKey: nodeKeys.detail(ws, id),
		queryFn: ({ signal }) => NodeService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateNode = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateCustomNodeDto) => NodeService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: nodeKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create node' },
	});
};

export const useUpdateNode = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateCustomNodeDto }) =>
			NodeService.update(ws, id, body),
		onSuccess: (_node, { id }) => {
			qc.invalidateQueries({ queryKey: nodeKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: nodeKeys.detail(ws, id) });
		},
		meta: { errorMessage: 'Failed to update node' },
	});
};

export const useDeleteNode = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => NodeService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: nodeKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete node' },
	});
};
