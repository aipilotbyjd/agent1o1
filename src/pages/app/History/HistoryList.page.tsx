import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { OutletContextType } from './_layouts/History.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useExecutions } from '@/api/modules/executions/executions.hooks';
import type { TExecution } from '@/types/execution.type';
import type { IHistoryItem } from './_types/history.types';
import { mockHistoryData } from './_helper/mockData';
import { mapToDisplayItem } from './_helper/mapExecution';

// Sub-components
import HistoryPageHeader from './_partial/HistoryPageHeader';
import HistoryStatsCards from './_partial/HistoryStatsCards';
import HistorySearchBar from './_partial/HistorySearchBar';
import HistorySkeletonLoader from './_partial/HistorySkeletonLoader';
import HistoryEmptyState from './_partial/HistoryEmptyState';
import HistoryTableRow from './_partial/HistoryTableRow';
import HistoryMobileCard from './_partial/HistoryMobileCard';
import HistoryPagination from './_partial/HistoryPagination';
import HistoryDetailDrawer from './_partial/HistoryDetailDrawer';

const HistoryListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { activeWorkspaceId } = useWorkspaceContext();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.history }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ─── State ─────────────────────────────────────────────────────────────────
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState<'All' | 'Chat' | 'Workflow run'>('All');
	const [selectedItem, setSelectedItem] = useState<TExecution | IHistoryItem | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [copied, setCopied] = useState(false);

	// ─── Derived: API type filter ───────────────────────────────────────────────
	const typeFilter = useMemo(() => {
		if (selectedType === 'Chat') return 'agent';
		if (selectedType === 'Workflow run') return 'workflow';
		return undefined;
	}, [selectedType]);

	// ─── Data fetching ──────────────────────────────────────────────────────────
	const { data, isLoading, isError } = useExecutions(activeWorkspaceId, {
		page: currentPage,
		per_page: rowsPerPage,
		search: searchQuery || undefined,
		type: typeFilter,
	});

	const useMock = isError || !data?.data?.length;

	// ─── Derived: item lists ────────────────────────────────────────────────────
	const executions = useMemo(() => {
		if (useMock) {
			return mockHistoryData.filter((item) => {
				const q = searchQuery.toLowerCase();
				const matchesSearch =
					item.title.toLowerCase().includes(q) ||
					item.type.toLowerCase().includes(q) ||
					item.timestamp.toLowerCase().includes(q);
				const matchesType = selectedType === 'All' || item.type === selectedType;
				return matchesSearch && matchesType;
			});
		}
		return data!.data;
	}, [data, useMock, searchQuery, selectedType]);

	const totalItems = useMemo(() => {
		if (useMock) return executions.length;
		return data?.meta?.total ?? data?.data?.length ?? 0;
	}, [data, useMock, executions.length]);

	const paginatedItems = useMemo(() => {
		if (useMock) {
			const startIndex = (currentPage - 1) * rowsPerPage;
			return executions.slice(startIndex, startIndex + rowsPerPage);
		}
		return executions;
	}, [executions, useMock, currentPage, rowsPerPage]);

	const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
	const itemStart = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
	const itemEnd = Math.min(currentPage * rowsPerPage, totalItems);

	// ─── Selected details ───────────────────────────────────────────────────────
	const selectedDetails = useMemo(
		() => (selectedItem ? mapToDisplayItem(selectedItem) : null),
		[selectedItem],
	);

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
		navigator.clipboard.writeText(`${window.location.origin}/history?chat_id=${id}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
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

				<HistoryStatsCards />

				{/* History list / table */}
				<div className='overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none'>
					{isLoading ? (
						<HistorySkeletonLoader />
					) : paginatedItems.length === 0 ? (
						<HistoryEmptyState />
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
											const displayItem = mapToDisplayItem(item);
											return (
												<HistoryTableRow
													key={displayItem.id}
													item={item}
													displayItem={displayItem}
													isSelected={selectedItem?.id === displayItem.id}
													onSelect={() => setSelectedItem(item)}
												/>
											);
										})}
									</div>
								</div>
							</div>

							{/* Mobile card list */}
							<div className='block md:hidden divide-y divide-slate-100 dark:divide-zinc-800/60'>
								{paginatedItems.map((item) => {
									const displayItem = mapToDisplayItem(item);
									return (
										<HistoryMobileCard
											key={displayItem.id}
											displayItem={displayItem}
											isSelected={selectedItem?.id === displayItem.id}
											onSelect={() => setSelectedItem(item)}
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
				activeWorkspaceId={activeWorkspaceId}
				copied={copied}
				onCopyUrl={handleCopyUrl}
				onClose={() => setSelectedItem(null)}
			/>
		</Container>
	);
};

export default HistoryListPage;
