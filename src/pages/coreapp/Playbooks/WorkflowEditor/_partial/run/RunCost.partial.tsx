import { ChevronRight, Coins } from 'lucide-react';
import { useRunCost } from '@/api/modules/runs';

/**
 * What the current run has cost in credits, live while it runs, with the
 * breakdown by kind of step, each step's credits and the models that served
 * it. Credits only: provider costs are never shown to customers.
 */
const RunCost = ({ workspaceId, runId }: { workspaceId: string; runId: string | null }) => {
	const { data: cost } = useRunCost(workspaceId, runId);

	if (!cost) return null;

	const lines = cost.lines.filter((line) => line.credits > 0 || line.waived);

	return (
		<details className='group mt-3 rounded-lg border border-zinc-200 dark:border-white/10'>
			<summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5'>
				<span className='flex items-center gap-2 text-xs font-medium'>
					<Coins size={14} className='text-zinc-400' />
					{cost.in_progress ? 'Credits so far' : 'Credits used'}
					{cost.in_progress && (
						<span
							className='h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 motion-reduce:animate-none'
							aria-hidden='true'
						/>
					)}
				</span>
				<span className='flex items-center gap-1 text-xs font-semibold tabular-nums'>
					{cost.credits.toLocaleString()}
					<ChevronRight
						size={14}
						className='text-zinc-400 transition group-open:rotate-90'
						aria-hidden='true'
					/>
				</span>
			</summary>
			<div className='space-y-3 border-t border-zinc-200 px-3 py-3 text-xs dark:border-white/10'>
				<ul className='space-y-1.5' aria-label='Cost breakdown'>
					{lines.length === 0 && (
						<li className='text-zinc-500 dark:text-zinc-400'>Nothing charged yet.</li>
					)}
					{lines.map((line) => (
						<li key={line.key} className='flex items-center justify-between gap-3'>
							<span className='text-zinc-600 dark:text-zinc-300'>{line.label}</span>
							{line.waived ? (
								<span className='tabular-nums'>
									<s className='text-zinc-400'>
										{(line.would_have_cost ?? 0).toLocaleString()}
									</s>{' '}
									<span className='font-medium text-emerald-600 dark:text-emerald-400'>
										Free
									</span>
								</span>
							) : (
								<span className='font-medium tabular-nums'>
									{line.credits.toLocaleString()}
								</span>
							)}
						</li>
					))}
				</ul>
				{cost.steps.length > 0 && (
					<ul className='space-y-1 border-t border-zinc-100 pt-3 dark:border-white/5'>
						{cost.steps.map((step) => (
							<li
								key={step.node_run_id}
								className='flex items-center justify-between gap-3 text-zinc-500 dark:text-zinc-400'>
								<span className='truncate'>{step.key}</span>
								<span className='tabular-nums'>
									{step.credits.toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				)}
				{cost.models.length > 0 && (
					<p className='border-t border-zinc-100 pt-3 text-zinc-500 dark:border-white/5 dark:text-zinc-400'>
						{cost.models
							.map(
								(model) =>
									`${model.model}${model.own_key ? ' (your key)' : ''} · ${model.calls} call${model.calls === 1 ? '' : 's'}`,
							)
							.join(', ')}
					</p>
				)}
			</div>
		</details>
	);
};

export default RunCost;
