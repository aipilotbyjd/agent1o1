import { axiosClient } from '@/api/client';
import { unwrapKey, fetchAllPages, unwrapCursorPage } from '@/api/core';
import type { TApiResponse, TCursorPaginationMeta } from '@/api/core';
import type { TAgentVersion } from '@/types/agent.type';
import type { TAgent } from '@/types/agent.type';
import { AgentVersionEndpoints as E } from './agent-versions.endpoints';

export const AgentVersionService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		fetchAllPages((page) =>
			axiosClient
				.get<
					TApiResponse<TAgentVersion[]> & { meta: TCursorPaginationMeta }
				>(E.list(ws, agentId), { params: page, signal })
				.then(unwrapCursorPage<TAgentVersion>),
		),

	detail: (ws: string, agentId: string, version: number, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ version: TAgentVersion }>
			>(E.detail(ws, agentId, version), { signal })
			.then(unwrapKey<TAgentVersion>('version')),

	/** Rolls forward: restoring produces a new version rather than deleting
	 *  the ones in between. */
	restore: (ws: string, agentId: string, version: number) =>
		axiosClient
			.post<
				TApiResponse<{ agent: TAgent; version: TAgentVersion }>
			>(E.restore(ws, agentId, version))
			.then((r) => r.data.data),
};
