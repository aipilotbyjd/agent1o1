import { Bot, Cpu, GitBranch } from 'lucide-react';
import { useUsageInsights } from '@/api/modules/billing';

const listCard =
	'rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950';

/**
 * Where the last 30 days of credits went: the workflows and agents that used
 * the most, and the models that served them (with how many calls ran on the
 * workspace's own API key, which cost no model credits).
 */
const UsageInsights = ({ workspaceId }: { workspaceId: string }) => {
	const { data, isLoading } = useUsageInsights(workspaceId, 30);

	if (isLoading || !data) return null;

	const sections = [
		{
			title: 'Top workflows',
			icon: GitBranch,
			empty: 'No workflow runs in the last 30 days.',
			rows: data.top_workflows.map((row) => ({
				id: row.id,
				name: row.name,
				detail: `${row.runs.toLocaleString()} run${row.runs === 1 ? '' : 's'}`,
				value: `${row.credits.toLocaleString()} credits`,
			})),
		},
		{
			title: 'Top agents',
			icon: Bot,
			empty: 'No agent chats in the last 30 days.',
			rows: data.top_agents.map((row) => ({
				id: row.id,
				name: row.name,
				detail: `${row.turns.toLocaleString()} chat turn${row.turns === 1 ? '' : 's'}`,
				value: `${row.credits.toLocaleString()} credits`,
			})),
		},
		{
			title: 'Models',
			icon: Cpu,
			empty: 'No AI calls in the last 30 days.',
			rows: data.models.map((row) => ({
				id: row.model,
				name: row.model,
				detail:
					row.own_key_calls > 0
						? `${row.own_key_calls.toLocaleString()} on your key`
						: `${(row.input_tokens + row.output_tokens).toLocaleString()} tokens`,
				value: `${row.calls.toLocaleString()} call${row.calls === 1 ? '' : 's'}`,
			})),
		},
	];

	return (
		<section>
			<h3 className='mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
				Where Credits Went
			</h3>
			<div className='grid gap-4 lg:grid-cols-3'>
				{sections.map((section) => (
					<div key={section.title} className={listCard}>
						<div className='mb-3 flex items-center gap-2 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
							<section.icon size={13} />
							{section.title}
						</div>
						{section.rows.length === 0 ? (
							<p className='text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
								{section.empty}
							</p>
						) : (
							<ul className='space-y-2.5'>
								{section.rows.map((row) => (
									<li
										key={row.id}
										className='flex items-start justify-between gap-3'>
										<div className='min-w-0'>
											<div className='truncate text-sm font-bold text-zinc-900 dark:text-zinc-100'>
												{row.name}
											</div>
											<div className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
												{row.detail}
											</div>
										</div>
										<span className='shrink-0 text-xs font-bold text-zinc-700 tabular-nums dark:text-zinc-300'>
											{row.value}
										</span>
									</li>
								))}
							</ul>
						)}
					</div>
				))}
			</div>
			<p className='mt-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
				A cheaper model, a fresh chat for a new topic, or your own API key all lower what
				each message costs.
			</p>
		</section>
	);
};

export default UsageInsights;
