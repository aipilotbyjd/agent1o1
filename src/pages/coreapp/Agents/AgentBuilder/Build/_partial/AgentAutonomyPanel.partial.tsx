import { FlaskConical, Globe, Lightbulb, ShieldCheck } from 'lucide-react';
import { useAgent, useUpdateAgent } from '@/api/modules/agents';
import {
	useAgentToolBindings,
	useAgentWorkflowTools,
	useUpdateAgentToolBinding,
	useUpdateAgentWorkflowPolicy,
} from '@/api/modules/agent-tools';
import {
	useAgentTrustSuggestions,
	useApplyAgentTrustSuggestion,
	useWorkspaceAgentPolicy,
} from '@/api/modules/agent-actions';
import {
	AUTONOMY_MODES,
	AUTONOMY_MODE_META,
	type TApprovalPolicy,
	type TAutonomyMode,
	type TRuleVerdict,
} from '@/types/agent-action.type';

type TProps = {
	ws: string;
	agentId?: string;
	/** Display name for a node type, from the node catalog. */
	nodeName: (nodeType: string) => string | undefined;
};

type TRuleChoice = TRuleVerdict | 'inherit';

const RULE_CHOICES: { value: TRuleChoice; label: string }[] = [
	{ value: 'inherit', label: 'Mode' },
	{ value: 'allow', label: 'Allow' },
	{ value: 'ask', label: 'Ask' },
	{ value: 'deny', label: 'Block' },
];

const ruleChoice = (policy: TApprovalPolicy | null | undefined): TRuleChoice =>
	policy?.mode && policy.mode !== 'inherit' ? policy.mode : 'inherit';

/** Sets a rule's `mode`, keeping its conditions, rate limit and approvers. */
const withMode = (
	policy: TApprovalPolicy | null | undefined,
	mode: TRuleChoice,
): TApprovalPolicy | null => {
	const next: TApprovalPolicy = { ...(policy ?? {}), mode: mode === 'inherit' ? null : mode };
	const isEmpty =
		!next.mode && !next.conditions?.length && !next.rate_limit && !next.approvers?.length;
	return isEmpty ? null : next;
};

/** Modes from strictest to loosest, so the workspace cap is an index. */
const rank = (mode: TAutonomyMode) => AUTONOMY_MODES.indexOf(mode);

const Switch = ({
	checked,
	label,
	disabled,
	onChange,
}: {
	checked: boolean;
	label: string;
	disabled?: boolean;
	onChange: (next: boolean) => void;
}) => (
	<button
		type='button'
		role='switch'
		aria-checked={checked}
		aria-label={label}
		disabled={disabled}
		onClick={() => onChange(!checked)}
		className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
			checked ? 'bg-primary-400 dark:bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
		}`}>
		<span
			className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
				checked ? 'translate-x-4' : 'translate-x-0'
			}`}
		/>
	</button>
);

const RulePicker = ({
	value,
	disabled,
	onChange,
	label,
}: {
	value: TRuleChoice;
	disabled?: boolean;
	onChange: (next: TRuleChoice) => void;
	label: string;
}) => (
	<div
		role='radiogroup'
		aria-label={label}
		className='flex shrink-0 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800'>
		{RULE_CHOICES.map((choice) => (
			<button
				key={choice.value}
				type='button'
				role='radio'
				aria-checked={value === choice.value}
				disabled={disabled}
				onClick={() => onChange(choice.value)}
				className={`min-h-7 rounded-md px-2 text-[10.5px] font-bold transition-colors disabled:opacity-50 ${
					value === choice.value
						? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white'
						: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
				}`}>
				{choice.label}
			</button>
		))}
	</div>
);

/**
 * How freely the agent may act: its autonomy mode, Test run, web fetching,
 * and a per-tool rule for each attached tool (follow the mode, always allow,
 * always ask, or block). Saves as you change it — these are safety settings,
 * so they apply to conversations already in flight.
 */
