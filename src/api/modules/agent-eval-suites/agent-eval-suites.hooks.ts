import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateAgentEvalSuiteDto,
	TUpdateAgentEvalSuiteDto,
	TCreateAgentEvalCaseDto,
	TUpdateAgentEvalCaseDto,
} from '@/types/agent.type';
import {
	AgentEvalSuiteService,
	AgentEvalCaseService,
	AgentEvalRunService,
} from './agent-eval-suites.service';
import { agentEvalSuiteKeys } from './agent-eval-suites.keys';

// ─── Suites ───────────────────────────────────────────────────

export const useAgentEvalSuites = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentEvalSuiteKeys.suites(ws, agentId),
		queryFn: ({ signal }) => AgentEvalSuiteService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAgentEvalSuite = (ws: string, agentId: string, suiteId: string) =>
	useQuery({
		queryKey: agentEvalSuiteKeys.suite(ws, agentId, suiteId),
		queryFn: ({ signal }) => AgentEvalSuiteService.detail(ws, agentId, suiteId, signal),
		enabled: !!ws && !!agentId && !!suiteId,
	});

export const useCreateAgentEvalSuite = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentEvalSuiteDto) =>
			AgentEvalSuiteService.create(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.suites(ws, agentId) }),
		meta: { errorMessage: 'Failed to create eval suite' },
	});
};

export const useUpdateAgentEvalSuite = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ suiteId, body }: { suiteId: string; body: TUpdateAgentEvalSuiteDto }) =>
			AgentEvalSuiteService.update(ws, agentId, suiteId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.suites(ws, agentId) }),
		meta: { errorMessage: 'Failed to update eval suite' },
	});
};

export const useDeleteAgentEvalSuite = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (suiteId: string) => AgentEvalSuiteService.remove(ws, agentId, suiteId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.suites(ws, agentId) }),
		meta: { errorMessage: 'Failed to delete eval suite' },
	});
};

// ─── Cases ────────────────────────────────────────────────────

export const useAgentEvalCases = (ws: string, agentId: string, suiteId: string) =>
	useQuery({
		queryKey: agentEvalSuiteKeys.cases(ws, agentId, suiteId),
		queryFn: ({ signal }) => AgentEvalCaseService.list(ws, agentId, suiteId, signal),
		enabled: !!ws && !!agentId && !!suiteId,
	});

export const useCreateAgentEvalCase = (ws: string, agentId: string, suiteId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentEvalCaseDto) =>
			AgentEvalCaseService.create(ws, agentId, suiteId, payload),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.cases(ws, agentId, suiteId) }),
		meta: { errorMessage: 'Failed to create eval case' },
	});
};

/** Saves a chat exchange as a case, in an existing suite or a new one made on the spot. */
export const useSaveChatAsEvalCase = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			suite,
			body,
		}: {
			suite: { id: string } | { name: string };
			body: TCreateAgentEvalCaseDto;
		}) => {
			const suiteId =
				'id' in suite
					? suite.id
					: (await AgentEvalSuiteService.create(ws, agentId, { name: suite.name })).id;
			return AgentEvalCaseService.create(ws, agentId, suiteId, body);
		},
		// The suites key prefixes every suite's cases, so this refreshes both.
		onSuccess: () => qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.suites(ws, agentId) }),
		meta: { errorMessage: 'Failed to save the eval case' },
	});
};

export const useUpdateAgentEvalCase = (ws: string, agentId: string, suiteId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ caseId, body }: { caseId: string; body: TUpdateAgentEvalCaseDto }) =>
			AgentEvalCaseService.update(ws, agentId, suiteId, caseId, body),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.cases(ws, agentId, suiteId) }),
		meta: { errorMessage: 'Failed to update eval case' },
	});
};

export const useDeleteAgentEvalCase = (ws: string, agentId: string, suiteId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (caseId: string) => AgentEvalCaseService.remove(ws, agentId, suiteId, caseId),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.cases(ws, agentId, suiteId) }),
		meta: { errorMessage: 'Failed to delete eval case' },
	});
};

// ─── Runs ─────────────────────────────────────────────────────

export const useAgentEvalRuns = (ws: string, agentId: string, suiteId: string) =>
	useQuery({
		queryKey: agentEvalSuiteKeys.runs(ws, agentId, suiteId),
		queryFn: ({ signal }) => AgentEvalRunService.list(ws, agentId, suiteId, signal),
		enabled: !!ws && !!agentId && !!suiteId,
	});

export const useAgentEvalRun = (ws: string, agentId: string, suiteId: string, runId: string) =>
	useQuery({
		queryKey: agentEvalSuiteKeys.run(ws, agentId, suiteId, runId),
		queryFn: ({ signal }) => AgentEvalRunService.detail(ws, agentId, suiteId, runId, signal),
		enabled: !!ws && !!agentId && !!suiteId && !!runId,
	});

export const useRunAgentEvalSuite = (ws: string, agentId: string, suiteId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => AgentEvalRunService.create(ws, agentId, suiteId),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentEvalSuiteKeys.runs(ws, agentId, suiteId) }),
		meta: { errorMessage: 'Failed to run eval suite' },
	});
};
