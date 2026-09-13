import { FC, useMemo } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/utils/Chart';
import Progress from '@/components/ui/Progress';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatNumber, humanize } from '@/utils/format.util';
import type { TCreditUsage, TDashboardCredits } from '@/types/dashboard.type';

// ============================================================
// Credit Usage Card
// ------------------------------------------------------------
// Balance and burn side by side, and they measure different things
// on purpose: `available`/`used_this_period` come from the billing
// period the plan is enforced against, while the donut reads the
// ledger over the dashboard's own window. The two only agree when
// the window happens to be the current billing month, which is why
// each number is labelled with where it came from.
//
// Renders nothing at all when `credits` is null — that is a viewer
// without `BillingView`, not an error state to apologise for.
// ============================================================

interface ICreditUsageCardProps {
	credits?: TDashboardCredits | null;
	usage?: TCreditUsage;
	windowDays: number;
	isLoading?: boolean;
}

const CreditUsageCardPart: FC<ICreditUsageCardProps> = ({
	credits,
	usage,
	windowDays,
	isLoading = false,
}) => {
	const breakdown = useMemo(() => {
		const entries = Object.entries(usage?.by_source_type ?? {}).filter(
			([, value]) => value > 0,
		);
		return {
			labels: entries.map(([key]) => humanize(key)),
			series: entries.map(([, value]) => value),
		};
	}, [usage]);

	if (!isLoading && !credits) return null;

	// `limit_this_period` is null on an unmetered plan — a bar with no
	// ceiling would be a made-up number, so it is dropped instead.
	const limit = credits?.limit_this_period ?? null;
	const usedPercent =
		limit && limit > 0 ? Math.min(100, Math.round((credits!.used_this_period / limit) * 100)) : null;

	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Credits</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='flex flex-col gap-5'>
				{isLoading && <Skeleton className='h-64 w-full' />}

				{!isLoading && credits && (
					<>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<div className='text-sm text-zinc-500'>Available</div>
								<div className='text-2xl font-semibold'>
									{formatNumber(credits.available)}
								</div>
							</div>
							<div>
								<div className='text-sm text-zinc-500'>Last {windowDays} days</div>
								<div className='text-2xl font-semibold'>
									{formatNumber(credits.window_credits)}
								</div>
							</div>
						</div>

						{usedPercent !== null && (
							<div>
								<div className='mb-1 flex justify-between text-xs text-zinc-500'>
									<span>Used this billing period</span>
									<span>
										{formatNumber(credits.used_this_period)} / {formatNumber(limit)}
									</span>
								</div>
								<Progress value={usedPercent} color={usedPercent >= 90 ? 'red' : 'primary'} />
							</div>
						)}

						{breakdown.series.length > 0 ? (
							<Chart
								type='donut'
								height={220}
								series={breakdown.series}
								options={{
									chart: { type: 'donut' },
									labels: breakdown.labels,
									legend: { position: 'bottom' },
									dataLabels: { enabled: false },
									plotOptions: {
										pie: { donut: { size: '70%' } },
									},
								}}
							/>
						) : (
							<EmptyState
								icon='Coins01'
								title='No spend in this window'
								description='Credit charges appear here once workflows or agents run.'
							/>
						)}
					</>
				)}
			</CardBody>
		</Card>
	);
};

export default CreditUsageCardPart;
