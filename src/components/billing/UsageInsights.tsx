import { FC } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Chart from '@/components/utils/Chart';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import { useUsageInsights } from '@/api/modules/billing';

/** What each kind of charge is called on screen. */
const KIND_LABELS: Record<string, string> = {
	node_run: 'Workflow steps',
	agent_step: 'Agent chats',
	eval_case: 'Agent evaluations',
	session_evaluation: 'Chat reviews',
	reflection: 'Self-improvement',
	agent_draft: 'Agent drafts',
	skill_draft: 'Skill drafts',
	model_trial: 'Model trials',
	workflow_builder: 'Workflow builder',
};

interface IUsageInsightsProps {
	workspaceId: string;
	days?: number;
}

/**
 * Where the workspace's credits went: by day, by kind of work, by workflow
 * and agent, and by model.
 */
const UsageInsights: FC<IUsageInsightsProps> = ({ workspaceId, days = 30 }) => {
	const { data, isLoading, isError } = useUsageInsights(workspaceId, days);

	if (isLoading) {
		return <Skeleton className='h-96' />;
	}

	if (isError || !data) {
		return (
			<Alert color='red' variant='soft' icon='Alert02'>
				Usage could not be loaded. Try again in a moment.
			</Alert>
		);
	}

	return (
		<div className='grid grid-cols-12 gap-4'>
			<Card className='col-span-12'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Credits used</CardTitle>
					</CardHeaderChild>
					<CardHeaderChild>
						<span className='text-2xl font-semibold tabular-nums'>
							{data.total_credits.toLocaleString()}
						</span>
						<span className='text-zinc-500'>in {data.days} days</span>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<Chart
						type='area'
						height={260}
						series={[{ name: 'Credits', data: data.daily.map((day) => day.credits) }]}
						options={{
							xaxis: { categories: data.daily.map((day) => day.date.slice(5)) },
							stroke: { curve: 'smooth', width: 2 },
							fill: {
								type: 'gradient',
								gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
							},
							tooltip: {
								y: {
									formatter: (value: number) =>
										`${value.toLocaleString()} credits`,
								},
							},
						}}
					/>
				</CardBody>
			</Card>

			<Card className='col-span-12 lg:col-span-4'>
				<CardHeader>
					<CardTitle>By kind of work</CardTitle>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table>
						<THead>
							<Tr>
								<Th>Work</Th>
								<Th className='text-end'>Credits</Th>
							</Tr>
						</THead>
						<TBody>
							{data.by_kind.map((row) => (
								<Tr key={row.kind}>
									<Td>
										{KIND_LABELS[row.kind] ?? row.kind.split('_').join(' ')}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.credits.toLocaleString()}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
				</CardBody>
			</Card>

			<Card className='col-span-12 lg:col-span-4'>
				<CardHeader>
					<CardTitle>Top workflows</CardTitle>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table>
						<THead>
							<Tr>
								<Th>Workflow</Th>
								<Th className='text-end'>Runs</Th>
								<Th className='text-end'>Credits</Th>
							</Tr>
						</THead>
						<TBody>
							{data.top_workflows.length === 0 && (
								<Tr>
									<Td colSpan={3} className='text-zinc-500'>
										No workflow runs yet.
									</Td>
								</Tr>
							)}
							{data.top_workflows.map((row) => (
								<Tr key={row.id}>
									<Td className='max-w-48 truncate'>{row.name}</Td>
									<Td className='text-end tabular-nums'>
										{row.runs.toLocaleString()}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.credits.toLocaleString()}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
				</CardBody>
			</Card>

			<Card className='col-span-12 lg:col-span-4'>
				<CardHeader>
					<CardTitle>Top agents</CardTitle>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table>
						<THead>
							<Tr>
								<Th>Agent</Th>
								<Th className='text-end'>Chats</Th>
								<Th className='text-end'>Credits</Th>
							</Tr>
						</THead>
						<TBody>
							{data.top_agents.length === 0 && (
								<Tr>
									<Td colSpan={3} className='text-zinc-500'>
										No agent chats yet.
									</Td>
								</Tr>
							)}
							{data.top_agents.map((row) => (
								<Tr key={row.id}>
									<Td className='max-w-48 truncate'>{row.name}</Td>
									<Td className='text-end tabular-nums'>
										{row.turns.toLocaleString()}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.credits.toLocaleString()}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
				</CardBody>
			</Card>

			<Card className='col-span-12'>
				<CardHeader>
					<CardTitle>Models</CardTitle>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table>
						<THead>
							<Tr>
								<Th>Model</Th>
								<Th className='text-end'>Calls</Th>
								<Th className='text-end'>On your key</Th>
								<Th className='text-end'>Tokens in</Th>
								<Th className='text-end'>Tokens out</Th>
							</Tr>
						</THead>
						<TBody>
							{data.models.length === 0 && (
								<Tr>
									<Td colSpan={5} className='text-zinc-500'>
										No AI calls yet.
									</Td>
								</Tr>
							)}
							{data.models.map((row) => (
								<Tr key={row.model}>
									<Td>{row.model}</Td>
									<Td className='text-end tabular-nums'>
										{row.calls.toLocaleString()}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.own_key_calls.toLocaleString()}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.input_tokens.toLocaleString()}
									</Td>
									<Td className='text-end tabular-nums'>
										{row.output_tokens.toLocaleString()}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
					<p className='mt-3 text-sm text-zinc-500'>
						Tip: a cheaper model, a fresh chat for a new topic, or your own API key all
						lower what each message costs.
					</p>
				</CardBody>
			</Card>
		</div>
	);
};

export default UsageInsights;
