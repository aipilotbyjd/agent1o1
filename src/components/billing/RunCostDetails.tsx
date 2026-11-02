import { FC } from 'react';
import classNames from 'classnames';
import type { TRunCost } from '@/types/billing.type';

interface IRunCostDetailsProps {
	cost: TRunCost;
	className?: string;
	/** Also list each workflow step (for a run page, not a popover). */
	showSteps?: boolean;
}

/**
 * The cost of one run, line by line: Chat & Reasoning, Tool Calls, Compute
 * and the Orchestration Fee for an agent turn, or steps by kind for a
 * workflow run, plus the models that served it. Work on the workspace's own
 * API key is shown struck through and marked Free.
 */
const RunCostDetails: FC<IRunCostDetailsProps> = ({ cost, className, showSteps = false }) => {
	const lines = cost.lines.filter((line) => line.credits > 0 || line.waived);

	return (
		<div className={classNames('flex flex-col gap-3 text-sm', className)}>
			<div className='flex items-baseline justify-between'>
				<span className='font-semibold'>
					{cost.in_progress ? 'Cost so far' : 'Total cost'}
				</span>
				<span className='text-lg font-semibold tabular-nums'>
					{cost.credits.toLocaleString()} credits
				</span>
			</div>

			<ul className='flex flex-col gap-1.5' aria-label='Cost breakdown'>
				{lines.length === 0 && <li className='text-zinc-500'>Nothing charged yet.</li>}
				{lines.map((line) => (
					<li key={line.key} className='flex items-baseline justify-between gap-3'>
						<span className={classNames({ 'text-zinc-500': line.waived })}>
							{line.label}
						</span>
						{line.waived ? (
							<span className='tabular-nums'>
								<s className='text-zinc-500'>
									{(line.would_have_cost ?? 0).toLocaleString()}
								</s>{' '}
								<span className='font-medium text-emerald-600 dark:text-emerald-400'>
									Free
								</span>
							</span>
						) : (
							<span className='tabular-nums'>{line.credits.toLocaleString()}</span>
						)}
					</li>
				))}
			</ul>

			{showSteps && cost.steps.length > 0 && (
				<div>
					<div className='mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase'>
						Steps
					</div>
					<ul className='flex flex-col gap-1'>
						{cost.steps.map((step) => (
							<li
								key={step.node_run_id}
								className='flex items-baseline justify-between gap-3'>
								<span className='truncate'>
									{step.key}{' '}
									<span className='text-xs text-zinc-500'>{step.type}</span>
								</span>
								<span className='tabular-nums'>
									{step.credits.toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{cost.models.length > 0 && (
				<div>
					<div className='mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase'>
						Models
					</div>
					<ul className='flex flex-col gap-1'>
						{cost.models.map((model) => (
							<li
								key={`${model.provider}:${model.model}`}
								className='flex items-baseline justify-between gap-3'>
								<span className='truncate'>
									{model.model}
									{model.own_key && (
										<span className='ms-1 text-xs text-emerald-600'>
											your key
										</span>
									)}
								</span>
								<span className='text-xs text-zinc-500 tabular-nums'>
									{model.calls} call{model.calls === 1 ? '' : 's'} ·{' '}
									{(model.input_tokens + model.output_tokens).toLocaleString()}{' '}
									tokens
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{cost.charged_credits < cost.credits && !cost.in_progress && (
				<p className='text-xs text-zinc-500'>
					{(cost.credits - cost.charged_credits).toLocaleString()} credits are still being
					recorded.
				</p>
			)}
		</div>
	);
};

export default RunCostDetails;
