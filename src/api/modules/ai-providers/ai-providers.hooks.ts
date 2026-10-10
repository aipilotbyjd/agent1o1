import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateAiProviderCredentialDto,
	TUpdateAiProviderCredentialDto,
} from '@/types/ai-provider.type';
import { catalogKeys } from '@/api/modules/catalog';
import { AiProviderService } from './ai-providers.service';
import { aiProviderKeys } from './ai-providers.keys';

// ============================================================
// AI Provider Key Hooks (bring your own key)
// ------------------------------------------------------------
// Every change can make a catalog model usable or unusable for this
// workspace, so the model catalog is refetched along with the keys.
// Create and update leave a 422 to the form: it carries the
// provider's reason for rejecting the key, shown under the field.
// ============================================================

const useInvalidateKeys = (ws: string) => {
	const qc = useQueryClient();
	return () => {
		qc.invalidateQueries({ queryKey: aiProviderKeys.credentials(ws) });
		qc.invalidateQueries({ queryKey: catalogKeys.modelCatalogs() });
	};
};

export const useAiProviders = (ws: string) =>
	useQuery({
		queryKey: aiProviderKeys.providers(ws),
		queryFn: ({ signal }) => AiProviderService.providers(ws, signal),
		enabled: !!ws,
		staleTime: 10 * 60_000,
	});

export const useAiProviderCredentials = (ws: string) =>
	useQuery({
		queryKey: aiProviderKeys.credentials(ws),
		queryFn: ({ signal }) => AiProviderService.credentials(ws, signal),
		enabled: !!ws,
	});

export const useCreateAiProviderCredential = (ws: string) => {
	const invalidate = useInvalidateKeys(ws);
	return useMutation({
		mutationFn: (payload: TCreateAiProviderCredentialDto) =>
			AiProviderService.create(ws, payload),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to add key', silentStatuses: [422] },
	});
};

export const useUpdateAiProviderCredential = (ws: string) => {
	const invalidate = useInvalidateKeys(ws);
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAiProviderCredentialDto }) =>
			AiProviderService.update(ws, id, body),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to update key', silentStatuses: [422] },
	});
};

export const useDeleteAiProviderCredential = (ws: string) => {
	const invalidate = useInvalidateKeys(ws);
	return useMutation({
		mutationFn: (id: string) => AiProviderService.remove(ws, id),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to remove key' },
	});
};

export const useSetDefaultAiProviderCredential = (ws: string) => {
	const invalidate = useInvalidateKeys(ws);
	return useMutation({
		mutationFn: (id: string) => AiProviderService.setDefault(ws, id),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to set default key' },
	});
};

export const useValidateAiProviderCredential = (ws: string) => {
	const invalidate = useInvalidateKeys(ws);
	return useMutation({
		mutationFn: (id: string) => AiProviderService.validate(ws, id),
		onSuccess: invalidate,
		meta: { errorMessage: 'Failed to check key' },
	});
};
