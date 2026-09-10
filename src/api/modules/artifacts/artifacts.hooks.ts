import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUploadArtifactDto, TUpdateArtifactAccessDto, TShareArtifactDto } from '@/types/artifact.type';
import { ArtifactService } from './artifacts.service';
import { artifactKeys } from './artifacts.keys';

export const useArtifacts = (ws: string, params?: { page?: number; per_page?: number }) =>
	useQuery({
		queryKey: artifactKeys.list(ws, params),
		queryFn: ({ signal }) => ArtifactService.list(ws, params, signal),
		enabled: !!ws,
	});

export const useArtifact = (ws: string, id: string) =>
	useQuery({
		queryKey: artifactKeys.detail(ws, id),
		queryFn: ({ signal }) => ArtifactService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useUploadArtifact = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUploadArtifactDto) => ArtifactService.upload(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: artifactKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to upload artifact' },
	});
};

export const useDeleteArtifact = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => ArtifactService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: artifactKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete artifact' },
	});
};

export const useUpdateArtifactAccess = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateArtifactAccessDto }) =>
			ArtifactService.updateAccess(ws, id, body),
		onSuccess: (_artifact, { id }) => qc.invalidateQueries({ queryKey: artifactKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to update artifact access' },
	});
};

export const useAddArtifactShare = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TShareArtifactDto }) =>
			ArtifactService.addShare(ws, id, body),
		onSuccess: (_artifact, { id }) => qc.invalidateQueries({ queryKey: artifactKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to share artifact' },
	});
};

export const useRemoveArtifactShare = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, userId }: { id: string; userId: string }) =>
			ArtifactService.removeShare(ws, id, userId),
		onSuccess: (_void, { id }) => qc.invalidateQueries({ queryKey: artifactKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to remove share' },
	});
};
