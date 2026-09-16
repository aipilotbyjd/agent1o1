import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type { TSyncWorkflowTagsDto, TPinWorkflowNodeDto, TStartRunDto } from '@/types/workflow.type';
import { RunService } from '@/api/modules/runs';
import { useTriggers, useCreateTrigger, useUpdateTrigger, useDeleteTrigger } from '@/api/modules/triggers';
import type { TTriggerMechanism } from '@/types/catalog.type';
import type { TTriggerTargetType } from '@/types/trigger.type';
import { WorkflowService } from './workflows.service';
import { WorkflowVersionService } from './workflow-versions.service';
import { workflowKeys } from './workflows.keys';

const Workflows = createResource({
	service: WorkflowService,
	keys: workflowKeys,
	label: { singular: 'Workflow', plural: 'Workflows' },
});

export const useWorkflows = Workflows.useList;
export const useWorkflow = Workflows.useDetail;
export const useCreateWorkflow = Workflows.useCreate;
export const useUpdateWorkflow = Workflows.useUpdate;
export const useDeleteWorkflow = Workflows.useDelete;

// ─── Custom actions — not CRUD, so hand-written alongside the factory ──

export const useDuplicateWorkflow = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowService.duplicate(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to duplicate workflow' },
	});
};

export const useSyncWorkflowTags = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSyncWorkflowTagsDto) => WorkflowService.syncTags(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to update workflow tags' },
	});
};

export const usePinWorkflowNode = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ nodeId, body }: { nodeId: string; body: TPinWorkflowNodeDto }) =>
			WorkflowService.pinNode(ws, id, nodeId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to pin node data' },
	});
};

export const useUnpinWorkflowNode = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (nodeId: string) => WorkflowService.unpinNode(ws, id, nodeId),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to unpin node data' },
	});
};

// ── Ported-frontend adapters ──────────────────────────────────────────────────
//
// The old workflows list calls four actions this backend models differently, or
// not at all. These keep the old names and call signatures so the ported page
// needed no changes — same approach as the agent-builder adapters in
// `agents.hooks.ts`. What each one maps onto is spelled out per hook, and the
// two unsupported ones fail loudly rather than pretending to have worked.

/** Old flipped a `status` flag between `active`/`inactive`. Here a workflow goes
 *  live by publishing a version — that is what `is_published` reflects. */
export const useActivateWorkflow = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkflowVersionService.publish(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to activate workflow' },
	});
};

/** No counterpart here: publishing is one-way, there is no unpublish/deactivate
 *  endpoint. Kept so the ported page compiles — the backend-adaptation pass has
 *  to decide what this button should do. */
export const useDeactivateWorkflow = (_ws: string) =>
	useMutation({
		mutationFn: (_id: string): Promise<never> =>
			Promise.reject(new Error('Deactivating a workflow is not supported by this backend yet')),
		meta: { errorMessage: 'Deactivating a workflow is not supported yet' },
	});

/** This backend does not model favourites at all — `TWorkflow` carries no
 *  `is_favorite` field and there is no endpoint behind it. */
export const useToggleFavorite = (_ws: string) =>
	useMutation({
		mutationFn: (_vars: { id: string; is_favorite: boolean }): Promise<never> =>
			Promise.reject(new Error('Favouriting a workflow is not supported by this backend yet')),
		meta: { errorMessage: 'Favourites are not supported yet' },
	});

/** Old posted to the workflow itself; here a run is its own resource. */
export const useExecuteWorkflow = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body?: TStartRunDto }) =>
			RunService.start(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to execute workflow' },
	});
};

// ── Ported-frontend adapters: triggers ────────────────────────────────────────
//
// The old frontend hung workflow triggers off the workflows module. Here triggers
// are their own polymorphic resource (`@/api/modules/triggers`) that any target
// can own, so these map the old names and call signatures onto it.

const WORKFLOW_TARGET: TTriggerTargetType = 'workflow';

/** Old returned the workflow's trigger set from a workflow-scoped endpoint;
 *  here the list is workspace-wide and filtered by target. */
export const useWorkflowTrigger = (ws: string, workflowId: string) => {
	const query = useTriggers(ws);
	const data = useMemo(
		() =>
			(query.data ?? []).filter(
				(t) => t.target_type === WORKFLOW_TARGET && String(t.target_id) === String(workflowId),
			),
		[query.data, workflowId],
	);
	return { ...query, data };
};

export const useWorkflowTriggerDetail = (ws: string, workflowId: string, triggerId: string) => {
	const query = useWorkflowTrigger(ws, workflowId);
	const data = useMemo(
		() => query.data.find((t) => String(t.id) === String(triggerId)),
		[query.data, triggerId],
	);
	return { ...query, data };
};

