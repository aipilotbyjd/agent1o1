import { Search } from 'lucide-react';

const HistoryEmptyState = () => {
	return (
		<div className='flex flex-col items-center justify-center space-y-3.5 p-16 text-center'>
			<div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/50 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950'>
				<Search className='h-5 w-5 text-slate-400' />
			</div>
			<div>
				<p className='text-sm font-black text-slate-800 dark:text-zinc-200'>
					No history results found
				</p>
				<p className='mt-1 text-xs text-slate-400'>
					Try refining your search keyword or selecting a different filter type.
				</p>
			</div>
		</div>
	);
};

export default HistoryEmptyState;
