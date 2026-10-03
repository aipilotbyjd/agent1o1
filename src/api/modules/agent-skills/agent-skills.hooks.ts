import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type {
	TDraftSkillDto,
	TPublishSkillDto,
	TUpdateSkillSourceDto,
	TExportSkillDto,
	TResolveSkillSourceDto,
	TSkillSource,
	TCreateSkillSourceDto,
	TPreviewSkillSourceDto,
	TCreateSkillReferenceDto,
	TUpdateSkillReferenceDto,
	TCreateSkillScriptDto,
	TUpdateSkillScriptDto,
} from '@/types/agent-skill.type';
import {
	AgentSkillService,
	SkillReferenceService,
	SkillScriptService,
	SkillSourceService,
} from './agent-skills.service';
import {
	agentSkillKeys,
	skillReferenceKeys,
	skillScriptKeys,
	skillSourceKeys,
} from './agent-skills.keys';

const Skills = createResource({
	service: AgentSkillService,
	keys: agentSkillKeys,
	label: { singular: 'Skill', plural: 'Skills' },
});

export const useAgentSkills = Skills.useList;
export const useAgentSkill = Skills.useDetail;
export const useCreateAgentSkill = Skills.useCreate;
export const useUpdateAgentSkill = Skills.useUpdate;
export const useDeleteAgentSkill = Skills.useDelete;

/** Generates an unsaved skill from a description; nothing is cached. */
export const useDraftAgentSkill = (ws: string) =>
	useMutation({
		mutationFn: (payload: TDraftSkillDto) => AgentSkillService.draft(ws, payload),
		meta: { errorMessage: 'Failed to generate the skill' },
	});

// References and scripts are nested under a skill (ws + skillId), which
// doesn't fit the ws-only factory shape — hand-written.

export const useSkillReferences = (ws: string, skillId: string) =>
	useQuery({
		queryKey: skillReferenceKeys.list(ws, skillId),
		queryFn: ({ signal }) => SkillReferenceService.list(ws, skillId, signal),
		enabled: !!ws && !!skillId,
	});

export const useCreateSkillReference = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateSkillReferenceDto) =>
			SkillReferenceService.create(ws, skillId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to create reference' },
	});
};

export const useUpdateSkillReference = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateSkillReferenceDto }) =>
			SkillReferenceService.update(ws, skillId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to update reference' },
	});
};

export const useDeleteSkillReference = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkillReferenceService.remove(ws, skillId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to delete reference' },
	});
};

export const useSkillScripts = (ws: string, skillId: string) =>
	useQuery({
		queryKey: skillScriptKeys.list(ws, skillId),
		queryFn: ({ signal }) => SkillScriptService.list(ws, skillId, signal),
		enabled: !!ws && !!skillId,
	});

export const useCreateSkillScript = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateSkillScriptDto) =>
			SkillScriptService.create(ws, skillId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to create script' },
	});
};

export const useUpdateSkillScript = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateSkillScriptDto }) =>
			SkillScriptService.update(ws, skillId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to update script' },
	});
};

export const useDeleteSkillScript = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkillScriptService.remove(ws, skillId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage: 'Failed to delete script' },
	});
};

const SOURCE_SYNCING_POLL_MS = 4000;

export const isSkillSourceSyncing = (source: TSkillSource) =>
	source.status === 'pending' || source.status === 'syncing' || source.status === 'forking';

export const useSkillSources = (ws: string) =>
	useQuery({
		queryKey: skillSourceKeys.list(ws),
		queryFn: ({ signal }) => SkillSourceService.list(ws, signal),
		enabled: !!ws,
		// Keep polling while any repository is still syncing.
		refetchInterval: (query) =>
			(query.state.data as TSkillSource[] | undefined)?.some(isSkillSourceSyncing)
				? SOURCE_SYNCING_POLL_MS
				: 30000,
	});

const useSkillSourceMutation = <TArgs, TResult>(
	ws: string,
	fn: (args: TArgs) => Promise<TResult>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) }),
		meta: { errorMessage },
	});
};

export const useCreateSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		(payload: TCreateSkillSourceDto) => SkillSourceService.create(ws, payload),
		'Failed to connect the repository',
	);

/** Reads a repository's skills without connecting it; the dialog shows its errors inline. */
export const usePreviewSkillSource = (ws: string) =>
	useMutation({
		mutationFn: (payload: TPreviewSkillSourceDto) => SkillSourceService.preview(ws, payload),
		meta: { silent: true },
	});

export const useSyncSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		(id: string) => SkillSourceService.sync(ws, id),
		'Failed to start the sync',
	);

export const useDisconnectSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, keepSkills }: { id: string; keepSkills: boolean }) =>
			SkillSourceService.remove(ws, id, keepSkills),
		'Failed to disconnect the repository',
	);

export const useUpdateSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: TUpdateSkillSourceDto }) =>
			SkillSourceService.update(ws, id, body),
		'Failed to update sync settings',
	);
export const useExportSkill = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: TExportSkillDto }) =>
			SkillSourceService.export(ws, id, body),
		'Failed to export skill',
	);
export const useResolveSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: TResolveSkillSourceDto }) =>
			SkillSourceService.resolve(ws, id, body),
		'Failed to resolve conflict',
	);

export const useCopyAgentSkill = (ws: string) =>
	useSkillSourceMutation(
		ws,
		(id: string) => AgentSkillService.copy(ws, id),
		'Failed to create an editable copy',
	);
export const usePublishAgentSkill = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: TPublishSkillDto }) =>
			AgentSkillService.publish(ws, id, body),
		'Failed to publish the skill',
	);
export const useRepositoryAccess = (ws: string) =>
	useMutation({
		mutationFn: (body: { repo: string; branch?: string; credential_id: string }) =>
			SkillSourceService.access(ws, body),
		meta: { errorMessage: 'Could not check publishing access' },
	});
export const useForkSkillSource = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: { credential_id: string; fork_repo?: string } }) =>
			SkillSourceService.fork(ws, id, body),
		'Could not create or connect the fork',
	);
export const useCancelSkillFork = (ws: string) =>
	useSkillSourceMutation(
		ws,
		(id: string) => SkillSourceService.cancelFork(ws, id),
		'Could not cancel the fork connection',
	);
export const useForkProgress = (ws: string, id: string, enabled: boolean) =>
	useQuery({
		queryKey: ['agent-skills', ws, 'fork-progress', id],
		queryFn: () => SkillSourceService.completeFork(ws, id),
		enabled: !!ws && enabled,
		refetchInterval: (query) =>
			query.state.error ? false : query.state.data?.fork_request ? 4000 : false,
		retry: false,
		meta: { silent: true },
	});
export const useSkillUpstream = (ws: string) =>
	useMutation({
		mutationFn: (id: string) => SkillSourceService.upstream(ws, id),
		meta: { errorMessage: 'Could not check the original repository' },
	});
export const useApplySkillUpstream = (ws: string) =>
	useSkillSourceMutation(
		ws,
		({ id, body }: { id: string; body: { fork_sha: string; upstream_sha: string } }) =>
			SkillSourceService.applyUpstream(ws, id, body),
		'Could not merge original updates',
	);