const useCreateTargetedTrigger = (ws: string, type: TTriggerMechanism) => {
	const m = useCreateTrigger(ws);
	const inject = (body: { workflowId: string; config?: Record<string, unknown> }) => ({
		target_type: WORKFLOW_TARGET,
		target_id: body.workflowId,
		type,
		config: body.config ?? {},
		is_active: true,
	});
	return {
		...m,
		mutate: (body: { workflowId: string; config?: Record<string, unknown> }) =>
			m.mutate(inject(body)),
		mutateAsync: (body: { workflowId: string; config?: Record<string, unknown> }) =>
			m.mutateAsync(inject(body)),
	};
};

export const useCreateWorkflowWebhook = (ws: string) => useCreateTargetedTrigger(ws, 'webhook');
export const useCreateWorkflowPollingTrigger = (ws: string) =>
	useCreateTargetedTrigger(ws, 'polling');

/** Old had explicit pause/resume endpoints; here it is the trigger's `is_active`. */
const useSetTriggerActive = (ws: string, is_active: boolean) => {
	const m = useUpdateTrigger(ws);
	return {
		...m,
		mutate: (triggerId: string) => m.mutate({ id: triggerId, body: { is_active } }),
		mutateAsync: (triggerId: string) => m.mutateAsync({ id: triggerId, body: { is_active } }),
	};
};

export const usePauseWorkflowTrigger = (ws: string) => useSetTriggerActive(ws, false);
export const useResumeWorkflowTrigger = (ws: string) => useSetTriggerActive(ws, true);
export const useDeleteWorkflowTrigger = (ws: string) => useDeleteTrigger(ws);

// ── Ported-frontend adapters: governance ──────────────────────────────────────
//
// The old frontend shipped a governance modal covering shares, approval
// requests, releases and contract tests. This backend models none of them: there
// is no share, approval-request, release or contract endpoint on a workflow
// (its `approvals` are per-run pauses, a different concept entirely).
//
// They are kept only so the ported modal loads. Reads resolve empty — that is
// what this backend actually has — and writes fail loudly rather than looking
// like they succeeded. Whether the modal should exist here at all is the
// backend-adaptation pass's call.

/** Reads with no counterpart: always empty, never fetched. */
const useMissingCollection = <T,>() =>
	useQuery<T[]>({ queryKey: ['unsupported'], queryFn: () => Promise.resolve([]), enabled: false, initialData: [] });

/** Writes with no counterpart: reject with the reason. */
const useMissingMutation = (what: string) =>
	useMutation({
		mutationFn: (_vars?: unknown): Promise<never> =>
			Promise.reject(new Error(`${what} is not supported by this backend`)),
		meta: { errorMessage: `${what} is not supported yet` },
	});

export const useWorkflowShares = (_ws: string, _workflowId?: string, _enabled?: boolean) =>
	useMissingCollection<never>();
export const useCreateWorkflowShare = (_ws: string, _workflowId: string) =>
	useMissingMutation('Sharing a workflow');
export const useDeleteWorkflowShare = (_ws: string, _workflowId: string) =>
	useMissingMutation('Removing a workflow share');

export const useWorkflowApprovals = (_ws: string, _workflowId?: string, _enabled?: boolean) =>
	useMissingCollection<never>();
export const useRequestApproval = (_ws: string, _workflowId: string) =>
	useMissingMutation('Requesting workflow approval');
export const useApproveRequest = (_ws: string, _workflowId: string) =>
	useMissingMutation('Approving a workflow request');
export const useRejectRequest = (_ws: string, _workflowId: string) =>
	useMissingMutation('Rejecting a workflow request');

export const useWorkflowReleases = (_ws: string, _workflowId?: string, _enabled?: boolean) =>
	useMissingCollection<never>();
export const useDeployRelease = (_ws: string, _workflowId: string) =>
	useMissingMutation('Deploying a workflow release');

export const useWorkflowContracts = (_ws: string, _workflowId?: string, _enabled?: boolean) =>
	useMissingCollection<never>();
export const useGenerateContract = (_ws: string, _workflowId: string) =>
	useMissingMutation('Generating a workflow contract');
export const useRunContractTest = (_ws: string, _workflowId: string) =>
	useMissingMutation('Running a contract test');

// ── Ported-frontend adapters: versions ────────────────────────────────────────

/** Old snapshotted a version explicitly; here publishing is what creates one. */
export const useCreateWorkflowVersion = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ workflowId }: { workflowId: string }) =>
			WorkflowVersionService.publish(ws, workflowId),
		onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create a workflow version' },
	});
};

/** Versions are immutable snapshots here with no rollback endpoint. */
export const useRollbackWorkflowVersion = (_ws: string) =>
	useMissingMutation('Rolling a workflow back to an earlier version');
