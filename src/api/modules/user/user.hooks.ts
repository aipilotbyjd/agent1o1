import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clearTokens } from '@/api/core';
import type { TUpdateProfileDto, TSwitchWorkspaceDto } from '@/types/auth.type';
import type { TCreateApiKeyDto } from '@/types/auth.type';
import { UserService } from './user.service';
import { userKeys, apiKeyKeys } from './user.keys';

// ============================================================
// User Hooks
// ============================================================

export const useCurrentUser = (enabled = true) =>
	useQuery({
		queryKey: userKeys.current(),
		queryFn: ({ signal }) => UserService.fetchMe(signal),
		enabled,
		staleTime: 5 * 60 * 1000,
	});

export const useUpdateProfile = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateProfileDto) => UserService.updateProfile(payload),
		onSuccess: (user) => qc.setQueryData(userKeys.current(), user),
		meta: { errorMessage: 'Failed to update profile' },
	});
};

export const useSwitchWorkspace = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSwitchWorkspaceDto) => UserService.switchWorkspace(payload),
		onSuccess: (user) => qc.setQueryData(userKeys.current(), user),
		meta: { errorMessage: 'Failed to switch workspace' },
	});
};

export const useUploadAvatar = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => UserService.uploadAvatar(file),
		onSuccess: (user) => qc.setQueryData(userKeys.current(), user),
		meta: { errorMessage: 'Failed to upload avatar' },
	});
};

export const useDeleteAvatar = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => UserService.deleteAvatar(),
		onSuccess: (user) => qc.setQueryData(userKeys.current(), user),
		meta: { errorMessage: 'Failed to remove avatar' },
	});
};

export const useDeleteAccount = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => UserService.destroy(),
		onSuccess: () => {
			clearTokens();
			qc.clear();
		},
		meta: { errorMessage: 'Failed to delete account' },
	});
};

// ─── API keys ────────────────────────────────────────────────

export const useApiKeys = (ws: string) =>
	useQuery({
		queryKey: apiKeyKeys.list(ws),
		queryFn: ({ signal }) => UserService.listApiKeys(ws, signal),
		enabled: !!ws,
	});

export const useCreateApiKey = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateApiKeyDto) => UserService.createApiKey(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create API key' },
	});
};

export const useDeleteApiKey = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => UserService.deleteApiKey(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete API key' },
	});
};
