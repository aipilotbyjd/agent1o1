import { useState } from 'react';
import { ArrowRight, Check, Send, Zap } from 'lucide-react';
import { notify } from '@/api/core';
import { useInviteWorkspaceMember } from '@/api/modules/workspace-members';
import usePermission from '@/hooks/usePermission';
import type { TNodeRun, TRun } from '@/types/run.type';
import type { TSampleStepOutput } from '@/types/workflow.type';
import WizardButton from '../shared/WizardButton.partial';
import { humanizeKey, isValidEmail } from '../../_helper/onboarding.helper';

type TProps = {
	ws: string;
	run: TRun;
	isFinishing: boolean;
	onAutopilot: () => void;
	onDashboard: () => void;
};

/** How many of a previewed step's fields are shown: enough to recognise it. */
const PREVIEW_FIELDS = 4;
const VALUE_LENGTH = 280;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isPreview = (output: unknown): output is TSampleStepOutput =>
	isRecord(output) && output.sample === true && isRecord(output.would_send);

const asText = (value: unknown) => {
	const text = typeof value === 'string' ? value : JSON.stringify(value);
	return text.length > VALUE_LENGTH ? `${text.slice(0, VALUE_LENGTH)}…` : text;
};

/**
 * What the run produced: the workflow's own output when it returns one, else
 * the last AI reply, which is what a template's output is built from.
 */
const resultEntries = (run: TRun): [string, string][] => {
	if (isRecord(run.output) && Object.keys(run.output).length > 0) {
		return Object.entries(run.output).map(([key, value]) => [humanizeKey(key), asText(value)]);
	}

	const lastReply = [...(run.node_runs ?? [])]
		.reverse()
		.find((step) => isRecord(step.output) && typeof step.output.text === 'string');

	return lastReply && isRecord(lastReply.output)
		? [['Result', asText(lastReply.output.text)]]
		: [];
};

const previewedSteps = (run: TRun): TNodeRun[] =>
	(run.node_runs ?? []).filter((step) => isPreview(step.output));

/**
 * The first win: the run's result, what its app steps would have sent, and
 * the two moves that keep it going: letting it run by itself, and bringing a
 * teammate in now that there is something to show them.
 */
const SuccessStep = ({ ws, run, isFinishing, onAutopilot, onDashboard }: TProps) => {
	const { can } = usePermission();
	const invite = useInviteWorkspaceMember(ws);
	const [email, setEmail] = useState('');
	const [invited, setInvited] = useState<string[]>([]);

	const results = resultEntries(run);
	const previews = previewedSteps(run);
	const seconds = run.duration_ms ? Math.max(1, Math.round(run.duration_ms / 1000)) : null;

	const handleInvite = () => {
		const address = email.trim();
		if (!isValidEmail(address)) return;
		invite.mutate(
			{ email: address, role: 'member' },
			{
				onSuccess: () => {
					setInvited((current) => [...current, address]);
					setEmail('');
					notify.success(`Invitation sent to ${address}.`);
				},
			},
		);
	};

	return (
		<div className='grid gap-8 lg:grid-cols-2'>
			<div className='flex flex-col gap-6'>
				<div className='flex flex-col gap-3'>
					<span className='bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 flex size-12 items-center justify-center rounded-2xl'>
						<Check className='size-6' strokeWidth={3} />
					</span>
					<h1 className='text-3xl font-black tracking-tight text-balance sm:text-4xl'>
						It worked. Here's your result.
					</h1>
					<p className='text-base font-medium text-zinc-600 dark:text-zinc-400'>
						{seconds
							? `Your first workflow ran in ${seconds} seconds.`
							: 'Your first workflow ran.'}{' '}
						Nothing was sent: this was a run on example data.
					</p>
				</div>

				{results.length > 0 && (
					<dl className='flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
						{results.map(([label, value]) => (
							<div key={label}>
								<dt className='text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
									{label}
								</dt>
								<dd className='mt-1 text-sm whitespace-pre-line text-zinc-800 dark:text-zinc-200'>
									{value}
								</dd>
							</div>
						))}
					</dl>
				)}

				{previews.length > 0 && (
					<section aria-labelledby='would-send-heading' className='flex flex-col gap-3'>
						<h2
							id='would-send-heading'
							className='text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
							What it would have sent
						</h2>
						{previews.map((step) => {
							const fields = isPreview(step.output)
								? Object.entries(step.output.would_send).slice(0, PREVIEW_FIELDS)
								: [];
							return (
								<div
									key={step.id}
									className='rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/60'>
									<p className='text-sm font-bold'>{humanizeKey(step.key)}</p>
									<dl className='mt-2 grid gap-1 text-xs'>
										{fields.map(([key, value]) => (
											<div key={key} className='flex gap-2'>
												<dt className='shrink-0 font-bold text-zinc-500'>
													{humanizeKey(key)}:
												</dt>
												<dd className='min-w-0 break-words text-zinc-700 dark:text-zinc-300'>
													{asText(value)}
												</dd>
											</div>
										))}
									</dl>
								</div>
							);
						})}
					</section>
				)}
			</div>

			<div className='flex flex-col gap-5'>
				<div className='flex flex-col gap-4 rounded-2xl bg-zinc-950 p-6 text-white dark:ring-1 dark:ring-zinc-800'>
					<p className='text-primary-400 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase'>
						<Zap className='size-3.5' />
						Next: make it run by itself
					</p>
					<p className='text-xl font-extrabold'>Put this workflow on autopilot</p>
					<p className='text-sm text-zinc-400'>
						Connect your apps and add a trigger, like a new form entry or a schedule,
						and it runs every time without you.
					</p>
					<WizardButton
						onClick={onAutopilot}
						isLoading={isFinishing}
						icon={<ArrowRight className='size-4' />}>
						Set it up
					</WizardButton>
					<button
						type='button'
						onClick={onDashboard}
						disabled={isFinishing}
						className='text-sm font-bold text-zinc-400 transition-colors hover:text-white disabled:opacity-50'>
						Later, take me to my dashboard
					</button>
				</div>

				{can('member.invite') && (
					<form
						className='flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'
						onSubmit={(event) => {
							event.preventDefault();
							handleInvite();
						}}>
						<label htmlFor='invite-teammate' className='text-base font-extrabold'>
							Who else should see results like this?
						</label>
						<div className='flex gap-2'>
							<input
								id='invite-teammate'
								type='email'
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder='teammate@company.com'
								className='focus:border-primary-500 focus:ring-primary-500/20 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium focus:ring-4 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950'
							/>
							<WizardButton
								type='submit'
								variant='dark'
								disabled={!isValidEmail(email.trim())}
								isLoading={invite.isPending}
								icon={<Send className='size-4' />}>
								Invite
							</WizardButton>
						</div>
						{invited.length > 0 && (
							<p className='text-xs font-medium text-zinc-500'>
								Invited: {invited.join(', ')}
							</p>
						)}
					</form>
				)}
			</div>
		</div>
	);
};

export default SuccessStep;
