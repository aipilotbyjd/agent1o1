import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useRun, useNodeRun, useCancelRun, useRetryRun } from '@/api/modules/runs';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';
import RunStatusBadge from '@/components/common/RunStatusBadge';
import JsonViewer from '@/components/common/JsonViewer';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime, formatDuration, formatNumber, humanize } from '@/utils/format.util';
import NodeRunTimelinePart from './_parts/NodeRunTimeline.part';
import RunApprovalCardPart from './_parts/RunApprovalCard.part';
import type { TRunStatus } from '@/types/run.type';

// ============================================================
// Run Detail
// ------------------------------------------------------------
// One execution, step by step. The run endpoint already returns
// its node runs, so the timeline draws with no extra request;
// opening a step fetches that node's full payload (`input`,
// `usage`, `state`), which the list deliberately omits because it
// would be megabytes across a long run.
//
// While a run is still going the page polls, because runs finish
// on a queue worker with nothing pushing to the client yet —
// polling stops the moment the run reaches a terminal status, so
// a finished run costs nothing to leave open.
// ============================================================

const IN_FLIGHT: TRunStatus[] = ['pending', 'running', 'awaiting_approval', 'awaiting_callback'];

/** Matches the dashboard's own refresh cadence. */
const POLL_MS = 5_000;

