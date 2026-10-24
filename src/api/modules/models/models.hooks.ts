import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TUpdateWorkspaceModelSettingsDto } from '@/types/model-settings.type';
import { catalogKeys } from '@/api/modules/catalog';
import { ModelService } from './models.service';
import { modelKeys } from './models.keys';

export const useWorkspaceModelSettings = (ws: string) =>
	useQuery({
		queryKey: modelKeys.settings(ws),
		queryFn: ({ signal }) => ModelService.settings(ws, signal),
		enabled: !!ws,
	});

/** The default and allow-list change what every picker shows, so the catalog is refetched. */
export const useUpdateWorkspaceModelSettings = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateWorkspaceModelSettingsDto) =>
			ModelService.updateSettings(ws, payload),
		onSuccess: (settings) => {
			qc.setQueryData(modelKeys.settings(ws), settings);
			qc.invalidateQueries({ queryKey: catalogKeys.modelCatalogs() });
		},
		meta: { errorMessage: 'Failed to update model settings' },
	});
};

/**
 * A trial is billed, so a failure is shown where the trial was run, not as a
 * toast. A failed trial may have just taken a rejected key out of use, so the
 * catalog is refetched to stop showing it as "your key".
 */
export const useTryModel = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ slug, prompt }: { slug: string; prompt: string }) =>
			ModelService.trial(ws, slug, prompt),
		onError: () => qc.invalidateQueries({ queryKey: catalogKeys.modelCatalogs() }),
		meta: { silent: true },
	});
};
