import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateFolderDto,
	TUpdateFolderDto,
	TMoveWorkflowsDto,
	TMoveAgentsDto,
} from '@/types/folder.type';
import { FolderService } from './folders.service';
import { folderKeys } from './folders.keys';
import { workflowKeys } from '../workflows/workflows.keys';
import { agentKeys } from '../agents/agents.keys';

export const useFolders = (ws: string) =>
	useQuery({
		queryKey: folderKeys.list(ws),
		queryFn: ({ signal }) => FolderService.list(ws, signal),
		enabled: !!ws,
	});

export const useCreateFolder = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateFolderDto) => FolderService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create folder' },
	});
};

export const useUpdateFolder = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateFolderDto }) =>
			FolderService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update folder' },
	});
};

export const useDeleteFolder = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => FolderService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete folder' },
	});
};

export const useMoveWorkflowsToFolder = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TMoveWorkflowsDto) => FolderService.moveWorkflows(ws, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: folderKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to move workflows' },
	});
};

export const useMoveAgentsToFolder = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TMoveAgentsDto) => FolderService.moveAgents(ws, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: folderKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: agentKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to move agents' },
	});
};