const RunDetailPage = () => {
	const { runId = '' } = useParams();
	const ws = useWorkspaceId();
	const navigate = useNavigate();

	useDocumentTitle({ name: `Run #${runId}` });

	const { data: run, isLoading, refetch, isFetching } = useRun(ws, runId);
	const cancelRun = useCancelRun(ws);
	const retryRun = useRetryRun(ws);

	const [selectedNodeRunId, setSelectedNodeRunId] = useState<string | null>(null);
	const { data: nodeRun, isLoading: isNodeLoading } = useNodeRun(
		ws,
		runId,
		selectedNodeRunId ?? '',
	);

	const isInFlight = !!run && IN_FLIGHT.includes(run.status);

	// `useRun` has no refetchInterval of its own — a run list left open
	// would otherwise poll every row's detail. Drive it from here instead,
	// and only while this run can still change.
	useEffect(() => {
		if (!isInFlight) return undefined;
		const timer = setInterval(() => void refetch(), POLL_MS);
		return () => clearInterval(timer);
	}, [isInFlight, refetch]);

	// Default to the first failed step, since that is what a reader opening
	// a failed run is looking for; otherwise the first step.
	useEffect(() => {
		if (selectedNodeRunId || !run?.node_runs?.length) return;
		const failed = run.node_runs.find((item) => item.status === 'failed');
		setSelectedNodeRunId((failed ?? run.node_runs[0]).id);
	}, [run, selectedNodeRunId]);

	if (!isLoading && !run) {
		return (
			<Container>
				<Card className='mt-8'>
					<CardBody>
						<EmptyState
							icon='Activity03'
							title='Run not found'
							description='It may belong to another workspace, or have been deleted.'
							action={
								<Button variant='solid' onClick={() => navigate('/runs')}>
									Back to runs
								</Button>
							}
						/>
					</CardBody>
				</Card>
			</Container>
		);
	}

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='link'
						color='zinc'
						icon='ArrowLeft01'
						onClick={() => navigate('/runs')}>
						Runs
					</Button>
					<span className='text-lg font-semibold'>Run #{runId}</span>
					{run && <RunStatusBadge status={run.status} />}
				</SubheaderLeft>
				<SubheaderRight>
					{run && isInFlight && (
						<Button
							variant='outline'
							color='red'
							isLoading={cancelRun.isPending}
							onClick={() => cancelRun.mutate(runId)}>
							Cancel
						</Button>
					)}
					{run && !isInFlight && (
						<Button
							variant='outline'
							color='zinc'
							icon='Refresh'
							isLoading={retryRun.isPending}
							onClick={() =>
								retryRun.mutate(runId, {
									// The retry is a new run — follow it, or the
									// user is left staring at the old one.
									onSuccess: (created) => navigate(`/runs/${created.id}`),
								})
							}>
							Retry
						</Button>
					)}
					<Button
						variant='outline'
						color='zinc'
						icon='Refresh'
						isLoading={isFetching && !isLoading}
						onClick={() => void refetch()}
						aria-label='Refresh run'
					/>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='grid grid-cols-12 gap-4'>
					{run?.status === 'awaiting_approval' && (
						<div className='col-span-12'>
							<RunApprovalCardPart ws={ws} runId={runId} />
						</div>
					)}

					{run?.error && (
						<div className='col-span-12'>
							<Alert color='red' variant='soft'>
								{run.error}
							</Alert>
						</div>
					)}

					{/* ─── Summary ─────────────────────────────────── */}
					<div className='col-span-12'>
						<Card>
							<CardBody className='grid grid-cols-2 gap-4 md:grid-cols-5'>
								{[
									{ label: 'Trigger', value: humanize(run?.trigger_type) },
									{ label: 'Duration', value: formatDuration(run?.duration_ms) },
									{
										label: 'Credits',
										value: formatNumber(run?.total_credits_used),
									},
									{ label: 'Started', value: formatDateTime(run?.started_at) },
									{ label: 'Finished', value: formatDateTime(run?.finished_at) },
								].map((item) => (
									<div key={item.label}>
										<div className='text-sm text-zinc-500'>{item.label}</div>
										{isLoading ? (
											<Skeleton className='mt-1 h-6 w-20' />
										) : (
											<div className='font-medium'>{item.value}</div>
										)}
									</div>
								))}
							</CardBody>
						</Card>
					</div>

					{/* ─── Steps ───────────────────────────────────── */}
					<div className='col-span-12 xl:col-span-5'>
						<Card className='h-full'>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Steps</CardTitle>
								</CardHeaderChild>
								<CardHeaderChild>
									<span className='text-sm text-zinc-500'>
										{run?.node_runs?.length ?? 0} nodes
									</span>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								{isLoading ? (
									<div className='flex flex-col gap-2'>
										<Skeleton className='h-14 w-full' />
										<Skeleton className='h-14 w-full' />
										<Skeleton className='h-14 w-full' />
									</div>
								) : (
									<NodeRunTimelinePart
										nodeRuns={run?.node_runs}
										selectedId={selectedNodeRunId}
										onSelect={(item) => setSelectedNodeRunId(item.id)}
									/>
								)}
							</CardBody>
						</Card>
					</div>

					{/* ─── Selected step ───────────────────────────── */}
					<div className='col-span-12 xl:col-span-7'>
						<Card className='h-full'>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>{nodeRun?.key ?? 'Step detail'}</CardTitle>
								</CardHeaderChild>
								<CardHeaderChild>
									{nodeRun && <RunStatusBadge status={nodeRun.status} />}
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='flex flex-col gap-4'>
								{!selectedNodeRunId && (
									<EmptyState
										icon='Cursor01'
										title='Select a step'
										description='Pick a node on the left to inspect its input and output.'
									/>
								)}

								{selectedNodeRunId && isNodeLoading && (
									<Skeleton className='h-64 w-full' />
								)}

								{nodeRun && !isNodeLoading && (
									<>
										{nodeRun.error && (
											<Alert color='red' variant='soft'>
												{nodeRun.error}
											</Alert>
										)}

										<div className='flex flex-wrap gap-4 text-sm text-zinc-500'>
											<span>{nodeRun.type}</span>
											<span>
												Attempt {nodeRun.attempt} / {nodeRun.max_attempts}
											</span>
											<span>{formatDuration(nodeRun.duration_ms)}</span>
											{/* Null credits means "not recorded", not zero —
											    the chip is dropped rather than rendered as
											    an em dash next to the word "credits". */}
											{nodeRun.credits_used !== null && (
												<span>
													{formatNumber(nodeRun.credits_used)} credits
												</span>
											)}
										</div>

										<div>
											<div className='mb-1 text-sm font-semibold'>Input</div>
											<JsonViewer value={nodeRun.input} emptyLabel='No input' />
										</div>
										<div>
											<div className='mb-1 text-sm font-semibold'>Output</div>
											<JsonViewer
												value={nodeRun.output}
												emptyLabel='No output yet'
											/>
										</div>
										{!!nodeRun.usage && (
											<div>
												<div className='mb-1 text-sm font-semibold'>
													Usage
												</div>
												<JsonViewer value={nodeRun.usage} />
											</div>
										)}
									</>
								)}
							</CardBody>
						</Card>
					</div>

					{/* ─── Run payloads ────────────────────────────── */}
					<div className='col-span-12 xl:col-span-6'>
						<Card className='h-full'>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Run input</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<JsonViewer value={run?.input} emptyLabel='No input' />
							</CardBody>
						</Card>
					</div>
					<div className='col-span-12 xl:col-span-6'>
						<Card className='h-full'>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Run output</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<JsonViewer value={run?.output} emptyLabel='No output yet' />
							</CardBody>
						</Card>
					</div>
				</div>
			</Container>
		</>
	);
};

export default RunDetailPage;
