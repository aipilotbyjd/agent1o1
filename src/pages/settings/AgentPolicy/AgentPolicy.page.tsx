import { useState } from 'react';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import { useWorkspace } from '@/api/modules/workspaces';
import {
	useUpdateWorkspaceAgentPolicy,
	useWorkspaceAgentPolicy,
} from '@/api/modules/agent-actions';
import { notify } from '@/api/core';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
	AUTONOMY_MODES,
	AUTONOMY_MODE_META,
	type TActionEffect,
	type TAutonomyMode,
	type TGuardrail,
	type TRuleVerdict,
	type TWorkspaceAgentPolicy,
} from '@/types/agent-action.type';

const EFFECTS: { value: TActionEffect; label: string }[] = [
	{ value: 'write', label: 'Changes data' },
	{ value: 'external', label: 'Reaches people' },
	{ value: 'destructive', label: 'Deletes' },
	{ value: 'read', label: 'Reads' },
];

const VERDICTS: { value: TRuleVerdict; label: string }[] = [
	{ value: 'ask', label: 'Ask first' },
	{ value: 'deny', label: 'Block' },
	{ value: 'allow', label: 'Allow' },
];

const TTL_OPTIONS = [
	{ minutes: 60, label: '1 hour' },
	{ minutes: 240, label: '4 hours' },
	{ minutes: 1440, label: '1 day' },
	{ minutes: 4320, label: '3 days' },
	{ minutes: 10080, label: '1 week' },
];

type TDraft = Omit<TWorkspaceAgentPolicy, 'workspace_id' | 'updated_at'>;

const toDraft = (policy: TWorkspaceAgentPolicy): TDraft => ({
	max_autonomy_mode: policy.max_autonomy_mode,
	allow_destructive_in_autopilot: policy.allow_destructive_in_autopilot,
	guardrails: policy.guardrails,
	approval_ttl_minutes: policy.approval_ttl_minutes,
	allow_chat_approvals: policy.allow_chat_approvals,
});

const Toggle = ({
	checked,
	disabled,
	label,
	description,
	onChange,
}: {
	checked: boolean;
	disabled: boolean;
	label: string;
	description: string;
	onChange: (next: boolean) => void;
}) => (
	<div className='flex items-center justify-between gap-4 py-3'>
		<div>
			<p className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>{label}</p>
			<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
				{description}
			</p>
		</div>
		<button
			type='button'
			role='switch'
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
				checked ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-700'
			}`}>
			<span
				className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
					checked ? 'translate-x-4' : 'translate-x-0'
				}`}
			/>
		</button>
	</div>
);

/**
 * The workspace's guardrails over every agent — readable by anyone, changed
 * by admins. Nothing an agent's own settings say can get past these: a mode
 * cap, destructive actions on Autopilot, rules that ask or block by tool or
 * kind of action, how long a request waits, and deciding from Slack.
 */
