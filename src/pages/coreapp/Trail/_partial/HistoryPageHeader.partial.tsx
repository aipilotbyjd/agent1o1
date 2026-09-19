const HistoryPageHeader = () => {
	return (
		<div className='flex flex-col gap-0.5 text-left'>
			<h1 className='text-2xl font-black tracking-tight text-slate-900 dark:text-white'>
				History
			</h1>
			<p className='dark:text-zinc-450 text-xs font-semibold text-slate-500'>
				View your agent chats and workflow runs
			</p>
		</div>
	);
};

export default HistoryPageHeader;
