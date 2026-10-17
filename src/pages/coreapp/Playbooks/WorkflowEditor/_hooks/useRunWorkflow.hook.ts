import { createContext, createElement, useContext, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	usePublishApprovalPolicy,
	useWorkflow,
	WorkflowInterfaceService,
	WorkflowService,
	WorkflowVersionService,
	workflowVersionKeys,
} from '@/api/modules/workflows';
import { RunService } from '@/api/modules/runs';
import { ApiError } from '@/api/core';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import { useConfirm } from '@/context/confirm';
import type { TNodeRunDetail, TRun, TRunStatus } from '@/types/run.type';
import type { TWorkflow } from '@/types/workflow.type';
import { useWorkflowEditor } from './useWorkflowEditor.hook';
import { usePersistWorkflowDraft } from './usePersistWorkflowDraft.hook';
import { getNodeDefinition } from '../_helper/nodeCatalog.constants';
import { serverValidationIssues } from '../_helper/validation.helper';
import type { TNodeRunStatus } from '../_types/node.type';
import { messageFromError, notify } from '@/api/core/notify';
import { useCredentialResolver } from './useCredentialResolver.hook';
import {
	initialRunFormValues,
	RunFormJsonError,
	runFormInput,
	type TRunFormValues,
} from '@/utils/runForm.util';
import RunInputsDialog from '../_partial/run/RunInputsDialog.partial';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Poll quickly during active work, then less often for approval/callback waits. */
const POLL_INTERVAL_MS = 2000;
const WAITING_POLL_INTERVAL_MS = 10000;
const MAX_CONSECUTIVE_POLL_FAILURES = 5;

/** Map a backend node-run status onto the editor's local run status. */
const API_NODE_STATUS_MAP: Record<string, TNodeRunStatus> = {
	completed: 'success',
	failed: 'error',
	cancelled: 'error',
	running: 'running',
	pending: 'queued',
	awaiting_approval: 'queued',
	awaiting_callback: 'queued',
	skipped: 'skipped',
};

/** Normalise an error field that may be a string or a `{ message }` object. */
const errorText = (error: unknown): string | undefined => {
	if (!error) return undefined;
	if (typeof error === 'string') return error;
	if (typeof error === 'object' && 'message' in error) {
		return String((error as { message?: unknown }).message ?? '');
	}
	return undefined;
};

type TInputRequest = {
	ws: string;
	wfId: string;
	fields: TWorkflowInterfaceField[];
	initialValues: TRunFormValues;
	errors: Record<string, string>;
	submitting: boolean;
};

const INPUT_ERROR_PREFIX = 'input.';

const ACTIVE_RUN_STATUSES = new Set<TRunStatus>([
	'pending',
	'running',
	'awaiting_approval',
	'awaiting_callback',
]);

