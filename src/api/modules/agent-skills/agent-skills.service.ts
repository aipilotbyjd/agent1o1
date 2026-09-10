import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type {
	TAgentSkill,
	TCreateAgentSkillDto,
	TUpdateAgentSkillDto,
	TAgentSkillReference,
	TCreateSkillReferenceDto,
	TUpdateSkillReferenceDto,
	TAgentSkillScript,
	TCreateSkillScriptDto,
	TUpdateSkillScriptDto,
} from '@/types/agent-skill.type';
import {
	AgentSkillEndpoints as E,
	SkillReferenceEndpoints as R,
	SkillScriptEndpoints as S,
} from './agent-skills.endpoints';

export const AgentSkillService = {
	list: (ws: string, _params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ skills: TAgentSkill[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TAgentSkill[]>('skills')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ skill: TAgentSkill }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TAgentSkill>('skill')),

	create: (ws: string, payload: TCreateAgentSkillDto) =>
		axiosClient
			.post<TApiResponse<{ skill: TAgentSkill }>>(E.create(ws), payload)
			.then(unwrapKey<TAgentSkill>('skill')),

	update: (ws: string, id: string, payload: TUpdateAgentSkillDto) =>
		axiosClient
			.patch<TApiResponse<{ skill: TAgentSkill }>>(E.update(ws, id), payload)
			.then(unwrapKey<TAgentSkill>('skill')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};

export const SkillReferenceService = {
	list: (ws: string, skillId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ references: TAgentSkillReference[] }>>(R.list(ws, skillId), { signal })
			.then(unwrapKey<TAgentSkillReference[]>('references')),

	create: (ws: string, skillId: string, payload: TCreateSkillReferenceDto) =>
		axiosClient
			.post<TApiResponse<{ reference: TAgentSkillReference }>>(R.create(ws, skillId), payload)
			.then(unwrapKey<TAgentSkillReference>('reference')),

	update: (ws: string, skillId: string, id: string, payload: TUpdateSkillReferenceDto) =>
		axiosClient
			.patch<TApiResponse<{ reference: TAgentSkillReference }>>(R.update(ws, skillId, id), payload)
			.then(unwrapKey<TAgentSkillReference>('reference')),

	remove: (ws: string, skillId: string, id: string) =>
		axiosClient.delete(R.delete(ws, skillId, id)).then(() => undefined),
};

export const SkillScriptService = {
	list: (ws: string, skillId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ scripts: TAgentSkillScript[] }>>(S.list(ws, skillId), { signal })
			.then(unwrapKey<TAgentSkillScript[]>('scripts')),

	create: (ws: string, skillId: string, payload: TCreateSkillScriptDto) =>
		axiosClient
			.post<TApiResponse<{ script: TAgentSkillScript }>>(S.create(ws, skillId), payload)
			.then(unwrapKey<TAgentSkillScript>('script')),

	update: (ws: string, skillId: string, id: string, payload: TUpdateSkillScriptDto) =>
		axiosClient
			.patch<TApiResponse<{ script: TAgentSkillScript }>>(S.update(ws, skillId, id), payload)
			.then(unwrapKey<TAgentSkillScript>('script')),

	remove: (ws: string, skillId: string, id: string) =>
		axiosClient.delete(S.delete(ws, skillId, id)).then(() => undefined),
};
