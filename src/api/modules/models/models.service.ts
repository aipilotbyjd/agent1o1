import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TModelTrial,
	TUpdateWorkspaceModelSettingsDto,
	TWorkspaceModelSettings,
} from '@/types/model-settings.type';
import { ModelEndpoints as E } from './models.endpoints';

export const ModelService = {
	settings: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ settings: TWorkspaceModelSettings }>>(E.settings(ws), { signal })
			.then(unwrapKey<TWorkspaceModelSettings>('settings')),

	updateSettings: (ws: string, payload: TUpdateWorkspaceModelSettingsDto) =>
		axiosClient
			.put<TApiResponse<{ settings: TWorkspaceModelSettings }>>(E.settings(ws), payload)
			.then(unwrapKey<TWorkspaceModelSettings>('settings')),

	trial: (ws: string, slug: string, prompt: string) =>
		axiosClient
			.post<TApiResponse<{ trial: TModelTrial }>>(E.trial(ws, slug), { prompt })
			.then(unwrapKey<TModelTrial>('trial')),
};