const AgentPolicyPage = () => {
	const { activeWorkspaceId: ws } = useWorkspaceContext();
	const { data: workspace } = useWorkspace(ws);
	const canEdit = workspace?.role === 'owner' || workspace?.role === 'admin';
	const { data: policy, isLoading, isError } = useWorkspaceAgentPolicy(ws);
	const update = useUpdateWorkspaceAgentPolicy(ws);
	// Unsaved edits; null means "showing what's saved". Derived rather than
	// copied in an effect, so a save (or another admin's) shows straight away.
	const [edits, setEdits] = useState<TDraft | null>(null);
	const draft = edits ?? (policy ? toDraft(policy) : null);

	const patch = (changes: Partial<TDraft>) =>
		setEdits((prev) => {
			const base = prev ?? (policy ? toDraft(policy) : null);
			return base ? { ...base, ...changes } : base;
		});
	const patchGuardrail = (index: number, changes: Partial<TGuardrail>) =>
		patch({
			guardrails: (draft?.guardrails ?? []).map((rule, i) =>
				i === index ? { ...rule, ...changes } : rule,
			),
		});

	const save = () => {
		if (!draft) return;
		update.mutate(
			{
				...draft,
				guardrails: draft.guardrails.map((rule) => ({
					...rule,
					name: rule.name?.trim() || null,
					tools: (rule.tools ?? []).map((tool) => tool.trim()).filter(Boolean),
				})),
			},
			{
				onSuccess: () => {
					setEdits(null);
					notify.success('Agent policy saved.');
				},
			},
		);
	};

	if (isLoading || (!draft && !isError)) {
		return (
			<div className='flex justify-center py-20'>
				<Spinner color='primary' className='size-8' />
			</div>
		);
	}

	if (isError || !draft) {
		return (
			<p className='py-20 text-center text-sm font-semibold text-zinc-500'>
				Could not load the agent policy.
			</p>
		);
	}

	const disabled = !canEdit || update.isPending;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Agent Policy
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Limits on what every agent in this workspace may do on its own. No agent
						setting can get past them.
					</p>
				</div>
				{canEdit && (
					<Button
						variant='solid'
						color='primary'
						onClick={save}
						isDisable={update.isPending}
						className='shadow-primary-500/10 h-12 font-bold text-zinc-950 shadow-md'>
						{update.isPending ? 'Saving…' : 'Save changes'}
					</Button>
				)}
			</div>

			{!canEdit && (
				<p className='mb-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900'>
					Only workspace owners and admins can change these.
				</p>
			)}

			<section className='mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
				<h2 className='text-base font-black text-zinc-900 dark:text-white'>
					Most freedom any agent gets
				</h2>
				<p className='mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					An agent set to a looser mode runs as this one instead. Tool rules set to
					“Allow” can't get past it either.
				</p>
				<select
					aria-label='Maximum autonomy mode'
					value={draft.max_autonomy_mode ?? ''}
					disabled={disabled}
					onChange={(event) =>
						patch({
							max_autonomy_mode: (event.target.value || null) as TAutonomyMode | null,
						})
					}
					className='mt-3 min-h-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'>
					<option value=''>No limit</option>
					{AUTONOMY_MODES.map((mode) => (
						<option key={mode} value={mode}>
							{AUTONOMY_MODE_META[mode].label} —{' '}
							{AUTONOMY_MODE_META[mode].description}
						</option>
					))}
				</select>

				<div className='mt-3 divide-y divide-zinc-100 dark:divide-zinc-800'>
					<Toggle
						checked={draft.allow_destructive_in_autopilot}
						disabled={disabled}
						label='Let Autopilot delete without asking'
						description='Off: deleting something always waits for approval, even on Autopilot.'
						onChange={(next) => patch({ allow_destructive_in_autopilot: next })}
					/>
					<Toggle
						checked={draft.allow_chat_approvals}
						disabled={disabled}
						label='Decide from Slack'
						description='Approval messages in Slack channels get Approve / Reject buttons. Actions with named approvers still need the app.'
						onChange={(next) => patch({ allow_chat_approvals: next })}
					/>
					<div className='flex items-center justify-between gap-4 py-3'>
						<div>
							<p className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
								Approval requests expire after
							</p>
							<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
								If nobody decides in time the action is cancelled and the agent is
								told.
							</p>
						</div>
						<select
							aria-label='Approval requests expire after'
							value={draft.approval_ttl_minutes}
							disabled={disabled}
							onChange={(event) =>
								patch({ approval_ttl_minutes: Number(event.target.value) })
							}
							className='min-h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'>
							{!TTL_OPTIONS.some(
								(option) => option.minutes === draft.approval_ttl_minutes,
							) && (
								<option value={draft.approval_ttl_minutes}>
									{draft.approval_ttl_minutes} minutes
								</option>
							)}
							{TTL_OPTIONS.map((option) => (
								<option key={option.minutes} value={option.minutes}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</section>

			<section className='rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
				<div className='flex items-center justify-between gap-3'>
					<div>
						<h2 className='flex items-center gap-2 text-base font-black text-zinc-900 dark:text-white'>
							<Shield size={16} /> Guardrails
						</h2>
						<p className='mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Rules that make agents ask or stop. They only ever make an action
							stricter.
						</p>
					</div>
					{canEdit && (
						<button
							type='button'
							disabled={disabled || draft.guardrails.length >= 50}
							onClick={() =>
								patch({
									guardrails: [
										...draft.guardrails,
										{ name: '', tools: [], effects: ['external'], then: 'ask' },
									],
								})
							}
							className='flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'>
							<Plus size={13} /> Add rule
						</button>
					)}
				</div>

				{draft.guardrails.length === 0 ? (
					<p className='mt-4 rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs font-semibold text-zinc-400 dark:border-zinc-800'>
						No guardrails yet.
					</p>
				) : (
					<ul className='mt-4 space-y-3'>
						{draft.guardrails.map((rule, index) => (
							<li
								key={index}
								className='rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800'>
								<div className='flex flex-wrap items-center gap-2'>
									<input
										aria-label='Rule name'
										value={rule.name ?? ''}
										disabled={disabled}
										maxLength={255}
										onChange={(event) =>
											patchGuardrail(index, { name: event.target.value })
										}
										placeholder='Name, shown to people when it applies'
										className='min-h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
									/>
									<select
										aria-label='Then'
										value={rule.then}
										disabled={disabled}
										onChange={(event) =>
											patchGuardrail(index, {
												then: event.target.value as TRuleVerdict,
											})
										}
										className='min-h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'>
										{VERDICTS.map((verdict) => (
											<option key={verdict.value} value={verdict.value}>
												{verdict.label}
											</option>
										))}
									</select>
									{canEdit && (
										<button
											type='button'
											aria-label='Remove rule'
											disabled={disabled}
											onClick={() =>
												patch({
													guardrails: draft.guardrails.filter(
														(_, i) => i !== index,
													),
												})
											}
											className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'>
											<Trash2 size={14} />
										</button>
									)}
								</div>
								<div className='mt-2.5 flex flex-wrap items-center gap-3'>
									<span className='text-[11px] font-bold text-zinc-400'>
										Applies to
									</span>
									{EFFECTS.map((effect) => (
										<label
											key={effect.value}
											className='flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
											<input
												type='checkbox'
												disabled={disabled}
												checked={(rule.effects ?? []).includes(
													effect.value,
												)}
												onChange={(event) =>
													patchGuardrail(index, {
														effects: event.target.checked
															? [
																	...(rule.effects ?? []),
																	effect.value,
																]
															: (rule.effects ?? []).filter(
																	(value) =>
																		value !== effect.value,
																),
													})
												}
											/>
											{effect.label}
										</label>
									))}
								</div>
								<input
									aria-label='Tools'
									value={(rule.tools ?? []).join(', ')}
									disabled={disabled}
									onChange={(event) =>
										// Leading spaces dropped so the `, ` the field shows doesn't pile up.
										patchGuardrail(index, {
											tools: event.target.value
												.split(',')
												.map((tool) => tool.trimStart()),
										})
									}
									placeholder='Only these tools (optional), e.g. gmail_*, slack_post_message'
									className='mt-2.5 min-h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'
								/>
								{(rule.conditions?.length ?? 0) > 0 && (
									<p className='mt-2 text-[11px] font-semibold text-zinc-400'>
										Also has {rule.conditions!.length} condition
										{rule.conditions!.length === 1 ? '' : 's'} set through the
										API — kept as they are.
									</p>
								)}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

export default AgentPolicyPage;
