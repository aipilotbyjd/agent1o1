import { useState } from 'react';
import { Link } from 'react-router';
import {
	useDashboardOverview,
	useRunStats,
	useCreditUsage,
	usePendingApprovals,
} from '@/api/modules/dashboard';
import { useCurrentWorkspace } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatTile from '@/components/common/StatTile';
import EmptyState from '@/components/common/EmptyState';
import { formatDuration, formatNumber, formatRatio } from '@/utils/format.util';
import WindowSelectorPart from './_parts/WindowSelector.part';
import InFlightStripPart from './_parts/InFlightStrip.part';
import RunsChartPart from './_parts/RunsChart.part';
import CreditUsageCardPart from './_parts/CreditUsageCard.part';
import PendingApprovalsPart from './_parts/PendingApprovals.part';
import RecentRunsPart from './_parts/RecentRuns.part';

// ============================================================
// Dashboard
// ------------------------------------------------------------
// The home screen. `GET /dashboard` is deliberately one request
// covering tiles, in-flight, credits, counts and recent runs —
// fanning that out to six endpoints would render six waterfalls
// and six spinners. The two drill-downs are extra only because
// they carry per-day series the overview doesn't.
//
// `credit-usage` is gated on the overview having returned a
// `credits` block: that block degrading to null is how the API
// says "this viewer has no BillingView", and calling the
// drill-down anyway would 403 and toast on every page load.
// ============================================================

/** How many approvals the card shows before "view all" is the answer. */
const APPROVALS_PER_PAGE = 5;

const DashboardPage = () => {
	useDocumentTitle({ name: 'Dashboard' });

	const { workspaceId, workspace, hasWorkspace, isLoading: isWorkspaceLoading } =
		useCurrentWorkspace();
	const [days, setDays] = useState(30);

	const overview = useDashboardOverview(workspaceId, { days });
	const runStats = useRunStats(workspaceId, { days });
	const approvals = usePendingApprovals(workspaceId, { per_page: APPROVALS_PER_PAGE });

	const canViewBilling = !!overview.data?.credits;
	const creditUsage = useCreditUsage(workspaceId, { days }, { enabled: canViewBilling });

	// The overview carries every number the tiles need, so they stop
	// showing skeletons as soon as it lands — independently of the
	// slower series queries feeding the charts.
	const isOverviewLoading = overview.isLoading || isWorkspaceLoading;
	const totals = overview.data?.runs;
	const counts = overview.data?.counts;

	if (!isWorkspaceLoading && !hasWorkspace) {
		return (
			<Container>
				<Card className='mt-8'>
					<CardBody>
						<EmptyState
							icon='Rocket01'
							title='No workspace yet'
							description='Finish setting up to get a workspace, then your runs, agents and credits land here.'
							action={
								<Link to='/onboarding'>
									<Button variant='solid'>Continue setup</Button>
								</Link>
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
					<span className='text-lg font-semibold'>Dashboard</span>
					{workspace && <span className='text-zinc-500'>{workspace.name}</span>}
				</SubheaderLeft>
				<SubheaderRight>
					<WindowSelectorPart value={days} onChange={setDays} />
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='grid grid-cols-12 gap-4'>
					{/* ─── Headline tiles ─────────────────────────── */}
					<div className='col-span-12 sm:col-span-6 xl:col-span-3'>
						<StatTile
							label={`Runs · last ${days}d`}
							value={formatNumber(totals?.total ?? 0)}
							icon='Activity03'
							color='blue'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-12 sm:col-span-6 xl:col-span-3'>
						<StatTile
							label='Success rate'
							value={formatRatio(totals?.success_rate)}
							hint={`${formatNumber(totals?.completed ?? 0)} completed`}
							icon='CheckmarkCircle02'
							color='emerald'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-12 sm:col-span-6 xl:col-span-3'>
						<StatTile
							label='Failed'
							value={formatNumber(totals?.failed ?? 0)}
							hint={`Avg run ${formatDuration(totals?.avg_duration_ms)}`}
							icon='AlertCircle'
							color='red'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-12 sm:col-span-6 xl:col-span-3'>
						<StatTile
							label={canViewBilling ? 'Credits available' : 'Pending approvals'}
							value={formatNumber(
								canViewBilling
									? overview.data?.credits?.available
									: overview.data?.pending_approvals,
							)}
							hint={
								canViewBilling
									? `${formatNumber(overview.data?.credits?.window_credits)} used in window`
									: undefined
							}
							icon={canViewBilling ? 'Coins01' : 'UserCheck01'}
							color={canViewBilling ? 'violet' : 'amber'}
							isLoading={isOverviewLoading}
						/>
					</div>

					{/* ─── Live work ──────────────────────────────── */}
					<div className='col-span-12'>
						<InFlightStripPart
							counts={overview.data?.in_flight}
							isLoading={isOverviewLoading}
						/>
					</div>

					{/* ─── Charts ─────────────────────────────────── */}
					<div className={canViewBilling ? 'col-span-12 xl:col-span-8' : 'col-span-12'}>
						<RunsChartPart
							series={runStats.data?.series}
							totals={runStats.data?.totals ?? totals}
							isLoading={runStats.isLoading}
						/>
					</div>
					{canViewBilling && (
						<div className='col-span-12 xl:col-span-4'>
							<CreditUsageCardPart
								credits={overview.data?.credits}
								usage={creditUsage.data}
								windowDays={days}
								isLoading={creditUsage.isLoading}
							/>
						</div>
					)}

					{/* ─── Queues ─────────────────────────────────── */}
					<div className='col-span-12 xl:col-span-5'>
						<PendingApprovalsPart
							ws={workspaceId}
							approvals={approvals.data?.approvals}
							isLoading={approvals.isLoading}
						/>
					</div>
					<div className='col-span-12 xl:col-span-7'>
						<RecentRunsPart
							runs={overview.data?.recent_runs}
							isLoading={isOverviewLoading}
						/>
					</div>

					{/* ─── Workspace counts ───────────────────────── */}
					<div className='col-span-6 xl:col-span-3'>
						<StatTile
							label='Workflows'
							value={formatNumber(counts?.workflows ?? 0)}
							icon='WorkflowSquare10'
							color='sky'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-6 xl:col-span-3'>
						<StatTile
							label='Agents'
							value={formatNumber(counts?.agents ?? 0)}
							icon='Bot'
							color='violet'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-6 xl:col-span-3'>
						<StatTile
							label='Active triggers'
							value={formatNumber(counts?.active_triggers ?? 0)}
							icon='Rocket01'
							color='amber'
							isLoading={isOverviewLoading}
						/>
					</div>
					<div className='col-span-6 xl:col-span-3'>
						<StatTile
							label='Members'
							value={formatNumber(counts?.members ?? 0)}
							icon='UserMultiple'
							color='emerald'
							isLoading={isOverviewLoading}
						/>
					</div>
				</div>
			</Container>
		</>
	);
};

export default DashboardPage;
