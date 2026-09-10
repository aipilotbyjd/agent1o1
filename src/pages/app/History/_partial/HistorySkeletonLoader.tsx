const HistorySkeletonLoader = () => {
	return (
		<div className='animate-pulse divide-y divide-slate-100 dark:divide-zinc-800/60'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='flex items-center justify-between gap-4 p-5'>
					<div className='flex min-w-0 flex-1 items-center gap-4'>
						<div className='h-11 w-11 shrink-0 rounded-2xl bg-slate-200 dark:bg-zinc-800' />
						<div className='max-w-sm flex-1 space-y-2'>
							<div className='h-4 w-2/3 rounded bg-slate-200 dark:bg-zinc-800' />
							<div className='h-3 w-1/4 rounded bg-slate-200 dark:bg-zinc-800' />
						</div>
					</div>
					<div className='flex items-center gap-8'>
						<div className='h-6 w-16 rounded bg-slate-200 dark:bg-zinc-800' />
						<div className='h-4 w-24 rounded bg-slate-200 dark:bg-zinc-800' />
					</div>
				</div>
			))}
		</div>
	);
};

export default HistorySkeletonLoader;
