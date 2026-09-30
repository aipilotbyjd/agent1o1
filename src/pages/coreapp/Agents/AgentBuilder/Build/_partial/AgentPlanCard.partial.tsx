import { useState } from 'react';
import { Check, ListChecks, X } from 'lucide-react';
import type { TAgentPlan } from '@/types/agent-action.type';
import { prettifyActionTool } from './AgentApprovalCards.partial';

/**
 * Plan mode's review step: the plan the agent proposed, step by step. A
 * person can drop steps before approving; once approved, calls matching a
 * remaining step run without asking. Rejecting sends the note back so the
 * agent can revise.
 */
const AgentPlanCard = ({
	plan,
	busy,
	onApprove,
	onReject,
}: {
	plan: TAgentPlan;
	busy: boolean;
	onApprove: (skipStepIds: string[], note: string | null) => void;
	onReject: (note: string | null) => void;
}) => {
	const [skipped, setSkipped] = useState<string[]>([]);
	const [note, setNote] = useState('');
	const kept = plan.steps.length - skipped.length;

	const toggle = (stepId: string) =>
		setSkipped((prev) =>
			prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId],
		);

	return (
		<div className='flex w-full justify-start'>
			<div className='w-full max-w-3xl pl-12'>
				<div className='rounded-2xl border border-violet-200 bg-violet-50/40 p-3.5 dark:border-violet-900/60 dark:bg-violet-950/20'>
					<div className='flex items-center gap-2'>
						<ListChecks size={15} className='text-violet-600 dark:text-violet-400' />
						<span className='text-[13px] font-bold text-zinc-800 dark:text-zinc-100'>
							{plan.title}
						</span>
						<span className='ml-auto text-[11px] font-semibold text-zinc-400'>
							Plan waiting for approval
						</span>
					</div>
					{plan.summary && (
						<p className='mt-1.5 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400'>
							{plan.summary}
						</p>
					)}
					<ol className='mt-3 space-y-1.5'>
						{plan.steps.map((step, index) => {
							const isSkipped = skipped.includes(step.id);
							return (
								<li key={step.id}>
									<label
										className={`flex cursor-pointer items-start gap-2.5 rounded-lg bg-white px-2.5 py-2 dark:bg-zinc-950 ${isSkipped ? 'opacity-50' : ''}`}>
										<input
											type='checkbox'
											checked={!isSkipped}
											disabled={busy}
											onChange={() => toggle(step.id)}
											className='mt-0.5'
											aria-label={`Include step ${index + 1}`}
										/>
										<span className='min-w-0 flex-1'>
											<span
												className={`block text-[12.5px] font-bold text-zinc-700 dark:text-zinc-200 ${isSkipped ? 'line-through' : ''}`}>
												{index + 1}. {step.summary}
											</span>
											<span className='block truncate font-mono text-[11px] font-semibold text-zinc-400'>
												{prettifyActionTool(step.tool)}
												{Object.keys(step.arguments ?? {}).length > 0 &&
													` · ${Object.entries(step.arguments)
														.map(
															([key, value]) =>
																`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
														)
														.join(', ')}`}
											</span>
										</span>
									</label>
								</li>
							);
						})}
					</ol>
					<input
						value={note}
						onChange={(event) => setNote(event.target.value)}
						maxLength={2000}
						placeholder='Note for the agent (optional)'
						className='mt-2.5 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[12.5px] font-semibold text-zinc-800 outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'
					/>
					<div className='mt-3 flex flex-wrap items-center gap-2'>
						<button
							type='button'
							disabled={busy || kept === 0}
							onClick={() => onApprove(skipped, note.trim() || null)}
							className='flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12.5px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50'>
							<Check size={13} />{' '}
							{skipped.length > 0
								? `Approve ${kept} step${kept === 1 ? '' : 's'}`
								: 'Approve plan'}
						</button>
						<button
							type='button'
							disabled={busy}
							onClick={() => onReject(note.trim() || null)}
							className='flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-rose-950/40'>
							<X size={13} /> Send back
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AgentPlanCard;
