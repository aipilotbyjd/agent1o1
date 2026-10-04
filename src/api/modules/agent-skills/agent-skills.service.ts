import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type {
	TAgentSkill,
	TCreateAgentSkillDto,
	TUpdateAgentSkillDto,
	TDraftSkillDto,
	TSkillDraft,
	TAgentSkillReference,
	TCreateSkillReferenceDto,
	TUpdateSkillReferenceDto,
	TAgentSkillScript,
	TCreateSkillScriptDto,
	TUpdateSkillScriptDto,
	TSkillSource,
	TCreateSkillSourceDto,
	TPreviewSkillSourceDto,
	TSkillSourcePreview,
	TRepositoryAccess,
	TPublishSkillDto,
	TSkillUpstream,
	TUpdateSkillSourceDto,
	TExportSkillDto,
	TResolveSkillSourceDto,
} from '@/types/agent-skill.type';
import {
	AgentSkillEndpoints as E,
	SkillReferenceEndpoints as R,
	SkillScriptEndpoints as S,
	SkillSourceEndpoints as G,
} from './agent-skills.endpoints';

export const AgentSkillService = {
	copy: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ skill: TAgentSkill }>>(E.copy(ws, id))
			.then(unwrapKey<TAgentSkill>('skill')),
	publish: (ws: string, id: string, body: TPublishSkillDto) =>
		axiosClient
			.post<TApiResponse<{ skill: TAgentSkill }>>(E.publish(ws, id), body)
			.then(unwrapKey<TAgentSkill>('skill')),
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

	draft: (ws: string, payload: TDraftSkillDto) =>
		axiosClient
			.post<TApiResponse<{ draft: TSkillDraft }>>(E.draft(ws), payload)
			.then(unwrapKey<TSkillDraft>('draft')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),
};

export const SkillReferenceService = {
	list: (ws: string, skillId: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ references: TAgentSkillReference[] }>
			>(R.list(ws, skillId), { signal })
			.then(unwrapKey<TAgentSkillReference[]>('references')),

	create: (ws: string, skillId: string, payload: TCreateSkillReferenceDto) =>
		axiosClient
			.post<TApiResponse<{ reference: TAgentSkillReference }>>(R.create(ws, skillId), payload)
			.then(unwrapKey<TAgentSkillReference>('reference')),

	update: (ws: string, skillId: string, id: string, payload: TUpdateSkillReferenceDto) =>
		axiosClient
			.patch<
				TApiResponse<{ reference: TAgentSkillReference }>
			>(R.update(ws, skillId, id), payload)
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

export const SkillSourceService = {
	access: (ws: string, body: { repo: string; branch?: string; credential_id: string }) =>
		axiosClient
			.post<TApiResponse<{ access: TRepositoryAccess }>>(G.access(ws), body)
			.then(unwrapKey<TRepositoryAccess>('access')),
	fork: (ws: string, id: string, body: { credential_id: string; fork_repo?: string }) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.fork(ws, id), body)
			.then(unwrapKey<TSkillSource>('source')),
	completeFork: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.completeFork(ws, id))
			.then(unwrapKey<TSkillSource>('source')),
	cancelFork: (ws: string, id: string) =>
		axiosClient
			.delete<TApiResponse<{ source: TSkillSource }>>(G.fork(ws, id))
			.then(unwrapKey<TSkillSource>('source')),
	upstream: (ws: string, id: string) =>
		axiosClient
			.get<TApiResponse<{ upstream: TSkillUpstream }>>(G.upstream(ws, id))
			.then(unwrapKey<TSkillUpstream>('upstream')),
	applyUpstream: (ws: string, id: string, body: { fork_sha: string; upstream_sha: string }) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.upstream(ws, id), body)
			.then(unwrapKey<TSkillSource>('source')),
	update: (ws: string, id: string, payload: TUpdateSkillSourceDto) =>
		axiosClient
			.patch<TApiResponse<{ source: TSkillSource }>>(G.update(ws, id), payload)
			.then(unwrapKey<TSkillSource>('source')),
	export: (ws: string, id: string, payload: TExportSkillDto) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.export(ws, id), payload)
			.then(unwrapKey<TSkillSource>('source')),
	resolve: (ws: string, id: string, payload: TResolveSkillSourceDto) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.resolve(ws, id), payload)
			.then(unwrapKey<TSkillSource>('source')),

	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sources: TSkillSource[] }>>(G.list(ws), { signal })
			.then(unwrapKey<TSkillSource[]>('sources')),

	create: (ws: string, payload: TCreateSkillSourceDto) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.create(ws), payload)
			.then(unwrapKey<TSkillSource>('source')),

	preview: (ws: string, payload: TPreviewSkillSourceDto) =>
		axiosClient
			.post<TApiResponse<{ preview: TSkillSourcePreview }>>(G.preview(ws), payload)
			.then(unwrapKey<TSkillSourcePreview>('preview')),

	sync: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ source: TSkillSource }>>(G.sync(ws, id))
			.then(unwrapKey<TSkillSource>('source')),

	/** `keepSkills` keeps the synced skills as ordinary, editable ones. */
	remove: (ws: string, id: string, keepSkills: boolean) =>
		axiosClient
			.delete(G.delete(ws, id), { params: keepSkills ? { keep_skills: 1 } : undefined })
			.then(() => undefined),
};
