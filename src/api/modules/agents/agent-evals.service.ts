import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TAgentEvalSuite,
	TCreateAgentEvalSuiteDto,
	TUpdateAgentEvalSuiteDto,
	TAgentEvalCase,
	TCreateAgentEvalCaseDto,
	TUpdateAgentEvalCaseDto,
	TAgentEvalRun,
} from '@/types/agent.type';
import { AgentEvalEndpoints as E } from './agents.endpoints';

export const AgentEvalSuiteService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ suites: TAgentEvalSuite[] }>>(E.suites(ws, agentId), { signal })
			.then(unwrapKey<TAgentEvalSuite[]>('suites')),

	detail: (ws: string, agentId: string, suiteId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ suite: TAgentEvalSuite }>>(E.suite(ws, agentId, suiteId), { signal })
			.then(unwrapKey<TAgentEvalSuite>('suite')),

	create: (ws: string, agentId: string, payload: TCreateAgentEvalSuiteDto) =>
		axiosClient
			.post<TApiResponse<{ suite: TAgentEvalSuite }>>(E.createSuite(ws, agentId), payload)
			.then(unwrapKey<TAgentEvalSuite>('suite')),

	update: (ws: string, agentId: string, suiteId: string, payload: TUpdateAgentEvalSuiteDto) =>
		axiosClient
			.patch<TApiResponse<{ suite: TAgentEvalSuite }>>(E.updateSuite(ws, agentId, suiteId), payload)
			.then(unwrapKey<TAgentEvalSuite>('suite')),

	remove: (ws: string, agentId: string, suiteId: string) =>
		axiosClient.delete(E.deleteSuite(ws, agentId, suiteId)).then(() => undefined),
};

export const AgentEvalCaseService = {
	list: (ws: string, agentId: string, suiteId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ cases: TAgentEvalCase[] }>>(E.cases(ws, agentId, suiteId), { signal })
			.then(unwrapKey<TAgentEvalCase[]>('cases')),

	create: (ws: string, agentId: string, suiteId: string, payload: TCreateAgentEvalCaseDto) =>
		axiosClient
			.post<TApiResponse<{ case: TAgentEvalCase }>>(E.createCase(ws, agentId, suiteId), payload)
			.then(unwrapKey<TAgentEvalCase>('case')),

	update: (
		ws: string,
		agentId: string,
		suiteId: string,
		caseId: string,
		payload: TUpdateAgentEvalCaseDto,
	) =>
		axiosClient
			.patch<TApiResponse<{ case: TAgentEvalCase }>>(E.updateCase(ws, agentId, suiteId, caseId), payload)
			.then(unwrapKey<TAgentEvalCase>('case')),

	remove: (ws: string, agentId: string, suiteId: string, caseId: string) =>
		axiosClient.delete(E.deleteCase(ws, agentId, suiteId, caseId)).then(() => undefined),
};

export const AgentEvalRunService = {
	list: (ws: string, agentId: string, suiteId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ runs: TAgentEvalRun[] }>>(E.runs(ws, agentId, suiteId), { signal })
			.then(unwrapKey<TAgentEvalRun[]>('runs')),

	detail: (ws: string, agentId: string, suiteId: string, runId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ run: TAgentEvalRun }>>(E.run(ws, agentId, suiteId, runId), { signal })
			.then(unwrapKey<TAgentEvalRun>('run')),

	/** Actually runs the agent against every case in the suite. */
	create: (ws: string, agentId: string, suiteId: string) =>
		axiosClient
			.post<TApiResponse<{ run: TAgentEvalRun }>>(E.createRun(ws, agentId, suiteId))
			.then(unwrapKey<TAgentEvalRun>('run')),
};
