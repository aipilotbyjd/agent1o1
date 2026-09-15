import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type { TSyncAgentTagsDto } from '@/types/agent.type';
import { AgentService } from './agents.service';
import { agentKeys } from './agents.keys';

const Agents = createResource({
	service: AgentService,
	keys: agentKeys,
	label: { singular: 'Agent', plural: 'Agents' },
});

export const useAgents = Agents.useList;
export const useAgent = Agents.useDetail;
export const useCreateAgent = Agents.useCreate;
export const useUpdateAgent = Agents.useUpdate;
export const useDeleteAgent = Agents.useDelete;

export const useDuplicateAgent = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentService.duplicate(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to duplicate agent' },
	});
};

export const useSyncAgentTags = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSyncAgentTagsDto) => AgentService.syncTags(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to update agent tags' },
	});
};

// ── AgentBuilder compatibility layer ──────────────────────────────────────────
// The builder was written against the old API, where triggers, runs, analytics,
// the model catalog and skills all hung off an agent. This backend models them
// as workspace-level resources in their own modules, with agents addressed
// polymorphically (`target_type`/`runnable_type` === 'agent').
//
// These adapters keep the builder's original call signatures — (ws, agentId) —
// and map them onto the real endpoints, so the UI needed no changes.
import { useMemo } from 'react';
import {
	useTriggers,
	useCreateTrigger,
	useUpdateTrigger,
	useDeleteTrigger,
	useRunTrigger,
} from '@/api/modules/triggers';
import { useRuns, useRun } from '@/api/modules/runs';
import type { TRun } from '@/types/run.type';
import { useModelCatalog } from '@/api/modules/catalog';
import { AgentMemoryService } from './agent-memory.service';
import { agentMemoryKeys } from './agents.keys';

export { useAgentSkills, useCreateAgentSkill } from '@/api/modules/agent-skills';

/** The morph alias the backend stores for an Agent (see AppServiceProvider). */
const AGENT_MORPH = 'agent';

export const useAgentTriggers = (ws: string, agentId: string) => {
	const query = useTriggers(ws);
	// The triggers index returns the whole workspace and takes no target filter,
	// so the narrowing happens here.
	const data = useMemo(
		() =>
			(query.data ?? []).filter(
				(t) => t.target_type === AGENT_MORPH && String(t.target_id) === String(agentId),
			),
		[query.data, agentId],
	);
	return { ...query, data };
};

export const useCreateAgentTrigger = (ws: string, agentId: string) => {
	const m = useCreateTrigger(ws);
	return {
		...m,
		mutate: (body: Record<string, unknown>) =>
			m.mutate({ ...body, target_type: AGENT_MORPH, target_id: agentId } as never),
		mutateAsync: (body: Record<string, unknown>) =>
			m.mutateAsync({ ...body, target_type: AGENT_MORPH, target_id: agentId } as never),
	};
};

export const useUpdateAgentTrigger = (ws: string, _agentId: string) => {
	const m = useUpdateTrigger(ws);
	return {
		...m,
		mutate: ({ triggerId, body }: { triggerId: string; body: Record<string, unknown> }) =>
			m.mutate({ id: triggerId, body } as never),
		mutateAsync: ({ triggerId, body }: { triggerId: string; body: Record<string, unknown> }) =>
			m.mutateAsync({ id: triggerId, body } as never),
	};
};

export const useDeleteAgentTrigger = (ws: string, _agentId: string) => useDeleteTrigger(ws);

export const useFireAgentTrigger = (ws: string, _agentId: string) => {
	const m = useRunTrigger(ws);
	return {
		...m,
		mutate: ({ triggerId }: { triggerId: string }) => m.mutate(triggerId),
		mutateAsync: ({ triggerId }: { triggerId: string }) => m.mutateAsync(triggerId),
	};
};

