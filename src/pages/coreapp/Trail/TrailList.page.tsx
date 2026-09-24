import { useState, useMemo, useEffect } from 'react';
import { useLocation, useOutletContext, useSearchParams } from 'react-router';
import { AlertTriangle, History } from 'lucide-react';
import { OutletContextType } from './_layouts/Trail.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import { notify } from '@/api/core';
import { useRun, useRuns } from '@/api/modules/runs';
import { useWorkflows } from '@/api/modules/workflows';
import { mapToDisplayItem } from './_helper/mapExecution';

// Sub-components
import HistoryPageHeader from './_partial/HistoryPageHeader.partial';
import HistoryStatsCards from './_partial/HistoryStatsCards.partial';
import HistorySearchBar from './_partial/HistorySearchBar.partial';
import HistorySkeletonLoader from './_partial/HistorySkeletonLoader.partial';
import HistoryEmptyState from './_partial/HistoryEmptyState.partial';
import HistoryTableRow from './_partial/HistoryTableRow.partial';
import HistoryMobileCard from './_partial/HistoryMobileCard.partial';
import HistoryPagination from './_partial/HistoryPagination.partial';
import HistoryDetailDrawer from './_partial/HistoryDetailDrawer.partial';

const TrailListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { activeWorkspaceId } = useWorkspaceContext();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.trail }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ─── State ─────────────────────────────────────────────────────────────────
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState<'All' | 'Chat' | 'Workflow run'>('All');
	const [showFilters, setShowFilters] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [copied, setCopied] = useState(false);

	// The open run lives in the URL (`?run=<id>`), so "Copy URL" hands out a
	// link that reopens this drawer — even for a run on another page.
	const [searchParams, setSearchParams] = useSearchParams();
	const { pathname } = useLocation();
	const selectedRunId = searchParams.get('run') ?? '';

	// ─── Data fetching ──────────────────────────────────────────────────────────
	// Single-node tests from the editor are real runs; the dashboard leaves
	// them out of its counts, and so does this list.
	const { data, isLoading, isError, refetch, isFetching } = useRuns(activeWorkspaceId, {
		page: currentPage,
		per_page: rowsPerPage,
		exclude_trigger_type: 'node_test',
	});
	const { data: workflows } = useWorkflows(activeWorkspaceId);

	const runs = useMemo(() => data?.runs ?? [], [data]);
	const selectedOnPage = runs.find((run) => String(run.id) === selectedRunId);
	const { data: selectedFetched } = useRun(
		activeWorkspaceId,
		selectedOnPage ? '' : selectedRunId,
	);
	const selectedItem = selectedOnPage ?? (selectedRunId ? selectedFetched : undefined) ?? null;

	const workflowNames = useMemo(
		() => new Map((workflows ?? []).map((wf) => [String(wf.id), wf.name])),
		[workflows],
	);
	const toDisplay = (run: (typeof runs)[number]) =>
		mapToDisplayItem(
			run,
			run.workflow_id ? workflowNames.get(String(run.workflow_id)) : undefined,
		);

	// ─── Derived: item lists ────────────────────────────────────────────────────
	// The runs endpoint takes no search term and cannot tell agent runs from
	// workflow runs, so both filters narrow the page the server returned.
	const isFiltering = searchQuery.trim() !== '' || selectedType !== 'All';
	const paginatedItems = useMemo(() => {
		if (!isFiltering) return runs;
		const q = searchQuery.trim().toLowerCase();
		return runs.filter((run) => {
			const item = mapToDisplayItem(
				run,
				run.workflow_id ? workflowNames.get(String(run.workflow_id)) : undefined,
			);
			const matchesSearch =
				!q ||
				item.title.toLowerCase().includes(q) ||
				item.type.toLowerCase().includes(q) ||
				item.status.toLowerCase().includes(q) ||
				item.timestamp.toLowerCase().includes(q) ||
				String(run.id).toLowerCase().includes(q);
			const matchesType = selectedType === 'All' || item.type === selectedType;
			return matchesSearch && matchesType;
		});
	}, [runs, isFiltering, searchQuery, selectedType, workflowNames]);

	const totalItems = data?.meta?.total ?? runs.length;
	const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
	const itemStart = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
	const itemEnd = Math.min(currentPage * rowsPerPage, totalItems);

	// ─── Selected details ───────────────────────────────────────────────────────
	const selectedDetails = useMemo(
		() =>
			selectedItem
				? mapToDisplayItem(
						selectedItem,
						selectedItem.workflow_id
							? workflowNames.get(String(selectedItem.workflow_id))
							: undefined,
					)
				: null,
		[selectedItem, workflowNames],
	);

	const setSelectedRun = (id: string | null) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (id) next.set('run', id);
				else next.delete('run');
				return next;
			},
			{ replace: true },
		);
	};

	// ─── Handlers ──────────────────────────────────────────────────────────────
	const handleTypeChange = (type: 'All' | 'Chat' | 'Workflow run') => {
		setSelectedType(type);
		setShowFilters(false);
		setCurrentPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1);
	};

	const handleCopyUrl = (id: string) => {
		navigator.clipboard
			.writeText(`${window.location.origin}${pathname}?run=${encodeURIComponent(id)}`)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => notify.error('Could not copy the link'));
	};

	// ─── Render ─────────────────────────────────────────────────────────────────
	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			{/* Background decorative glows */}
			<div className='pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-primary-400/5 to-primary-400/5 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 md:p-8'>
				<HistoryPageHeader />

				<HistorySearchBar
					searchQuery={searchQuery}
					onSearchChange={handleSearchChange}
					selectedType={selectedType}
					onTypeChange={handleTypeChange}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters((prev) => !prev)}
				/>

				{isFiltering && totalPages > 1 && (
					<p className='-mt-3 px-1 text-xs text-slate-400'>
						Filtering this page only — search and type are not applied across all{' '}
						{totalItems.toLocaleString()} runs.
					</p>
				)}

				<HistoryStatsCards ws={activeWorkspaceId} />

				{/* History list / table */}
				<div className='overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none'>
					{isLoading ? (
						<HistorySkeletonLoader />
					) : isError ? (
						<HistoryEmptyState
							icon={AlertTriangle}
							title='Could not load runs'
							description='The run history did not load. Check your connection and try again.'
							action={
								<button
									type='button'
									onClick={() => refetch()}
									disabled={isFetching}
									className='flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
									{isFetching ? 'Retrying…' : 'Retry'}
								</button>
							}
						/>
					) : paginatedItems.length === 0 ? (
						isFiltering ? (
							<HistoryEmptyState />
						) : (
							<HistoryEmptyState
								icon={History}
								title='No runs yet'
								description='Workflow and agent runs in this workspace will appear here.'
							/>
						)
					) : (
						<div className='no-scrollbar flex flex-col'>
							{/* Desktop table */}
							<div className='hidden md:block no-scrollbar overflow-x-auto'>
								<div className='min-w-[768px]'>
									{/* Table header */}
									<div className='grid grid-cols-12 gap-4 border-b border-slate-100 bg-[#fafbfe]/70 px-6 py-4.5 text-left text-[11px] font-black tracking-wider text-slate-400 uppercase dark:border-zinc-800/80 dark:bg-zinc-950/20'>
										<div className='col-span-5'>Activity</div>
										<div className='col-span-2'>Type</div>
										<div className='col-span-2'>Connections</div>
										<div className='col-span-2'>Date &amp; Time</div>
										<div className='col-span-1' />
									</div>
									{/* Table rows */}
									<div className='divide-y divide-slate-100 dark:divide-zinc-800/60'>
										{paginatedItems.map((item) => {
											const displayItem = toDisplay(item);
											return (
												<HistoryTableRow
													key={displayItem.id}
													item={item}
													displayItem={displayItem}
													isSelected={
														selectedRunId === String(displayItem.id)
													}
													onSelect={() => setSelectedRun(String(item.id))}
												/>
											);
										})}
									</div>
								</div>
							</div>

							{/* Mobile card list */}
							<div className='block md:hidden divide-y divide-slate-100 dark:divide-zinc-800/60'>
								{paginatedItems.map((item) => {
									const displayItem = toDisplay(item);
									return (
										<HistoryMobileCard
											key={displayItem.id}
											displayItem={displayItem}
											isSelected={selectedRunId === String(displayItem.id)}
											onSelect={() => setSelectedRun(String(item.id))}
										/>
									);
								})}
							</div>
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<HistoryPagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={totalItems}
							itemStart={itemStart}
							itemEnd={itemEnd}
							rowsPerPage={rowsPerPage}
							onPageChange={setCurrentPage}
							onRowsPerPageChange={(rows) => {
								setRowsPerPage(rows);
								setCurrentPage(1);
							}}
						/>
					)}
				</div>
			</div>

			{/* Detail drawer */}
			<HistoryDetailDrawer
				selectedDetails={selectedDetails}
				run={selectedItem}
				activeWorkspaceId={activeWorkspaceId}
				onRetried={(runId) => setSelectedRun(runId)}
				copied={copied}
				onCopyUrl={handleCopyUrl}
				onClose={() => setSelectedRun(null)}
			/>
		</Container>
	);
};

export default TrailListPage;
