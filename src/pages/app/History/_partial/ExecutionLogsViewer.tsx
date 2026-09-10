import dayjs from 'dayjs';
import { useExecutionLogs } from '@/api/modules/executions/executions.hooks';

interface ExecutionLogsViewerProps {
	ws: string;
	executionId: string;
}

const ExecutionLogsViewer = ({ ws, executionId }: ExecutionLogsViewerProps) => {
	const { data: logs = [], isLoading } = useExecutionLogs(ws, executionId);

	if (isLoading) {
		return (
			<div className='space-y-2.5 py-4'>
				<div className='dark:bg-zinc-800 h-4 w-3/4 animate-pulse rounded bg-slate-200' />
				<div className='dark:bg-zinc-800 h-4 w-1/2 animate-pulse rounded bg-slate-200' />
				<div className='dark:bg-zinc-800 h-4 w-5/6 animate-pulse rounded bg-slate-200' />
			</div>
		);
	}

	if (logs.length === 0) {
		return (
			<p className='py-4 text-center text-xs text-slate-400 dark:text-zinc-500'>
				No execution logs available.
			</p>
		);
	}

	return (
		<div className='border-slate-150 dark:border-zinc-800 no-scrollbar max-h-96 space-y-4 overflow-y-auto rounded-2xl border bg-slate-50/50 p-4.5 dark:bg-zinc-950/20'>
			{logs.map((log, idx) => {
				const isUser =
					log.message.startsWith('User: ') || log.message.startsWith('User Input: ');
				const isAgent =
					log.message.startsWith('Agent: ') || log.message.startsWith('Agent Response: ');
				const cleanMessage = log.message.replace(
					/^(User:|User Input:|Agent:|Agent Response:)\s*/,
					'',
				);

				if (isUser || isAgent) {
					const sender = isUser ? 'user' : 'agent';
					return (
						<div
							key={idx}
							className={`flex flex-col gap-1.5 ${sender === 'user' ? 'items-end' : 'items-start'}`}>
							<span className='text-[9px] font-black tracking-wider text-slate-400 uppercase'>
								{sender === 'user' ? 'User Input' : 'Agent Response'}
							</span>
							<div
								className={`max-w-[85%] rounded-2xl border p-3 text-xs leading-relaxed font-semibold shadow-xs ${
									sender === 'user'
										? 'rounded-tr-none border-primary-700 bg-primary-400 text-primary-950'
										: 'text-slate-850 rounded-tl-none border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
								}`}>
								{cleanMessage}
							</div>
						</div>
					);
				}

				return (
					<div key={idx} className='flex items-start gap-2.5 text-left'>
						<span
							className={`shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase ${
								log.level === 'error'
									? 'bg-rose-100 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400'
									: log.level === 'warning'
										? 'bg-amber-100 text-amber-600 dark:bg-amber-950/25 dark:text-amber-400'
										: 'text-slate-650 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400'
							}`}>
							{log.level}
						</span>
						<div className='min-w-0 flex-1'>
							<p className='text-xs leading-relaxed font-semibold break-words text-slate-700 dark:text-zinc-300'>
								{log.message}
							</p>
							{log.timestamp && (
								<span className='mt-0.5 block text-[9px] text-slate-400 dark:text-zinc-500'>
									{dayjs(log.timestamp).format('HH:mm:ss.SSS')}
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ExecutionLogsViewer;
