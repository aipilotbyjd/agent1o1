import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Circle, Loader2, Play, Plug, XCircle } from 'lucide-react';
import { sampleRunKeys, useSampleRunPlan, useStartSampleRun } from '@/api/modules/workflows';
import { TERMINAL_RUN_STATUSES, useRun } from '@/api/modules/runs';
import type { TNodeRun, TRun } from '@/types/run.type';
import type { TSampleRunPlan } from '@/types/workflow.type';
import AccountSelect from '@/pages/coreapp/Playbooks/WorkflowEditor/_partial/canvas/nodes/AccountSelect.partial';
import StepHeading from '../shared/StepHeading.partial';
import WizardButton from '../shared/WizardButton.partial';
import { humanizeKey } from '../../_helper/onboarding.helper';
import { useConnectorNames } from '../../_hooks/useConnectorNames.hook';

type TProps = {
	ws: string;
	workflowId: string;
	workflowName: string;
	onSucceeded: (run: TRun) => void;
	onOpenEditor: () => void;
};

/** How often a running sample run is read again. */
const RUN_POLL_MS = 1500;

/** Steps that only carry the form in and the result out: not worth a line while watching. */
const HIDDEN_STEP_TYPES = ['workflow_input', 'workflow_output'];

const stepIcon = (step: TNodeRun) => {
	if (step.status === 'completed') return <CheckCircle2 className='text-primary-400 size-4' />;
	if (step.status === 'failed') return <XCircle className='size-4 text-red-400' />;
	if (step.status === 'running')
		return <Loader2 className='text-primary-400 size-4 animate-spin' />;
	return <Circle className='size-4 text-zinc-600' />;
};

/**
 * "Run it": the first run, on the template's example answers. App steps are
 * shown rather than executed (see `SampleRuns` in the API), so connecting an
 * app is offered but never required. The run is watched as it happens.
 */