export const useAgentRuns = (ws: string, agentId: string, filters?: Record<string, unknown>) => {
	const query = useRuns(ws, filters as never);
	// `runs.index` filters by status/workflow/trigger_type only — not by runnable.
	const data = useMemo<TRun[]>(() => {
		// `useRuns` hands back either a paginated envelope or a bare array.
		const raw = query.data as TRun[] | { data?: TRun[] } | undefined;
		const rows: TRun[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
		return rows.filter(
			(r) => r.runnable_type === AGENT_MORPH && String(r.runnable_id) === String(agentId),
		);
	}, [query.data, agentId]);
	return { ...query, data };
};

export const useAgentRun = (ws: string, _agentId: string, runId: string | null | undefined) =>
	useRun(ws, runId ?? '');

/**
 * The old API served `{agent}/analytics`; this backend has no such endpoint, and
 * the dashboard's run stats are workspace-wide — returning those for an agent
 * would be a silent wrong answer. Instead the same figures are derived from the
 * agent's own runs, which carry status, trigger_type, duration_ms and credits.
 *
 * One substitution: runs record **credits**, not tokens. The `tokens` block is
 * populated with credit figures and the panel is labelled accordingly.
 */
export const useAgentAnalytics = (ws: string, agentId: string) => {
	const query = useAgentRuns(ws, agentId);

	const data = useMemo(() => {
		const runs = query.data ?? [];
		if (!agentId) return undefined;

		const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0);
		const durations = runs.map((r) => num((r as { duration_ms?: number }).duration_ms));
		const credits = runs.map((r) => num((r as { total_credits_used?: number }).total_credits_used));
		const completed = runs.filter((r) => (r as { status?: string }).status === 'completed').length;
		const failed = runs.filter((r) => (r as { status?: string }).status === 'failed').length;
		const running = runs.filter((r) => (r as { status?: string }).status === 'running').length;
		const settled = completed + failed;

		const by_source: Record<string, number> = {};
		runs.forEach((r) => {
			const src = (r as { trigger_type?: string }).trigger_type || 'unknown';
			by_source[src] = (by_source[src] ?? 0) + 1;
		});

		const days = new Map<string, { day: string; runs: number; tokens: number; failed: number }>();
		runs.forEach((r) => {
			const raw = (r as { started_at?: string }).started_at;
			if (!raw) return;
			const day = String(raw).slice(0, 10);
			const row = days.get(day) ?? { day, runs: 0, tokens: 0, failed: 0 };
			row.runs += 1;
			row.tokens += num((r as { total_credits_used?: number }).total_credits_used);
			if ((r as { status?: string }).status === 'failed') row.failed += 1;
			days.set(day, row);
		});
		const by_day = Array.from(days.values()).sort((a, b) => a.day.localeCompare(b.day));

		const totalCredits = credits.reduce((a, b) => a + b, 0);

		return {
			range: {
				from: by_day[0]?.day ?? '',
				to: by_day[by_day.length - 1]?.day ?? '',
			},
			totals: {
				total_runs: runs.length,
				completed,
				failed,
				running,
				success_rate: settled > 0 ? completed / settled : null,
			},
			// Credit figures, surfaced through the old `tokens` shape.
			tokens: {
				total: totalCredits,
				prompt: 0,
				completion: 0,
				avg_per_run: runs.length ? totalCredits / runs.length : 0,
			},
			latency: {
				avg_duration_ms: durations.length
					? durations.reduce((a, b) => a + b, 0) / durations.length
					: 0,
				max_duration_ms: durations.length ? Math.max(...durations) : 0,
			},
			by_source,
			by_day,
		};
	}, [query.data, agentId]);

	return { ...query, data };
};

/** Provider is filtered client-side — the catalog endpoint takes no argument. */
export const useAgentMetaModels = (_ws: string, provider?: string) => {
	const query = useModelCatalog();
	const data = useMemo(() => {
		const rows = (query.data ?? []) as { provider?: string }[];
		return provider ? rows.filter((m) => m.provider === provider) : rows;
	}, [query.data, provider]);
	return { ...query, data };
};

/**
 * No bulk-delete endpoint exists — memories are removed one at a time, so this
 * reads the current list and fans out deletes.
 */
export const useClearAgentMemories = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const memories = await AgentMemoryService.list(ws, agentId);
			await Promise.all(
				(memories ?? []).map((m: { id: string }) =>
					AgentMemoryService.remove(ws, agentId, m.id),
				),
			);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: agentMemoryKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to clear memories' },
	});
};
