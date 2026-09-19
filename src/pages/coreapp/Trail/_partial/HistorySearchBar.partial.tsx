import { Filter, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface HistorySearchBarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	selectedType: 'All' | 'Chat' | 'Workflow run';
	onTypeChange: (type: 'All' | 'Chat' | 'Workflow run') => void;
	showFilters: boolean;
	onToggleFilters: () => void;
}

const HistorySearchBar = ({
	searchQuery,
	onSearchChange,
	selectedType,
	onTypeChange,
	showFilters,
	onToggleFilters,
}: HistorySearchBarProps) => {
	return (
		<div className='flex flex-col gap-3.5 md:flex-row md:items-center'>
			<div className='group relative flex-1'>
				<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500' />
				<input
					type='search'
					aria-label='Search history'
					placeholder='Search by title, run type, or date...'
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className='dark:placeholder:text-zinc-650 block h-12 w-full rounded-2xl border border-slate-200 bg-white/55 pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950/60 dark:focus:ring-primary-500/15'
				/>
			</div>

			{/* Filters controls */}
			<div className='flex items-center justify-end gap-2.5'>
				<div className='relative'>
					<button
						onClick={onToggleFilters}
						className='dark:text-zinc-350 dark:hover:bg-zinc-800 flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60'>
						<Filter size={14} className='text-slate-400' />
						<span>Filters</span>
					</button>

					<AnimatePresence>
						{showFilters && (
							<motion.div
								initial={{ opacity: 0, y: 8, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 8, scale: 0.95 }}
								className='absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-[#11131c]/95'>
								<div className='dark:text-zinc-550 mb-1 border-b border-slate-100 px-2.5 py-1.5 text-[9px] font-black tracking-wider text-slate-400 uppercase dark:border-zinc-800/60'>
									Filter Type
								</div>
								{(['All', 'Chat', 'Workflow run'] as const).map((type) => (
									<button
										key={type}
										onClick={() => onTypeChange(type)}
										className={`w-full cursor-pointer rounded-xl px-2.5 py-2 text-left text-xs font-bold transition ${
											selectedType === type
												? 'text-primary-600 bg-primary-50 dark:bg-primary-400/10 dark:text-primary-400'
												: 'text-slate-650 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
										}`}>
										{type === 'All' ? 'All Activities' : type}
									</button>
								))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<button
					onClick={() => onTypeChange('All')}
					className={`flex h-12 cursor-pointer items-center justify-center rounded-2xl px-5 text-xs font-black transition-all duration-300 ${
						selectedType === 'All'
							? 'bg-linear-to-r from-primary-400 to-primary-400 text-primary-950 shadow-md shadow-primary-500/25 dark:shadow-none'
							: 'dark:text-zinc-350 dark:hover:bg-zinc-800 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60'
					}`}>
					All
				</button>
			</div>
		</div>
	);
};

export default HistorySearchBar;