const useRunWorkflowController = () => {
	const { state, dispatch } = useWorkflowEditor();
	const stopped = useRef(false);
	const starting = useRef(false);
	// Set once the user has agreed that Run may publish the draft.
	const publishConfirmed = useRef(false);
	// What was last entered on the run form, so "Run again" starts from it.
	const lastInputValues = useRef<TRunFormValues>({});
	const [inputRequest, setInputRequest] = useState<TInputRequest | null>(null);
	const { confirm } = useConfirm();
	const { isMissing: isCredentialMissing } = useCredentialResolver();
	const persistWorkflowDraft = usePersistWorkflowDraft();
	const queryClient = useQueryClient();
	const { data: publishPolicy } = usePublishApprovalPolicy(state.workflow.workspaceId ?? '');

	const ws = state.workflow.workspaceId;
	const wfId = state.workflow.apiId;
	const workflowQuery = useWorkflow(ws || '', wfId || '');
	const isApiError = workflowQuery.isError;

	/** Mirror a single node result onto the editor state. */
	const applyNodeResult = (
		nodeRunKey: string,
		status: string | undefined,
		durationMs: number | undefined,
		error: unknown,
		output: unknown,
		input?: unknown,
	) => {
		dispatch({
			type: 'SET_NODE_STATUS',
			id: nodeRunKey,
			status: API_NODE_STATUS_MAP[status ?? ''] ?? 'idle',
			durationMs,
			error: errorText(error),
			inputPreview: input,
			outputPreview: output,
		});
		if (status === 'running') {
			dispatch({ type: 'RUN_CURRENT_NODE', nodeId: nodeRunKey });
		}
	};

	/** Finalise a remote run from the backend's recorded status. */
	const finishRemoteRun = async (ws: string, run: TRun, nodeRuns: TNodeRunDetail[]) => {
		let finalRun = run;
		if (stopped.current && ACTIVE_RUN_STATUSES.has(run.status)) {
			try {
				finalRun = await RunService.cancel(ws, run.id);
			} catch (e) {
				console.error('Failed to cancel run on backend:', e);
				try {
					finalRun = await RunService.detail(ws, run.id);
				} catch {
					notify.error('Could not confirm whether the run stopped. Check Run History.');
					dispatch({ type: 'RUN_FINISH', status: 'error' });
					return;
				}
			}
		}

		const finalStatus: 'success' | 'error' | 'stopped' =
			finalRun.status === 'completed'
				? 'success'
				: finalRun.status === 'cancelled'
					? 'stopped'
					: 'error';
		dispatch({ type: 'RUN_FINISH', status: finalStatus, output: finalRun.output });
		dispatch({
			type: 'APPEND_LOG',
			log: {
				level: finalStatus === 'success' ? 'info' : 'error',
				message: finalRun.error ?? `Run finished with status: ${finalRun.status}`,
			},
		});
		dispatch({
			type: 'PUSH_RUN_HISTORY',
			record: {
				id: finalRun.id,
				startedAt: finalRun.started_at ? Date.parse(finalRun.started_at) : Date.now(),
				finishedAt: finalRun.finished_at ? Date.parse(finalRun.finished_at) : Date.now(),
				status: finalStatus,
				trigger: 'manual',
				versionId: finalRun.workflow_version_id ?? undefined,
				nodeRuns: nodeRuns.map((nodeRun) => ({
					nodeId: nodeRun.key,
					label:
						state.nodes.find((node) => node.id === nodeRun.key)?.data.label ??
						nodeRun.key,
					status:
						nodeRun.status === 'completed'
							? 'success'
							: nodeRun.status === 'skipped'
								? 'skipped'
								: 'error',
					durationMs: nodeRun.duration_ms ?? undefined,
					output: nodeRun.output,
					input: nodeRun.input,
					error: nodeRun.error ?? undefined,
				})),
				logs: [],
			},
		});
	};

	/** Poll the backend because a realtime completion event may precede subscription. */
	const runViaPolling = async (ws: string, initialRun: TRun) => {
		let run = initialRun;
		let nodeRuns: TNodeRunDetail[] = [];
		let attempts = 0;
		let failures = 0;
		do {
			if (attempts > 0) {
				await wait(
					run.status === 'awaiting_approval' || run.status === 'awaiting_callback'
						? WAITING_POLL_INTERVAL_MS
						: POLL_INTERVAL_MS,
				);
			}
			if (stopped.current) break;
			try {
				run = await RunService.detail(ws, run.id);
				nodeRuns = await RunService.nodeRuns(ws, run.id);
				failures = 0;
				for (const nodeRun of nodeRuns) {
					applyNodeResult(
						nodeRun.key,
						nodeRun.status,
						nodeRun.duration_ms ?? undefined,
						nodeRun.error,
						nodeRun.output,
						nodeRun.input,
					);
				}
			} catch {
				failures += 1;
				if (failures >= MAX_CONSECUTIVE_POLL_FAILURES) {
					return { run, nodeRuns, lostContact: true };
				}
			}
			attempts += 1;
		} while (ACTIVE_RUN_STATUSES.has(run.status) && !stopped.current);
		return { run, nodeRuns, lostContact: false };
	};

	/**
	 * Follow a started backend run and use the backend record as the source of truth.
	 */
	const followRemoteRun = async (ws: string, run: TRun, input?: Record<string, unknown>) => {
		try {
			dispatch({ type: 'RUN_START', id: run.id, input });
			dispatch({
				type: 'APPEND_LOG',
				log: {
					level: 'info',
					message: `Run ${run.id} started with status ${run.status || 'running'}`,
				},
			});

			const result = await runViaPolling(ws, run);
			if (result.lostContact) {
				notify.error(
					'Lost contact with the server while the run was in progress. It may still be running: check Run History.',
				);
				dispatch({ type: 'RUN_FINISH', status: 'error' });
				return;
			}
			await finishRemoteRun(ws, result.run, result.nodeRuns);
		} catch (error) {
			notify.error(messageFromError(error, 'Lost track of the run'));
			dispatch({ type: 'RUN_FINISH', status: 'error' });
		}
	};

	/**
	 * Start the published version: straight away when it takes no input,
	 * otherwise once the run form is filled in (see `submitRunInputs`).
	 */
	const startRemoteRun = async (ws: string, wfId: string) => {
		const runForm = await WorkflowInterfaceService.show(ws, wfId);
		if (runForm.fields.length > 0) {
			setInputRequest({
				ws,
				wfId,
				fields: runForm.fields,
				initialValues: initialRunFormValues(runForm.fields, lastInputValues.current),
				errors: {},
				submitting: false,
			});
			return;
		}
		let run: TRun;
		try {
			run = await RunService.start(ws, wfId, { input: {} });
		} catch (error) {
			notify.error(messageFromError(error, 'Failed to start run'));
			return;
		}
		await followRemoteRun(ws, run);
	};

	const submitRunInputs = async (values: TRunFormValues) => {
		if (!inputRequest || inputRequest.submitting) return;
		const { ws, wfId, fields } = inputRequest;
		let input: Record<string, unknown>;
		try {
			input = runFormInput(fields, values);
		} catch (error) {
			if (!(error instanceof RunFormJsonError)) throw error;
			setInputRequest({ ...inputRequest, errors: { [error.field.key]: error.message } });
			return;
		}
		setInputRequest({ ...inputRequest, errors: {}, submitting: true });
		let run: TRun;
		try {
			run = await WorkflowInterfaceService.submit(ws, wfId, { input });
		} catch (error) {
			const errors = ApiError.is(error) && error.isValidation ? inputFieldErrors(error) : {};
			if (!Object.keys(errors).length) {
				notify.error(messageFromError(error, 'Failed to start run'));
			}
			setInputRequest({ ...inputRequest, errors, submitting: false });
			return;
		}
		lastInputValues.current = values;
		setInputRequest(null);
		await followRemoteRun(ws, run, input);
	};

	/**
	 * Run the deterministic frontend simulation. Outputs flow node → node,
	 * branches gate edges, and nodes whose inbound edges are all inactive skip.
	 */
	const runWorkflow = async () => {
		const isRunDisabled =
			state.nodes.length === 0 && state.ui.emptyCanvasView !== 'chat-started';
		if (isRunDisabled) return;
		if (state.run.status === 'running' || starting.current || inputRequest) return;

		// Check for missing credentials.
		const missingCredentialNode = state.nodes.find((node) =>
			isCredentialMissing(
				getNodeDefinition(node.data.defKey, node.data.definition),
				node.data.values,
			),
		);

		const isMockEmptyState =
			state.nodes.length === 0 && state.ui.emptyCanvasView === 'chat-started';

		if (missingCredentialNode || isMockEmptyState) {
			dispatch({
				type: 'SET_LINK_CREDENTIALS_OPEN',
				open: true,
			});
			return;
		}

		stopped.current = false;

		// Runs go to the server. When that is not possible, fail loudly: a
		// simulated "success" here would look like the workflow ran.
		if (!ws || !wfId) {
			notify.error('This workflow is not saved to the server yet, so it cannot run.');
			return;
		}
		if (isApiError) {
			notify.error(
				'Could not load this workflow from the server, so the run was not started. Reload and try again.',
			);
			return;
		}

		starting.current = true;
		try {
			// Runs are pinned to a published version on this backend. Save any
			// pending canvas edits, then publish the draft if it differs from live.
			let workflow: TWorkflow;
			try {
				workflow =
					state.workflow.savingState === 'saved'
						? await WorkflowService.detail(ws, wfId)
						: await persistWorkflowDraft({
								workspaceId: ws,
								workflowId: wfId,
								name: state.workflow.name,
								description: state.workflow.description,
								nodes: state.nodes,
								edges: state.edges,
							});
			} catch (error) {
				const issues = serverValidationIssues(error);
				if (issues.length) {
					dispatch({ type: 'SET_ISSUES_PANEL', open: true, serverIssues: issues });
				} else {
					notify.error(
						messageFromError(error, 'Could not save the workflow before running'),
					);
				}
				dispatch({ type: 'SET_SAVE_STATE', savingState: 'error' });
				return;
			}
			const needsPublish = workflow.has_unpublished_changes || !workflow.current_version_id;
			if (needsPublish && publishPolicy?.requires_approval) {
				// Changes go live only through a review here, so Run can't publish
				// them; it can still run what's live, without them.
				if (!workflow.current_version_id) {
					notify.error(
						'Nothing has been approved yet, so there is no live version to run. Send your changes for review first.',
					);
					return;
				}
				const confirmed = await confirm({
					title: 'Run the live version?',
					message:
						'Your changes need a review before they go live, so this runs the live version without them.',
					confirmText: 'Run live version',
					tone: 'primary',
				});
				if (!confirmed) return;
			} else if (needsPublish) {
				// Publishing replaces the live version (the one triggers and every
				// other caller run) so ask once per editor session before doing it
				// on the user's behalf. A first publish replaces nothing.
				if (workflow.current_version_id && !publishConfirmed.current) {
					const confirmed = await confirm({
						title: 'Publish and run',
						message:
							'Runs use the published version, so your changes will be published as the new live version first. Triggers and anything else that runs this workflow will use it from then on.',
						confirmText: 'Publish & run',
						tone: 'primary',
					});
					if (!confirmed) return;
					publishConfirmed.current = true;
				}
				const published = await WorkflowVersionService.publish(ws, wfId, {
					notes: 'Published to run',
				});
				void queryClient.invalidateQueries({
					queryKey: workflowVersionKeys.list(ws, wfId),
				});
				dispatch({
					type: 'SET_WORKFLOW_META',
					patch: {
						currentVersionId: published.version.id,
						currentVersionNumber: published.version.version,
					},
				});
				notify.info(`Published v${published.version.version}.`);
			}
			await startRemoteRun(ws, wfId);
		} catch (error) {
			const issues = serverValidationIssues(error);
			if (issues.length) {
				dispatch({ type: 'SET_ISSUES_PANEL', open: true, serverIssues: issues });
			} else {
				notify.error(
					messageFromError(error, 'Could not publish the workflow before running'),
				);
			}
		} finally {
			starting.current = false;
		}
	};

	const stopRun = () => {
		stopped.current = true;
		dispatch({ type: 'RUN_FINISH', status: 'stopped' });
	};

	const cancelRunInputs = () => setInputRequest(null);

	return { runWorkflow, stopRun, inputRequest, submitRunInputs, cancelRunInputs };
};

