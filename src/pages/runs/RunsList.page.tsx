import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useRuns } from '@/api/modules/runs';
import { useWorkflows } from '@/api/modules/workflows';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Select from '@/components/form/Select';
import Button from '@/components/ui/Button';
import DataTable, { TColumn } from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import RunStatusBadge from '@/components/common/RunStatusBadge';
import { formatDuration, formatNumber, formatRelative, humanize } from '@/utils/format.util';
import type { TRun, TRunStatus } from '@/types/run.type';

// ============================================================
// Runs List
// ------------------------------------------------------------
// The full execution history — the "view all" behind the
// dashboard's five recent runs.
//
// The status filter lives in the URL rather than component state
// so the dashboard's in-flight chips can deep-link straight into a
// filtered view (`/runs?status=awaiting_approval`), and so a
// filtered list survives a reload and can be shared.
//
// Runs carry a `workflow_id` but no workflow name, so the names
// come from one extra `GET /workflows` and are mapped in. That is
// one request for the whole page rather than one per row.
// ============================================================

const STATUS_OPTIONS: TRunStatus[] = [
	'pending',
	'running',
	'awaiting_approval',
	'awaiting_callback',
	'completed',
	'failed',
	'cancelled',
];

const PER_PAGE = 25;

const RunsListPage = () => {
	useDocumentTitle({ name: 'Runs' });

	const ws = useWorkspaceId();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [page, setPage] = useState(1);

	const status = (searchParams.get('status') as TRunStatus | null) ?? undefined;
	const workflowId = searchParams.get('workflow_id') ?? undefined;

	const { data, isLoading, isFetching, refetch } = useRuns(ws, {
		status,
		workflow_id: workflowId,
		page,
		per_page: PER_PAGE,
	});

	const { data: workflows } = useWorkflows(ws);
	const workflowNames = useMemo(
		() => new Map((workflows ?? []).map((workflow) => [workflow.id, workflow.name])),
		[workflows],
	);

	// Changing a filter always returns to page 1 — staying on page 6 of a
	// list that now has two pages shows an empty table, not a filtered one.
	const setFilter = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams);
		if (value) next.set(key, value);
		else next.delete(key);
		setSearchParams(next, { replace: true });
		setPage(1);
	};

	const columns: TColumn<TRun>[] = [
		{
			key: 'status',
			header: 'Status',
			cell: (run) => <RunStatusBadge status={run.status} />,
		},
		{
			key: 'workflow',
			header: 'Workflow',
			cell: (run) => (
				<span className='font-medium'>
					{run.workflow_id
						? (workflowNames.get(run.workflow_id) ?? `Workflow #${run.workflow_id}`)
						: humanize(run.runnable_type?.split('\\').pop() ?? null)}
				</span>
			),
		},
		{
			key: 'trigger',
			header: 'Trigger',
			className: 'text-zinc-500',
			cell: (run) => humanize(run.trigger_type),
		},
		{
			key: 'started',
			header: 'Started',
			className: 'text-zinc-500',
			cell: (run) => formatRelative(run.started_at ?? run.created_at),
		},
		{
			key: 'duration',
			header: 'Duration',
			cell: (run) => formatDuration(run.duration_ms),
		},
		{
			key: 'credits',
			header: 'Credits',
			className: 'text-right',
			cell: (run) => formatNumber(run.total_credits_used),
		},
	];

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-lg font-semibold'>Runs</span>
					{data?.meta && (
						<span className='text-zinc-500'>{formatNumber(data.meta.total)}</span>
					)}
				</SubheaderLeft>
				<SubheaderRight>
					{/* Select renders `w-full`, so the width is set on a wrapper —
					    otherwise each filter takes the whole row and the
					    subheader wraps into a stack. */}
					<div className='w-44'>
						<Select
							name='status'
							value={status ?? ''}
							placeholder='All statuses'
							onChange={(event) => setFilter('status', event.target.value)}>
							<option value=''>All statuses</option>
							{STATUS_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{humanize(option)}
								</option>
							))}
						</Select>
					</div>
					<div className='w-52'>
						<Select
							name='workflow_id'
							value={workflowId ?? ''}
							placeholder='All workflows'
							onChange={(event) => setFilter('workflow_id', event.target.value)}>
							<option value=''>All workflows</option>
							{(workflows ?? []).map((workflow) => (
								<option key={workflow.id} value={workflow.id}>
									{workflow.name}
								</option>
							))}
						</Select>
					</div>
					<Button
						variant='outline'
						color='zinc'
						icon='Refresh'
						isLoading={isFetching && !isLoading}
						onClick={() => void refetch()}
						aria-label='Refresh runs'
					/>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card>
					<CardBody>
						<DataTable
							columns={columns}
							rows={data?.runs}
							rowKey={(run) => run.id}
							isLoading={isLoading}
							onRowClick={(run) => navigate(`/runs/${run.id}`)}
							meta={data?.meta}
							onPageChange={setPage}
							empty={
								<EmptyState
									icon='Activity03'
									title={status ? 'No runs match this filter' : 'No runs yet'}
									description={
										status
											? 'Try clearing the status filter to see the full history.'
											: 'Trigger a workflow or wait for a trigger to fire, and runs will appear here.'
									}
									action={
										status ? (
											<Button
												variant='outline'
												color='zinc'
												onClick={() => setFilter('status', '')}>
												Clear filter
											</Button>
										) : undefined
									}
								/>
							}
						/>
					</CardBody>
				</Card>
			</Container>
		</>
	);
};

export default RunsListPage;
