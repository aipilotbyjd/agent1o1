const CanvasStats = ({ nodes, edges }: { nodes: number; edges: number }) => (
	<div className='absolute top-4 left-4 flex gap-2'>
		<span className='flex items-center gap-1 rounded-full border border-zinc-300 bg-white/90 px-3 py-1 text-xs font-bold text-zinc-800 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200'>
			<span className='h-1.5 w-1.5 rounded-full bg-primary-400' />
			{nodes} nodes
		</span>
		<span className='flex items-center gap-1 rounded-full border border-zinc-300 bg-white/90 px-3 py-1 text-xs font-bold text-zinc-800 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200'>
			<span className='h-1.5 w-1.5 rounded-full bg-primary-400' />
			{edges} connections
		</span>
	</div>
);

export default CanvasStats;