/** 422 messages keyed by run-form field, from the server's `input.<key>` errors. */
const inputFieldErrors = (error: ApiError): Record<string, string> =>
	Object.fromEntries(
		Object.entries(error.fieldErrors())
			.filter(([field]) => field.startsWith(INPUT_ERROR_PREFIX))
			.map(([field, message]) => [field.slice(INPUT_ERROR_PREFIX.length), message]),
	);

type TRunWorkflowController = ReturnType<typeof useRunWorkflowController>;
const WorkflowRunContext = createContext<TRunWorkflowController | null>(null);

const RunInputsHost = () => {
	const { inputRequest, submitRunInputs, cancelRunInputs } = useRunWorkflow();
	if (!inputRequest) return null;
	return createElement(RunInputsDialog, {
		key: `${inputRequest.ws}:${inputRequest.wfId}`,
		fields: inputRequest.fields,
		initialValues: inputRequest.initialValues,
		errors: inputRequest.errors,
		submitting: inputRequest.submitting,
		onSubmit: (values: TRunFormValues) => void submitRunInputs(values),
		onCancel: cancelRunInputs,
	});
};

export const WorkflowRunProvider = ({ children }: { children: ReactNode }) => {
	const controller = useRunWorkflowController();
	return createElement(
		WorkflowRunContext.Provider,
		{ value: controller },
		children,
		createElement(RunInputsHost),
	);
};

export const useRunWorkflow = () => {
	const controller = useContext(WorkflowRunContext);
	if (!controller) throw new Error('useRunWorkflow must be used inside WorkflowRunProvider');
	return controller;
};
