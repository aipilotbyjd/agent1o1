import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { TListParams } from '@/types/api.type';

// ============================================================
// CRUD Resource Factory
// ------------------------------------------------------------
// Generates the 5 standard CRUD hooks for a workspace-scoped
// resource. Use it for every module that doesn't need custom hook
// behavior — write a custom hook only for the genuinely non-CRUD
// case, alongside the factory output, not instead of it.
//
// Error display is centralized in `query-client.ts`; pass
// `errorMessage` per mutation instead of an `onError` callback.
//
// Example:
//   export const Workspaces = createResource({
//     service: WorkspaceService,
//     keys: workspaceKeys,
//     label: { singular: 'Workspace', plural: 'Workspaces' },
//   });
// ============================================================
export function createResource<T, CreateDto, UpdateDto>(cfg: {
	service: {
		list: (ws: string, params?: TListParams, signal?: AbortSignal) => Promise<T[]>;
		detail: (ws: string, id: string, signal?: AbortSignal) => Promise<T>;
		create: (ws: string, body: CreateDto) => Promise<T>;
		update: (ws: string, id: string, body: UpdateDto) => Promise<T>;
		remove: (ws: string, id: string) => Promise<void>;
	};
	keys: {
		lists: (ws: string) => QueryKey;
		list: (ws: string, params?: TListParams) => QueryKey;
		details: (ws: string) => QueryKey;
		detail: (ws: string, id: string) => QueryKey;
	};
	label: { singular: string; plural: string };
}) {
	const { service, keys, label } = cfg;

	const useList = (ws: string, params?: TListParams) =>
		useQuery({
			queryKey: keys.list(ws, params),
			queryFn: ({ signal }) => service.list(ws, params, signal),
			enabled: !!ws,
		});

	const useDetail = (ws: string, id: string) =>
		useQuery({
			queryKey: keys.detail(ws, id),
			queryFn: ({ signal }) => service.detail(ws, id, signal),
			enabled: !!ws && !!id,
		});

	const useCreate = (ws: string) => {
		const qc = useQueryClient();
		return useMutation({
			mutationFn: (body: CreateDto) => service.create(ws, body),
			onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists(ws) }),
			meta: { errorMessage: `Failed to create ${label.singular.toLowerCase()}` },
		});
	};

	const useUpdate = (ws: string) => {
		const qc = useQueryClient();
		return useMutation({
			mutationFn: ({ id, body }: { id: string; body: UpdateDto }) =>
				service.update(ws, id, body),
			onSuccess: (_data, { id }) => {
				qc.invalidateQueries({ queryKey: keys.lists(ws) });
				qc.invalidateQueries({ queryKey: keys.detail(ws, id) });
			},
			meta: { errorMessage: `Failed to update ${label.singular.toLowerCase()}` },
		});
	};

	const useDelete = (ws: string) => {
		const qc = useQueryClient();
		return useMutation({
			mutationFn: (id: string) => service.remove(ws, id),
			onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists(ws) }),
			meta: { errorMessage: `Failed to delete ${label.singular.toLowerCase()}` },
		});
	};

	return { useList, useDetail, useCreate, useUpdate, useDelete };
}