const RunStep = (props: TProps) => {
	const plan = useSampleRunPlan(props.ws, props.workflowId);

	if (plan.data) {
		return (
			<SampleRun
				plan={plan.data}
				ws={props.ws}
				workflowId={props.workflowId}
				workflowName={props.workflowName}
				onSucceeded={props.onSucceeded}
				onOpenEditor={props.onOpenEditor}
			/>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center gap-4 py-20 text-sm font-bold text-zinc-500'>
			{plan.isError ? (
				<>
					<p>We couldn't load this workflow's run form.</p>
					<WizardButton variant='dark' onClick={props.onOpenEditor}>
						Open in editor
					</WizardButton>
				</>
			) : (
				<span className='flex items-center gap-2'>
					<Loader2 className='size-4 animate-spin' />
					Getting your workflow ready…
				</span>
			)}
		</div>
	);
};

const SampleRun = ({
	ws,
	workflowId,
	workflowName,
	onSucceeded,
	onOpenEditor,
	plan,
}: TProps & { plan: TSampleRunPlan }) => {
	const qc = useQueryClient();
	const appName = useConnectorNames();
	const startRun = useStartSampleRun(ws, workflowId);
	// The form starts from the template's example answers.
	const [values, setValues] = useState<Record<string, string>>(() =>
		Object.fromEntries(plan.fields.map((field) => [field.key, field.sample ?? ''])),
	);
	const [runId, setRunId] = useState('');
	const [connecting, setConnecting] = useState<string | null>(null);
	const { data: run } = useRun(ws, runId, { pollMs: RUN_POLL_MS });

	const { fields, app_steps: appSteps } = plan;
	const appStepNames = useMemo(
		() => new Map(appSteps.map((step) => [step.key, step.name])),
		[appSteps],
	);
	const apps = useMemo(
		() => [...new Map(appSteps.map((step) => [step.connector, step.connected])).entries()],
		[appSteps],
	);

	useEffect(() => {
		if (run?.status === 'completed') onSucceeded(run);
	}, [run, onSucceeded]);

	const isRunning = !!run && !TERMINAL_RUN_STATUSES.includes(run.status);
	const hasFailed = run?.status === 'failed' || run?.status === 'cancelled';
	const missingRequired = fields.some((field) => field.required && !values[field.key]?.trim());
	const visibleSteps = (run?.node_runs ?? []).filter(
		(step) => !HIDDEN_STEP_TYPES.includes(step.type),
	);

	const handleRun = () => {
		startRun.mutate({ input: values }, { onSuccess: (started) => setRunId(started.id) });
	};

	return (
		<div className='grid gap-8 lg:grid-cols-2'>
			<div className='flex flex-col gap-6'>
				<StepHeading
					title="Let's run it"
					description={`${workflowName}. It runs on example data: AI steps run for real, and app steps show what they would send instead of sending it.`}
				/>

				<form
					className='flex flex-col gap-5'
					onSubmit={(event) => {
						event.preventDefault();
						handleRun();
					}}>
					{fields.length > 0 && (
						<fieldset className='flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
							<legend className='px-1 text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
								Example answers
							</legend>
							{fields.map((field) => {
								const id = `sample-field-${field.key}`;
								const isLong =
									field.type === 'text' || (values[field.key]?.length ?? 0) > 80;
								const inputClass =
									'focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium focus:ring-4 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950';
								return (
									<div key={field.key} className='flex flex-col gap-1.5'>
										<label htmlFor={id} className='text-sm font-bold'>
											{field.label}
											{!field.required && (
												<span className='ml-1.5 text-xs font-medium text-zinc-500'>
													Optional
												</span>
											)}
										</label>
										{isLong ? (
											<textarea
												id={id}
												rows={3}
												value={values[field.key] ?? ''}
												onChange={(event) =>
													setValues({
														...values,
														[field.key]: event.target.value,
													})
												}
												className={inputClass}
											/>
										) : (
											<input
												id={id}
												value={values[field.key] ?? ''}
												onChange={(event) =>
													setValues({
														...values,
														[field.key]: event.target.value,
													})
												}
												className={inputClass}
											/>
										)}
										{field.description && (
											<p className='text-xs text-zinc-500 dark:text-zinc-400'>
												{field.description}
											</p>
										)}
									</div>
								);
							})}
						</fieldset>
					)}

					{apps.length > 0 && (
						<ul className='flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900'>
							{apps.map(([connector, connected]) => (
								<li
									key={connector}
									className='flex items-center justify-between gap-3 p-4'>
									<span className='flex min-w-0 items-center gap-3'>
										<Plug
											className='size-4 shrink-0 text-zinc-400'
											aria-hidden='true'
										/>
										<span className='min-w-0'>
											<span className='block text-sm font-bold'>
												{appName(connector)}
											</span>
											<span className='block text-xs text-zinc-500 dark:text-zinc-400'>
												{connected
													? 'Connected. This run still only shows what would be sent.'
													: 'Not connected. The run shows what would be sent.'}
											</span>
										</span>
									</span>
									{connected ? (
										<span className='text-primary-800 dark:text-primary-300 flex shrink-0 items-center gap-1 text-xs font-bold'>
											<CheckCircle2 className='size-3.5' />
											Connected
										</span>
									) : (
										<WizardButton
											variant='dark'
											className='h-9 shrink-0 px-3 text-xs'
											onClick={() => setConnecting(connector)}>
											Connect
										</WizardButton>
									)}
								</li>
							))}
						</ul>
					)}

					<WizardButton
						type='submit'
						className='h-12 text-base'
						disabled={missingRequired || isRunning}
						isLoading={startRun.isPending || isRunning}
						icon={<Play className='size-4' />}>
						{isRunning ? 'Running…' : hasFailed ? 'Run again' : 'Run with example data'}
					</WizardButton>
				</form>
			</div>

			<aside
				aria-live='polite'
				className='flex min-h-72 flex-col gap-4 self-start rounded-2xl bg-zinc-950 p-6 text-zinc-100 lg:sticky lg:top-8 dark:ring-1 dark:ring-zinc-800'>
				<p className='text-primary-400 text-xs font-black tracking-wider uppercase'>
					Live run
				</p>

				{!run ? (
					<p className='text-sm text-zinc-400'>
						Press Run and each step appears here as it happens. It usually takes under a
						minute.
					</p>
				) : (
					<ol className='flex flex-col gap-3'>
						{visibleSteps.map((step) => (
							<li key={step.id} className='flex items-start gap-3 text-sm'>
								<span className='mt-0.5'>{stepIcon(step)}</span>
								<span className='min-w-0'>
									<span className='block font-semibold'>
										{appStepNames.get(step.key) ?? humanizeKey(step.key)}
									</span>
									{step.error && (
										<span className='block text-xs text-red-300'>
											{step.error}
										</span>
									)}
								</span>
							</li>
						))}
						{isRunning && visibleSteps.length === 0 && (
							<li className='flex items-center gap-3 text-sm text-zinc-400'>
								<Loader2 className='size-4 animate-spin' />
								Starting…
							</li>
						)}
					</ol>
				)}

				{hasFailed && (
					<div className='mt-auto flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4'>
						<p className='flex items-center gap-2 text-sm font-bold text-red-200'>
							<AlertCircle className='size-4' />
							{run?.error ?? 'The run stopped before it finished.'}
						</p>
						<p className='text-xs text-zinc-300'>
							Change the answers and run again, or open the workflow to see each step.
						</p>
						<WizardButton
							variant='ghost'
							className='self-start text-zinc-100 hover:bg-zinc-800'
							onClick={onOpenEditor}>
							Open in editor
						</WizardButton>
					</div>
				)}
			</aside>

			{connecting && (
				<AccountSelect
					popupOnly
					connectorKey={connecting}
					onChange={() => {
						setConnecting(null);
						void qc.invalidateQueries({ queryKey: sampleRunKeys.plan(ws, workflowId) });
					}}
					onClose={() => setConnecting(null)}
				/>
			)}
		</div>
	);
};

export default RunStep;
