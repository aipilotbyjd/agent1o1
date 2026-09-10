import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type {
	TCreateSkillReferenceDto,
	TUpdateSkillReferenceDto,
	TCreateSkillScriptDto,
	TUpdateSkillScriptDto,
} from '@/types/agent-skill.type';
import { AgentSkillService, SkillReferenceService, SkillScriptService } from './agent-skills.service';
import { agentSkillKeys, skillReferenceKeys, skillScriptKeys } from './agent-skills.keys';

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
		onSuccess: () => qc.invalidateQueries({ queryKey: skillReferenceKeys.list(ws, skillId) }),
		meta: { errorMessage: 'Failed to create reference' },
	});
};

export const useUpdateSkillReference = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateSkillReferenceDto }) =>
			SkillReferenceService.update(ws, skillId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: skillReferenceKeys.list(ws, skillId) }),
		meta: { errorMessage: 'Failed to update reference' },
	});
};

export const useDeleteSkillReference = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkillReferenceService.remove(ws, skillId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: skillReferenceKeys.list(ws, skillId) }),
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
		mutationFn: (payload: TCreateSkillScriptDto) => SkillScriptService.create(ws, skillId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: skillScriptKeys.list(ws, skillId) }),
		meta: { errorMessage: 'Failed to create script' },
	});
};

export const useUpdateSkillScript = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateSkillScriptDto }) =>
			SkillScriptService.update(ws, skillId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: skillScriptKeys.list(ws, skillId) }),
		meta: { errorMessage: 'Failed to update script' },
	});
};

export const useDeleteSkillScript = (ws: string, skillId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkillScriptService.remove(ws, skillId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: skillScriptKeys.list(ws, skillId) }),
		meta: { errorMessage: 'Failed to delete script' },
	});
};