const AgentAutonomyPanel = ({ ws, agentId, nodeName }: TProps) => {
	const { data: agent } = useAgent(ws, agentId ?? '');
	const { data: policy } = useWorkspaceAgentPolicy(ws);
	const { data: toolBindings } = useAgentToolBindings(ws, agentId ?? '');
	const { data: workflowTools } = useAgentWorkflowTools(ws, agentId ?? '');
	const { data: suggestions } = useAgentTrustSuggestions(ws, agentId ?? '');
	const updateAgent = useUpdateAgent(ws);
	const updateBinding = useUpdateAgentToolBinding(ws, agentId ?? '');
	const updateWorkflowPolicy = useUpdateAgentWorkflowPolicy(ws, agentId ?? '');
	const applySuggestion = useApplyAgentTrustSuggestion(ws, agentId ?? '');

	if (!agentId || !agent) return null;

	const cap = policy?.max_autonomy_mode ?? null;
	const save = (body: Parameters<typeof updateAgent.mutate>[0]['body']) =>
		updateAgent.mutate({ id: agentId, body });

	return (
		<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex items-center gap-2'>
				<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
					<ShieldCheck size={14} />
				</div>
				<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
					Autonomy & approvals
				</h4>
			</div>

			<div role='radiogroup' aria-label='Autonomy mode' className='grid gap-1.5'>
				{AUTONOMY_MODES.map((mode) => {
					const overCap = cap !== null && rank(mode) > rank(cap);
					const selected = agent.autonomy_mode === mode;
					return (
						<button
							key={mode}
							type='button'
							role='radio'
							aria-checked={selected}
							disabled={updateAgent.isPending}
							onClick={() => !selected && save({ autonomy_mode: mode })}
							className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
								selected
									? 'border-primary-400 bg-primary-400/5'
									: 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700'
							}`}>
							<span
								className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
									selected
										? 'border-primary-500'
										: 'border-zinc-300 dark:border-zinc-600'
								}`}>
								{selected && (
									<span className='bg-primary-500 h-1.5 w-1.5 rounded-full' />
								)}
							</span>
							<span className='min-w-0'>
								<span className='block text-xs font-black text-zinc-800 dark:text-zinc-200'>
									{AUTONOMY_MODE_META[mode].label}
								</span>
								<span className='mt-0.5 block text-[10px] leading-normal font-semibold text-zinc-400'>
									{overCap
										? `Capped at ${AUTONOMY_MODE_META[cap].label} by your workspace — runs as that.`
										: AUTONOMY_MODE_META[mode].description}
								</span>
							</span>
						</button>
					);
				})}
			</div>

			{agent.test_mode && (
				<p className='flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-[11px] leading-normal font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'>
					<FlaskConical size={13} className='mt-px shrink-0' />
					Test run is on, so no action waits for approval — each one is simulated instead.
					Turn it off to approve actions for real.
				</p>
			)}

			<div className='flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
				<div className='flex items-center gap-3'>
					<FlaskConical size={16} className='text-primary-500 shrink-0' />
					<div className='flex flex-col pr-4'>
						<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
							Test run
						</span>
						<span className='mt-0.5 text-[10px] leading-normal font-semibold text-zinc-400'>
							Simulate every action instead of running or asking — nothing is really
							sent, posted or changed.
						</span>
					</div>
				</div>
				<Switch
					checked={agent.test_mode}
					label='Test run'
					disabled={updateAgent.isPending}
					onChange={(next) => save({ test_mode: next })}
				/>
			</div>

			<div className='flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
				<div className='flex items-center gap-3'>
					<Globe size={16} className='text-primary-500 shrink-0' />
					<div className='flex flex-col pr-4'>
						<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
							Open web pages
						</span>
						<span className='mt-0.5 text-[10px] leading-normal font-semibold text-zinc-400'>
							Let the agent fetch pages from the web. Fetching can't be approved call
							by call.
						</span>
					</div>
				</div>
				<Switch
					checked={agent.allow_web_fetch}
					label='Allow fetching web pages'
					disabled={updateAgent.isPending}
					onChange={(next) => save({ allow_web_fetch: next })}
				/>
			</div>

			{((toolBindings ?? []).length > 0 || (workflowTools ?? []).length > 0) && (
				<div className='space-y-1.5'>
					<span className='block text-[10.5px] font-black tracking-wide text-zinc-400 uppercase'>
						Tool rules
					</span>
					{(toolBindings ?? []).map((binding) => (
						<div
							key={binding.id}
							className='flex items-center justify-between gap-2 py-1'>
							<span className='min-w-0 truncate text-xs font-bold text-zinc-700 dark:text-zinc-200'>
								{nodeName(binding.node_type) ?? binding.node_type}
								{(binding.approval_policy?.conditions?.length ?? 0) > 0 && (
									<span className='ml-1.5 text-[10px] font-semibold text-zinc-400'>
										+ conditions
									</span>
								)}
							</span>
							<RulePicker
								label={`Rule for ${nodeName(binding.node_type) ?? binding.node_type}`}
								value={ruleChoice(binding.approval_policy)}
								disabled={updateBinding.isPending}
								onChange={(next) =>
									updateBinding.mutate({
										id: binding.id,
										body: {
											approval_policy: withMode(
												binding.approval_policy,
												next,
											),
										},
									})
								}
							/>
						</div>
					))}
					{(workflowTools ?? []).map((workflow) => (
						<div
							key={workflow.id}
							className='flex items-center justify-between gap-2 py-1'>
							<span className='min-w-0 truncate text-xs font-bold text-zinc-700 dark:text-zinc-200'>
								{workflow.name}
							</span>
							<RulePicker
								label={`Rule for ${workflow.name}`}
								value={ruleChoice(workflow.approval_policy)}
								disabled={updateWorkflowPolicy.isPending}
								onChange={(next) =>
									updateWorkflowPolicy.mutate({
										workflowId: String(workflow.id),
										policy: withMode(workflow.approval_policy, next),
									})
								}
							/>
						</div>
					))}
					{cap !== null && (
						<p className='text-[10px] font-semibold text-zinc-400'>
							“Allow” still can't run anything more freely than your workspace's{' '}
							{AUTONOMY_MODE_META[cap].label} cap.
						</p>
					)}
				</div>
			)}

			{(suggestions ?? []).map((suggestion) => (
				<div
					key={suggestion.tool_name}
					className='flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20'>
					<Lightbulb
						size={14}
						className='shrink-0 text-emerald-600 dark:text-emerald-400'
					/>
					<span className='min-w-0 flex-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300'>
						You approved <b>{nodeName(suggestion.tool_name) ?? suggestion.tool_name}</b>{' '}
						unchanged {suggestion.approvals} times. Let it run without asking?
					</span>
					<button
						type='button'
						disabled={applySuggestion.isPending}
						onClick={() => applySuggestion.mutate(suggestion.tool_name)}
						className='min-h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/40'>
						Always allow
					</button>
				</div>
			))}
		</div>
	);
};

export default AgentAutonomyPanel;
