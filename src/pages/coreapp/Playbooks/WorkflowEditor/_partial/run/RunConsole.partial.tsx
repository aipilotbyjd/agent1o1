import type { TRunLog } from '../../_types/run.type';

const levelStyles: Record<string, string> = {
	error: 'text-rose-600 dark:text-rose-400',
	warn: 'text-amber-600 dark:text-amber-400',
	info: 'text-zinc-600 dark:text-zinc-300',
	debug: 'text-zinc-500 dark:text-zinc-400',
};

const levelBadge: Record<string, string> = {
	error: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
	warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
	info: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
	debug: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400',
};

const RunConsole = ({ logs }: { logs: TRunLog[] }) => (
	<div className='flex h-64 flex-col overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs dark:bg-zinc-950'>
		{logs.length ? (
			logs.map((log) => (
				<div
					key={log.id}
					className={`flex items-start gap-2 py-1 ${levelStyles[log.level ?? 'info']}`}>
					<span
						className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${levelBadge[log.level ?? 'info']}`}>
						{log.level}
					</span>
					<span className='min-w-0 flex-1 break-words'>{log.message}</span>
					<span className='shrink-0 text-zinc-500 dark:text-zinc-500'>
						{new Date(log.at).toLocaleTimeString()}
					</span>
				</div>
			))
		) : (
			<div className='flex h-full items-center justify-center text-zinc-500 dark:text-zinc-500'>
				Run logs will appear here.
			</div>
		)}
	</div>
);

export default RunConsole;
