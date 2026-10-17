import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';
import {
	ArrowUpRight,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Download,
	ExternalLink,
	FlaskConical,
	Hourglass,
	Loader2,
	OctagonAlert,
	PencilRuler,
	Trophy,
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import Chart from '@/components/utils/Chart';
import { humanize } from '@/components/workflowPage/PageBlocks';
import {
	WorkflowPageService,
	useWorkflowPage,
	useWorkflowPageInsights,
	useWorkflowPageSubmissionsPage,
	useWorkflowPageVariant,
} from '@/api/modules/workflow-pages';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirm';
import useDarkMode from '@/hooks/useDarkMode';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import relativeTime from '@/utils/relativeTime.util';
import type {
	TPageInsightCounts,
	TPageInsights,
	TPageSubmissionFilters,
	TPageSubmissionRecord,
	TPageSubmissionStatus,
	TPageVariant,
} from '@/types/workflow-page.type';
import type { OutletContextType } from '../_layouts/WorkflowPages.layout';

// Validated categorical slots 1–2 (see the dataviz palette): series and
// versions keep the same colour wherever they appear.
const SERIES = {
	light: { first: '#2a78d6', second: '#eb6834' },
	dark: { first: '#3987e5', second: '#d95926' },
};

const RANGES = [7, 30, 90] as const;

const percent = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate * 1000) / 10}%`);

const duration = (seconds: number | null) => {
	if (seconds === null) return '-';
	if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
	return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
};

const card =
	'rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60';

const Tile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
	<div className={`${card} p-4`}>
		<p className='text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
			{label}
		</p>
		<p className='mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 tabular-nums dark:text-white'>
			{value}
		</p>
		{hint && <p className='mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400'>{hint}</p>}
	</div>
);

const TrendChart = ({ insights, dark }: { insights: TPageInsights; dark: boolean }) => {
	const colors = dark ? SERIES.dark : SERIES.light;
	const categories = insights.daily.map((day) => day.date);
	return (
		<Chart
			type='line'
			height={260}
			series={[
				{ name: 'Views', data: insights.daily.map((day) => day.views) },
				{ name: 'Submissions', data: insights.daily.map((day) => day.submissions) },
			]}
			options={{
				colors: [colors.first, colors.second],
				stroke: { width: 2, curve: 'straight' },
				markers: {
					size: 0,
					hover: { size: 5 },
					strokeWidth: 2,
					strokeColors: dark ? '#18181b' : '#ffffff',
				},
				legend: {
					position: 'top',
					horizontalAlign: 'left',
					labels: { colors: dark ? '#d4d4d8' : '#3f3f46' },
				},
				tooltip: {
					shared: true,
					intersect: false,
					theme: dark ? 'dark' : 'light',
					x: { format: 'd MMM yyyy' },
				},
				xaxis: {
					type: 'datetime',
					categories,
					labels: { style: { colors: dark ? '#a1a1aa' : '#71717a' }, datetimeUTC: false },
					axisBorder: { show: false },
					axisTicks: { show: false },
					crosshairs: {
						show: true,
						stroke: { color: dark ? '#52525b' : '#d4d4d8', dashArray: 0 },
					},
				},
				yaxis: {
					min: 0,
					forceNiceScale: true,
					labels: {
						style: { colors: dark ? '#a1a1aa' : '#71717a' },
						formatter: (value) => String(Math.round(value)),
					},
				},
				grid: { borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.08)' },
			}}
		/>
	);
};

const Funnel = ({ totals, dark }: { totals: TPageInsightCounts; dark: boolean }) => {
	const steps = [
		{ label: 'Opened the page', value: totals.views },
		{ label: 'Started filling it in', value: totals.starts },
		{ label: 'Submitted', value: totals.submissions },
		{ label: 'Got a result', value: totals.completed },
	];
	const top = Math.max(1, totals.views);
	return (
		<ol className='space-y-3'>
			{steps.map((step) => (
				<li key={step.label} className='space-y-1'>
					<div className='flex items-baseline justify-between gap-2 text-xs'>
						<span className='font-semibold text-zinc-700 dark:text-zinc-300'>
							{step.label}
						</span>
						<span className='text-zinc-500 tabular-nums dark:text-zinc-400'>
							<span className='font-bold text-zinc-900 dark:text-white'>
								{step.value.toLocaleString()}
							</span>
							{totals.views > 0 && ` · ${percent(step.value / totals.views)}`}
						</span>
					</div>
					<div className='h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]'>
						<div
							className='h-full rounded-full transition-[width] duration-500'
							style={{
								width: `${Math.max(step.value > 0 ? 2 : 0, (step.value / top) * 100)}%`,
								backgroundColor: dark ? SERIES.dark.first : SERIES.light.first,
							}}
						/>
					</div>
				</li>
			))}
		</ol>
	);
};

/** Only says who's ahead once both versions have enough visitors to mean something. */
const MIN_VIEWS_TO_CALL = 30;

const VariantComparison = ({
	ws,
	pageId,
	insights,
	dark,
	live,
	split,
}: {
	ws: string;
	pageId: string;
	insights: TPageInsights;
	dark: boolean;
	live: boolean;
	split: number;
}) => {
	const { confirm } = useConfirm();
	const variant = useWorkflowPageVariant(ws, pageId);
	const [a, b] = insights.variants;
	const callable =
		a.views >= MIN_VIEWS_TO_CALL &&
		b.views >= MIN_VIEWS_TO_CALL &&
		a.conversion_rate !== null &&
		b.conversion_rate !== null;
	const leader = callable
		? b.conversion_rate! > a.conversion_rate!
			? 'b'
			: a.conversion_rate! > b.conversion_rate!
				? 'a'
				: null
		: null;
	const lift =
		callable && a.conversion_rate! > 0
			? (b.conversion_rate! - a.conversion_rate!) / a.conversion_rate!
			: null;
	const colors = dark ? SERIES.dark : SERIES.light;

	const rows: {
		label: string;
		value: (counts: TPageInsightCounts & { avg_duration_seconds: number | null }) => string;
	}[] = [
		{ label: 'Views', value: (c) => c.views.toLocaleString() },
		{ label: 'Submissions', value: (c) => c.submissions.toLocaleString() },
		{ label: 'Submitted after viewing', value: (c) => percent(c.conversion_rate) },
		{ label: 'Got a result', value: (c) => percent(c.completion_rate) },
		{ label: 'Average run time', value: (c) => duration(c.avg_duration_seconds) },
	];

	return (
		<section className={`${card} p-5`}>
			<div className='mb-4 flex flex-wrap items-center gap-2'>
				<FlaskConical size={16} className='text-zinc-500' />
				<h2 className='text-sm font-bold text-zinc-900 dark:text-white'>A/B test</h2>
				<span
					className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
						live
							? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
							: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
					}`}>
					{live ? `Running · ${split}% see B` : 'Not running'}
				</span>
				<div className='ml-auto flex gap-2'>
					<button
						type='button'
						disabled={variant.promote.isPending}
						onClick={async () => {
							const ok = await confirm({
								title: 'Make version B the main page?',
								message:
									'B replaces the page’s draft and the test ends. Visitors see the current page until you publish.',
								confirmText: 'Make B the main page',
								tone: 'primary',
							});
							if (ok)
								variant.promote.mutate(undefined, {
									onSuccess: () =>
										notify.success(
											'Version B is now the main page. Publish it to go live.',
										),
								});
						}}
						className='flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]'>
						<Trophy size={13} /> Make B the main page
					</button>
					<button
						type='button'
						disabled={variant.remove.isPending}
						onClick={async () => {
							const ok = await confirm({
								title: 'End the test and delete version B?',
								message:
									'Everyone sees the main page straight away. B’s results stay in these numbers.',
								confirmText: 'End test',
							});
							if (ok)
								variant.remove.mutate(undefined, {
									onSuccess: () => notify.success('Test ended.'),
								});
						}}
						className='h-8 rounded-lg px-3 text-xs font-semibold text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10'>
						End test
					</button>
				</div>
			</div>

			<div className='overflow-x-auto'>
				<table className='w-full text-left text-xs'>
					<thead>
						<tr className='text-[11px] text-zinc-500 dark:text-zinc-400'>
							<th className='py-2 pr-4 font-semibold'>Over this period</th>
							{(['a', 'b'] as const).map((key) => (
								<th key={key} className='py-2 pr-4 font-semibold'>
									<span className='inline-flex items-center gap-1.5'>
										<span
											className='size-2.5 rounded-full'
											style={{
												backgroundColor:
													key === 'a' ? colors.first : colors.second,
											}}
										/>
										Version {key.toUpperCase()}
										{leader === key && (
											<Trophy
												size={12}
												className='text-amber-500'
												aria-label='Ahead'
											/>
										)}
									</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody className='divide-y divide-zinc-100 dark:divide-white/[0.06]'>
						{rows.map((row) => (
							<tr key={row.label}>
								<td className='py-2.5 pr-4 text-zinc-600 dark:text-zinc-300'>
									{row.label}
								</td>
								<td className='py-2.5 pr-4 font-bold text-zinc-900 tabular-nums dark:text-white'>
									{row.value(a)}
								</td>
								<td className='py-2.5 pr-4 font-bold text-zinc-900 tabular-nums dark:text-white'>
									{row.value(b)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className='mt-3 text-[11px] text-zinc-500 dark:text-zinc-400'>
				{callable
					? leader === null
						? 'Both versions convert the same so far.'
						: `Version ${leader.toUpperCase()} is ahead${lift !== null ? `: B converts ${lift >= 0 ? `${percent(lift)} better` : `${percent(-lift)} worse`} than A` : ''}. Keep it running until the gap holds steady before you pick a winner.`
					: `Too early to call: each version needs at least ${MIN_VIEWS_TO_CALL} views.`}
			</p>
		</section>
	);
};

const STATUS: Record<string, { label: string; icon: ReactNode; className: string }> = {
	completed: {
		label: 'Completed',
		icon: <CheckCircle2 size={13} />,
		className: 'text-emerald-700 dark:text-emerald-400',
	},
	failed: {
		label: 'Failed',
		icon: <OctagonAlert size={13} />,
		className: 'text-rose-600 dark:text-rose-400',
	},
	cancelled: { label: 'Cancelled', icon: <OctagonAlert size={13} />, className: 'text-zinc-500' },
	running: {
		label: 'Running',
		icon: <Loader2 size={13} className='animate-spin' />,
		className: 'text-sky-600 dark:text-sky-400',
	},
	pending: {
		label: 'Starting',
		icon: <Loader2 size={13} className='animate-spin' />,
		className: 'text-sky-600 dark:text-sky-400',
	},
	awaiting_approval: {
		label: 'Waiting',
		icon: <Hourglass size={13} />,
		className: 'text-amber-600 dark:text-amber-400',
	},
	awaiting_callback: {
		label: 'Waiting',
		icon: <Hourglass size={13} />,
		className: 'text-amber-600 dark:text-amber-400',
	},
};

const showValue = (value: unknown) =>
	value === null || value === undefined || value === ''
		? '-'
		: typeof value === 'string' || typeof value === 'number'
			? String(value)
			: typeof value === 'boolean'
				? value
					? 'Yes'
					: 'No'
				: JSON.stringify(value, null, 2);

const ValueList = ({ title, values }: { title: string; values: Record<string, unknown> }) => {
	const entries = Object.entries(values);
	return (
		<div className='min-w-0 space-y-2'>
			<p className='text-[11px] font-bold tracking-wide text-zinc-500 uppercase'>{title}</p>
			{entries.length === 0 ? (
				<p className='text-xs text-zinc-400'>Nothing</p>
			) : (
				<dl className='space-y-2'>
					{entries.map(([key, value]) => (
						<div key={key}>
							<dt className='text-[11px] font-semibold text-zinc-500'>
								{humanize(key)}
							</dt>
							<dd className='text-xs break-words whitespace-pre-wrap text-zinc-900 dark:text-zinc-100'>
								{showValue(value)}
							</dd>
						</div>
					))}
				</dl>
			)}
		</div>
	);
};

const selectClass =
	'h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200';

const SubmissionsTable = ({
	ws,
	pageId,
	hasVariants,
}: {
	ws: string;
	pageId: string;
	hasVariants: boolean;
}) => {
	const [filters, setFilters] = useState<TPageSubmissionFilters>({
		include_tests: false,
		page: 1,
		per_page: 25,
	});
	const [open, setOpen] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);
	const { data, isLoading, isFetching } = useWorkflowPageSubmissionsPage(ws, pageId, filters);
	const set = (patch: Partial<TPageSubmissionFilters>) =>
		setFilters((current) => ({ ...current, page: 1, ...patch }));

	const exportCsv = async () => {
		setExporting(true);
		try {
			await WorkflowPageService.exportSubmissions(ws, pageId, {
				...filters,
				page: undefined,
				per_page: undefined,
			});
		} catch {
			notify.error('Could not export the submissions.');
		} finally {
			setExporting(false);
		}
	};

	const firstInputs = (submission: TPageSubmissionRecord) =>
		Object.values(submission.input)
			.filter((value) => value !== null && value !== '')
			.slice(0, 2)
			.map((value) => (typeof value === 'object' ? JSON.stringify(value) : String(value)))
			.join(' · ');

	return (
		<section className={card}>
			<div className='flex flex-wrap items-center gap-2 border-b border-zinc-100 p-4 dark:border-white/[0.06]'>
				<h2 className='mr-auto text-sm font-bold text-zinc-900 dark:text-white'>
					Submissions{' '}
					{data && (
						<span className='font-semibold text-zinc-400'>
							· {data.meta.total.toLocaleString()}
						</span>
					)}
				</h2>
				<select
					aria-label='Status'
					value={filters.status ?? ''}
					onChange={(e) =>
						set({ status: (e.target.value || null) as TPageSubmissionStatus | null })
					}
					className={selectClass}>
					<option value=''>Any status</option>
					<option value='completed'>Completed</option>
					<option value='failed'>Failed</option>
					<option value='running'>Running</option>
					<option value='waiting'>Waiting</option>
				</select>
				{hasVariants && (
					<select
						aria-label='Version'
						value={filters.variant ?? ''}
						onChange={(e) =>
							set({ variant: (e.target.value || null) as TPageVariant | null })
						}
						className={selectClass}>
						<option value=''>Both versions</option>
						<option value='a'>Version A</option>
						<option value='b'>Version B</option>
					</select>
				)}
				<input
					type='date'
					aria-label='From'
					value={filters.from ?? ''}
					onChange={(e) => set({ from: e.target.value || null })}
					className={selectClass}
				/>
				<input
					type='date'
					aria-label='To'
					value={filters.to ?? ''}
					onChange={(e) => set({ to: e.target.value || null })}
					className={selectClass}
				/>
				<label className='flex h-8 items-center gap-1.5 px-1 text-xs text-zinc-600 dark:text-zinc-300'>
					<input
						type='checkbox'
						checked={!!filters.include_tests}
						onChange={(e) => set({ include_tests: e.target.checked })}
						className='accent-primary-500'
					/>
					Test runs
				</label>
				<button
					type='button'
					onClick={() => void exportCsv()}
					disabled={exporting || !data?.meta.total}
					className='flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
					{exporting ? (
						<Loader2 size={13} className='animate-spin' />
					) : (
						<Download size={13} />
					)}
					Export CSV
				</button>
			</div>

			{isLoading ? (
				<p className='flex items-center gap-2 p-6 text-xs text-zinc-500'>
					<Loader2 size={14} className='animate-spin' /> Loading submissions…
				</p>
			) : !data?.submissions.length ? (
				<p className='p-8 text-center text-xs text-zinc-500'>
					No submissions match these filters.
				</p>
			) : (
				<div
					className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
					<table className='w-full text-left text-xs'>
						<thead className='text-[11px] text-zinc-500 dark:text-zinc-400'>
							<tr className='border-b border-zinc-100 dark:border-white/[0.06]'>
								<th className='w-8 py-2.5 pl-4' />
								<th className='py-2.5 pr-4 font-semibold'>When</th>
								<th className='py-2.5 pr-4 font-semibold'>Status</th>
								<th className='py-2.5 pr-4 font-semibold'>Person</th>
								{hasVariants && (
									<th className='py-2.5 pr-4 font-semibold'>Version</th>
								)}
								<th className='py-2.5 pr-4 font-semibold'>Entered</th>
								<th className='py-2.5 pr-4 font-semibold'>Run time</th>
								<th className='py-2.5 pr-4' />
							</tr>
						</thead>
						<tbody>
							{data.submissions.map((submission) => {
								const status =
									STATUS[submission.run?.status ?? 'failed'] ?? STATUS.failed;
								const expanded = open === submission.id;
								return (
									<Fragment key={submission.id}>
										<tr
											onClick={() => setOpen(expanded ? null : submission.id)}
											className='cursor-pointer border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]'>
											<td className='py-2.5 pl-4'>
												<ChevronDown
													size={13}
													className={`text-zinc-400 transition ${expanded ? 'rotate-180' : ''}`}
												/>
											</td>
											<td
												className='py-2.5 pr-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300'
												title={new Date(
													submission.created_at,
												).toLocaleString()}>
												{relativeTime(submission.created_at)}
											</td>
											<td className='py-2.5 pr-4'>
												<span
													className={`inline-flex items-center gap-1 font-semibold ${status.className}`}>
													{status.icon}
													{status.label}
												</span>
											</td>
											<td className='py-2.5 pr-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300'>
												{submission.user?.name ?? 'Visitor'}
												{submission.is_test && (
													<span className='ml-1.5 rounded bg-zinc-100 px-1 text-[9px] font-bold text-zinc-500 uppercase dark:bg-white/[0.06]'>
														Test
													</span>
												)}
											</td>
											{hasVariants && (
												<td className='py-2.5 pr-4 font-semibold text-zinc-700 dark:text-zinc-300'>
													{submission.variant.toUpperCase()}
												</td>
											)}
											<td className='max-w-[260px] truncate py-2.5 pr-4 text-zinc-500 dark:text-zinc-400'>
												{firstInputs(submission) || '-'}
											</td>
											<td className='py-2.5 pr-4 text-zinc-700 tabular-nums dark:text-zinc-300'>
												{duration(submission.duration_seconds)}
											</td>
											<td className='py-2.5 pr-4 text-right'>
												{submission.run && (
													<Link
														to={paths.trail(ws, submission.run.id)}
														onClick={(event) => event.stopPropagation()}
														className='text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 font-semibold hover:underline'>
														Run <ArrowUpRight size={12} />
													</Link>
												)}
											</td>
										</tr>
										{expanded && (
											<tr className='border-b border-zinc-100 bg-zinc-50/60 dark:border-white/[0.06] dark:bg-white/[0.02]'>
												<td />
												<td
													colSpan={hasVariants ? 7 : 6}
													className='py-4 pr-4'>
													<div className='grid gap-6 sm:grid-cols-2'>
														<ValueList
															title='What they entered'
															values={submission.input}
														/>
														<ValueList
															title='What the page showed'
															values={submission.outputs}
														/>
													</div>
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{data && data.meta.last_page > 1 && (
				<div className='flex items-center justify-end gap-2 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 dark:border-white/[0.06]'>
					Page {data.meta.page} of {data.meta.last_page}
					<button
						type='button'
						aria-label='Previous page'
						disabled={data.meta.page <= 1}
						onClick={() =>
							setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))
						}
						className='flex size-7 items-center justify-center rounded-lg border border-zinc-200 disabled:opacity-40 dark:border-white/10'>
						<ChevronLeft size={13} />
					</button>
					<button
						type='button'
						aria-label='Next page'
						disabled={data.meta.page >= data.meta.last_page}
						onClick={() =>
							setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))
						}
						className='flex size-7 items-center justify-center rounded-lg border border-zinc-200 disabled:opacity-40 dark:border-white/10'>
						<ChevronRight size={13} />
					</button>
				</div>
			)}
		</section>
	);
};

/** How a page is doing: visitors, runs, the A/B test and every submission. */
const PageInsightsPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { workspaceId: ws = '', pageId = '' } = useParams<{
		workspaceId: string;
		pageId: string;
	}>();
	const { isDarkTheme: dark } = useDarkMode();
	const [days, setDays] = useState<(typeof RANGES)[number]>(30);
	const [includeTests, setIncludeTests] = useState(false);
	const { data: page } = useWorkflowPage(ws, pageId);
	const {
		data: insights,
		isLoading,
		isFetching,
	} = useWorkflowPageInsights(ws, pageId, { days, include_tests: includeTests });

	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[
					{ ...pages.workspace.subPages!.pages },
					{
						...pages.pageEditor.subPages!.insights,
						text: page ? `${page.name} · Insights` : 'Insights',
						to: paths.pageInsights(ws, pageId),
					},
				]}
			/>,
		);
		return () => setHeaderLeft(undefined);
	}, [setHeaderLeft, page, ws, pageId]);

	const totals = insights?.totals;
	const hasData = useMemo(() => !!totals && totals.views + totals.submissions > 0, [totals]);

	return (
		<Container className='overflow-y-auto'>
			<div className='mx-auto max-w-6xl space-y-5 py-6'>
				<div className='flex flex-wrap items-center gap-3'>
					<div className='mr-auto min-w-0'>
						<h1 className='truncate text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{page?.name ?? 'Page'}
						</h1>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							{insights
								? `${new Date(insights.range.from).toLocaleDateString()} – ${new Date(insights.range.to).toLocaleDateString()}`
								: 'Insights'}
							{isFetching && !isLoading && (
								<Loader2 size={11} className='ml-1.5 inline animate-spin' />
							)}
						</p>
					</div>
					<div
						role='radiogroup'
						aria-label='Period'
						className='flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-white/10 dark:bg-zinc-900'>
						{RANGES.map((range) => (
							<button
								key={range}
								type='button'
								role='radio'
								aria-checked={days === range}
								onClick={() => setDays(range)}
								className={`h-7 rounded-md px-3 text-xs font-semibold transition ${
									days === range
										? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
										: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300'
								}`}>
								{range} days
							</button>
						))}
					</div>
					<label className='flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300'>
						<input
							type='checkbox'
							checked={includeTests}
							onChange={(e) => setIncludeTests(e.target.checked)}
							className='accent-primary-500'
						/>
						Include test runs
					</label>
					<Link
						to={paths.editPage(ws, pageId)}
						className='flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]'>
						<PencilRuler size={13} /> Edit page
					</Link>
					{page?.is_published && (
						<a
							href={
								page.access === 'workspace'
									? paths.usePage(ws, pageId)
									: paths.publicPage(page.public_token)
							}
							target='_blank'
							rel='noopener noreferrer'
							className='flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]'>
							<ExternalLink size={13} /> Open
						</a>
					)}
				</div>

				{isLoading || !insights || !totals ? (
					<div className='flex items-center justify-center gap-2 py-24 text-sm text-zinc-500'>
						<Loader2 size={16} className='animate-spin' /> Loading insights…
					</div>
				) : (
					<>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
							<Tile
								label='Views'
								value={totals.views.toLocaleString()}
								hint='Unique visitors a day'
							/>
							<Tile
								label='Started'
								value={totals.starts.toLocaleString()}
								hint={`${percent(totals.start_rate)} of views`}
							/>
							<Tile
								label='Submissions'
								value={totals.submissions.toLocaleString()}
								hint={`${percent(totals.conversion_rate)} of views`}
							/>
							<Tile
								label='Got a result'
								value={percent(totals.completion_rate)}
								hint={`${totals.completed.toLocaleString()} completed · ${totals.failed.toLocaleString()} failed`}
							/>
							<Tile
								label='Average run time'
								value={duration(totals.avg_duration_seconds)}
								hint='For completed runs'
							/>
						</div>

						{!hasData ? (
							<div
								className={`${card} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
								<Clock size={22} className='text-zinc-300 dark:text-zinc-600' />
								<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
									No visits in this period yet
								</p>
								<p className='max-w-sm text-xs text-zinc-500'>
									Share the page and views, starts and submissions show up here as
									they happen.
								</p>
							</div>
						) : (
							<div className='grid gap-3 lg:grid-cols-3'>
								<section className={`${card} p-4 lg:col-span-2`}>
									<h2 className='px-1 text-sm font-bold text-zinc-900 dark:text-white'>
										Views and submissions
									</h2>
									<TrendChart insights={insights} dark={dark} />
								</section>
								<section className={`${card} p-5`}>
									<h2 className='mb-4 text-sm font-bold text-zinc-900 dark:text-white'>
										Where people drop off
									</h2>
									<Funnel totals={totals} dark={dark} />
								</section>
							</div>
						)}

						{insights.variants.length === 2 && page && (
							<VariantComparison
								ws={ws}
								pageId={pageId}
								insights={insights}
								dark={dark}
								live={page.variant.live}
								split={page.variant.split}
							/>
						)}

						<SubmissionsTable
							ws={ws}
							pageId={pageId}
							hasVariants={insights.variants.length === 2 || !!page?.variant.exists}
						/>
					</>
				)}
			</div>
		</Container>
	);
};

export default PageInsightsPage;
