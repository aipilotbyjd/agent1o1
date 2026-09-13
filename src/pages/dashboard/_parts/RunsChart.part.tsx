import { FC, useMemo } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/utils/Chart';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatDuration, formatNumber, formatRatio } from '@/utils/format.util';
import type { TRunSeriesPoint, TRunTotals } from '@/types/dashboard.type';

// ============================================================
// Runs Chart
// ------------------------------------------------------------
// Execution health over the window. The series is bucketed by
// `created_at` and zero-filled server-side, so every day in the
// window is present and a quiet Sunday renders as a dip rather
// than silently closing the gap between Saturday and Monday.
//
// Only completed and failed are plotted. Adding a "total" series
// would draw the sum of the other two as a third line and make
// the chart read as three independent measures.
// ============================================================

interface IRunsChartProps {
	series?: TRunSeriesPoint[];
	totals?: TRunTotals;
	isLoading?: boolean;
}

const RunsChartPart: FC<IRunsChartProps> = ({ series, totals, isLoading = false }) => {
	const chart = useMemo(
		() => ({
			series: [
				{ name: 'Completed', data: (series ?? []).map((point) => point.completed) },
				{ name: 'Failed', data: (series ?? []).map((point) => point.failed) },
			],
			categories: (series ?? []).map((point) => point.date),
		}),
		[series],
	);

	const hasActivity = (totals?.total ?? 0) > 0;

	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Runs</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					{!isLoading && totals && (
						<div className='flex flex-wrap items-center gap-4 text-sm'>
							<span>
								<span className='text-zinc-500'>Total </span>
								<span className='font-semibold'>{formatNumber(totals.total)}</span>
							</span>
							<span>
								<span className='text-zinc-500'>Success </span>
								<span className='font-semibold'>
									{formatRatio(totals.success_rate)}
								</span>
							</span>
							<span>
								<span className='text-zinc-500'>Avg </span>
								<span className='font-semibold'>
									{formatDuration(totals.avg_duration_ms)}
								</span>
							</span>
						</div>
					)}
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				{isLoading && <Skeleton className='h-72 w-full' />}

				{!isLoading && !hasActivity && (
					<EmptyState
						icon='ChartLineData01'
						title='No runs in this window'
						description='Trigger a workflow or widen the window to see execution history here.'
					/>
				)}

				{!isLoading && hasActivity && (
					<Chart
						type='area'
						height={300}
						series={chart.series}
						options={{
							chart: { type: 'area', stacked: true, toolbar: { show: false } },
							colors: ['#00bc7d', '#ff2056'],
							stroke: { curve: 'smooth', width: 2 },
							fill: {
								type: 'gradient',
								gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
							},
							legend: { position: 'top', horizontalAlign: 'right' },
							xaxis: {
								type: 'datetime',
								categories: chart.categories,
								tooltip: { enabled: false },
							},
							yaxis: { labels: { formatter: (value: number) => String(Math.round(value)) } },
							tooltip: { x: { format: 'dd MMM yyyy' } },
						}}
					/>
				)}
			</CardBody>
		</Card>
	);
};

export default RunsChartPart;
