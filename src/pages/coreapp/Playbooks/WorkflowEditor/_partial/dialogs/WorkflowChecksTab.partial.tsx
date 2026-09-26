import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, Play, ShieldCheck } from 'lucide-react';
import { useDryRunWorkflow, useValidateWorkflow } from '@/api/modules/workflow-builder';
import type { TWorkflowValidationResult } from '@/types/workflow-builder.type';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { buildGraphPayload } from '../../_helper/workflowApiTransform.helper';

/** `DryRunner::run()` — the backend types it as `unknown`. */
type TDryRunStep = {
	key: string;
	type: string;
	resolved_config: Record<string, unknown>;
	sample_output: unknown;
};
type TDryRun = { ok: boolean; issues: string[]; warnings: string[]; steps: TDryRunStep[] };

const toStrings = (value: unknown): string[] =>
	Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))) : [];

/**
 * Server-side checks on the canvas as it is right now (unsaved edits
 * included): `validate` runs the publish-time graph checks, `dry-run` also
 * walks the graph in order and resolves each node's templates against
 * placeholder outputs — nothing external is called.
 */
const WorkflowChecksTab = ({ workspaceId, workflowId }: { workspaceId: string; workflowId: string }) => {
	const { state } = useWorkflowEditor();
	const validate = useValidateWorkflow(workspaceId, workflowId);
	const dryRun = useDryRunWorkflow(workspaceId, workflowId);

	const [validation, setValidation] = useState<TWorkflowValidationResult | null>(null);
	const [dryRunResult, setDryRunResult] = useState<TDryRun | null>(null);
	const [inputJson, setInputJson] = useState('{}');
	const [inputError, setInputError] = useState<string | null>(null);
	const [openStep, setOpenStep] = useState<string | null>(null);

	const labelByKey = useMemo(
		() => new Map(state.nodes.map((node) => [node.id, node.data.label || node.id])),
		[state.nodes],
	);
	const graph = () => {
		const { nodes, edges } = buildGraphPayload(state.nodes, state.edges);
		return {
			nodes: nodes.map(({ key, type, config }) => ({ key, type, config })),
			edges,
		};
	};

	const handleValidate = () => {
		validate.mutate({ graph: graph() }, { onSuccess: setValidation });
	};

	const handleDryRun = () => {
		let input: Record<string, unknown> = {};
		try {
			const parsed = inputJson.trim() ? JSON.parse(inputJson) : {};
			if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
				setInputError('Input must be a JSON object.');
				return;
			}
			input = parsed as Record<string, unknown>;
		} catch {
			setInputError('Input is not valid JSON.');
			return;
		}
		setInputError(null);
		dryRun.mutate(
			{ graph: graph(), input },
			{
				onSuccess: (res) => {
					const raw = (res.dry_run ?? {}) as Partial<TDryRun>;
					setDryRunResult({
						ok: Boolean(raw.ok),
						issues: toStrings(raw.issues),
						warnings: toStrings(raw.warnings),
						steps: Array.isArray(raw.steps) ? raw.steps : [],
					});
				},
			},
		);
	};

	const isEmpty = state.nodes.length === 0;
	const validationIssues = toStrings(validation?.issues);

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>Validate & Dry Run</h3>
				<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
					Check the canvas on the server before you publish. Unsaved edits are included.
				</p>
			</div>

			{/* Validate */}
			<div className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
				<div className='flex items-center justify-between gap-3'>
					<div>
						<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>Validate graph</h4>
						<p className='text-[11px] text-zinc-500'>
							The same checks publishing runs: duplicate keys, broken connections, cycles, unreachable
							nodes and node settings.
						</p>
					</div>
					<button
						type='button'
						onClick={handleValidate}
						disabled={validate.isPending || isEmpty}
						className='flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
						{validate.isPending ? <Loader2 size={13} className='animate-spin' /> : <ShieldCheck size={13} />}
						Validate
					</button>
				</div>

				{validation &&
					(validation.valid ? (
						<div className='flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
							<CheckCircle2 size={13} />
							No problems found
						</div>
					) : (
						<ul className='space-y-1.5'>
							{validationIssues.map((issue, index) => (
								<li
									key={index}
									className='flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400'>
									<AlertCircle size={13} className='mt-px shrink-0' />
									<span>{issue}</span>
								</li>
							))}
						</ul>
					))}
			</div>

			{/* Dry run */}
			<div className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
				<div className='flex items-center justify-between gap-3'>
					<div>
						<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>Dry run</h4>
						<p className='text-[11px] text-zinc-500'>
							Walks the nodes in order and fills in each node's templates. Flags references that nothing
							provides. No node actually runs.
						</p>
					</div>
					<button
						type='button'
						onClick={handleDryRun}
						disabled={dryRun.isPending || isEmpty}
						className='flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
						{dryRun.isPending ? <Loader2 size={13} className='animate-spin' /> : <Play size={11} fill='currentColor' />}
						Dry run
					</button>
				</div>

				<div className='space-y-1'>
					<label
						htmlFor='dry-run-input'
						className='block text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
						Sample input (JSON)
					</label>
					<textarea
						id='dry-run-input'
						value={inputJson}
						onChange={(e) => setInputJson(e.target.value)}
						rows={3}
						spellCheck={false}
						className='w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[11px] text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
					/>
					{inputError && <p className='text-[11px] text-rose-500'>{inputError}</p>}
				</div>

				{dryRunResult && (
					<div className='space-y-3'>
						{dryRunResult.issues.length > 0 ? (
							<ul className='space-y-1.5'>
								{dryRunResult.issues.map((issue, index) => (
									<li
										key={index}
										className='flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400'>
										<AlertCircle size={13} className='mt-px shrink-0' />
										<span>{issue}</span>
									</li>
								))}
							</ul>
						) : dryRunResult.ok ? (
							<div className='flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
								<CheckCircle2 size={13} />
								Every node's references resolve
							</div>
						) : null}

						{dryRunResult.warnings.length > 0 && (
							<ul className='space-y-1.5'>
								{dryRunResult.warnings.map((warning, index) => (
									<li
										key={index}
										className='flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400'>
										<AlertTriangle size={13} className='mt-px shrink-0' />
										<span>{warning}</span>
									</li>
								))}
							</ul>
						)}

						{dryRunResult.steps.length > 0 && (
							<div className='space-y-1.5'>
								<h5 className='text-[10px] font-bold tracking-wider text-zinc-500 uppercase'>
									Execution order
								</h5>
								{dryRunResult.steps.map((step, index) => {
									const isOpen = openStep === step.key;
									return (
										<div
											key={step.key}
											className='rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40'>
											<button
												type='button'
												onClick={() => setOpenStep(isOpen ? null : step.key)}
												className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs'>
												{isOpen ? (
													<ChevronDown size={12} className='text-zinc-400' />
												) : (
													<ChevronRight size={12} className='text-zinc-400' />
												)}
												<span className='text-zinc-400'>{index + 1}.</span>
												<span className='truncate font-semibold text-zinc-800 dark:text-zinc-200'>
													{labelByKey.get(step.key) ?? step.key}
												</span>
												<span className='ml-auto shrink-0 font-mono text-[10px] text-zinc-400'>
													{step.type}
												</span>
											</button>
											{isOpen && (
												<pre className='max-h-48 overflow-auto border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'>
													{JSON.stringify(step.resolved_config, null, 2)}
												</pre>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default WorkflowChecksTab;
