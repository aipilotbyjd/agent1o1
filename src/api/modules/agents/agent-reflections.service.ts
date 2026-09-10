import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TReflectionSettings, TUpdateReflectionSettingsDto, TReflectionRun, TReflection } from '@/types/agent.type';
import { AgentReflectionEndpoints as E } from './agents.endpoints';

export const AgentReflectionSettingsService = {
	show: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ settings: TReflectionSettings }>>(E.settings(ws, agentId), { signal })
			.then(unwrapKey<TReflectionSettings>('settings')),

	update: (ws: string, agentId: string, payload: TUpdateReflectionSettingsDto) =>
		axiosClient
			.patch<TApiResponse<{ settings: TReflectionSettings }>>(E.updateSettings(ws, agentId), payload)
			.then(unwrapKey<TReflectionSettings>('settings')),
};

export const AgentReflectionRunService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ runs: TReflectionRun[] }>>(E.runs(ws, agentId), { signal })
			.then(unwrapKey<TReflectionRun[]>('runs')),

	detail: (ws: string, agentId: string, runId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ run: TReflectionRun }>>(E.run(ws, agentId, runId), { signal })
			.then(unwrapKey<TReflectionRun>('run')),

	/** Manually kicks off a reflection run outside its cron schedule. */
	create: (ws: string, agentId: string) =>
		axiosClient
			.post<TApiResponse<{ run: TReflectionRun }>>(E.createRun(ws, agentId))
			.then(unwrapKey<TReflectionRun>('run')),
};

export const AgentReflectionService = {
	list: (ws: string, agentId: string, params?: { status?: string }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ reflections: TReflection[] }>>(E.list(ws, agentId), { params, signal })
			.then(unwrapKey<TReflection[]>('reflections')),

	detail: (ws: string, agentId: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ reflection: TReflection }>>(E.detail(ws, agentId, id), { signal })
			.then(unwrapKey<TReflection>('reflection')),

	apply: (ws: string, agentId: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ reflection: TReflection }>>(E.apply(ws, agentId, id))
			.then(unwrapKey<TReflection>('reflection')),

	dismiss: (ws: string, agentId: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ reflection: TReflection }>>(E.dismiss(ws, agentId, id))
			.then(unwrapKey<TReflection>('reflection')),
};
