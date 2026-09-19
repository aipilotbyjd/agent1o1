import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryPaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemStart: number;
	itemEnd: number;
	rowsPerPage: number;
	onPageChange: (page: number) => void;
	onRowsPerPageChange: (rows: number) => void;
}

const HistoryPagination = ({
	currentPage,
	totalPages,
	totalItems,
	itemStart,
	itemEnd,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
}: HistoryPaginationProps) => {
	const renderPageNumbers = () => {
		const pagesList: (number | string)[] = [];

		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pagesList.push(i);
		} else {
			pagesList.push(1, 2, 3);
			if (currentPage > 4 && currentPage < totalPages - 1) {
				pagesList.push('...');
				pagesList.push(currentPage);
			}
			pagesList.push('...');
			pagesList.push(totalPages);
		}

		return pagesList.map((page, index) => {
			if (page === '...') {
				return (
					<div key={`ellipse-${index}`} className='flex items-center px-1'>
						<span className='dark:text-zinc-550 text-xs font-bold text-slate-400 select-none'>
							•••
						</span>
					</div>
				);
			}
			const isPageActive = currentPage === page;
			return (
				<button
					key={`page-${page}`}
					onClick={() => onPageChange(page as number)}
					className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200 ${
						isPageActive
							? 'bg-primary-400 text-primary-950 shadow-sm dark:bg-primary-400'
							: 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
					}`}>
					{page}
				</button>
			);
		});
	};

	return (
		<div className='flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-[#fafbfe]/70 px-6 py-4 sm:flex-row dark:border-zinc-800/80 dark:bg-zinc-950/20'>
			{/* Left: result count */}
			<div className='dark:text-zinc-450 flex items-center gap-2 text-xs font-bold text-slate-500'>
				<span>
					Showing {itemStart} to {itemEnd} of {totalItems} results
				</span>
			</div>

			{/* Center: page buttons */}
			<div className='flex items-center gap-1.5'>
				<button
					disabled={currentPage === 1}
					onClick={() => onPageChange(currentPage - 1)}
					className='text-slate-550 dark:hover:bg-zinc-800 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white shadow-xs transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
					<ChevronLeft size={15} />
				</button>
				{renderPageNumbers()}
				<button
					disabled={currentPage === totalPages}
					onClick={() => onPageChange(currentPage + 1)}
					className='text-slate-550 dark:hover:bg-zinc-800 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white shadow-xs transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
					<ChevronRight size={15} />
				</button>
			</div>

			{/* Right: rows per page */}
			<div className='dark:text-zinc-450 flex items-center gap-2 text-xs font-bold text-slate-500'>
				<div className='relative'>
					<select
						value={rowsPerPage}
						onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
						style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
						className='h-9 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white bg-[url("/src/assets/required/chevron-down.svg")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8 pl-3.5 text-xs font-bold shadow-xs transition-colors outline-none focus:border-primary-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
						{[10, 20, 50].map((val) => (
							<option key={val} value={val}>
								{val} per page
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
};

export default HistoryPagination;
