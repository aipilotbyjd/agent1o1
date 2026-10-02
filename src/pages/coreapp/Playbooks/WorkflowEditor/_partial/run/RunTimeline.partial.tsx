import type { TRunState } from '../../_types/run.type';
import Icon from '@/components/icon/Icon';

const statusConfig: Record<string, { color: string; icon: string }> = {
	idle: { color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300', icon: 'Pause' },
	running: {
		color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
		icon: 'Play',
	},
	success: {
		color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
		icon: 'CheckCircle',
	},
	error: {
		color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
		icon: 'AlertCircle',
	},
	stopped: {
		color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
		icon: 'Stop',
	},
};

const RunTimeline = ({ run }: { run: TRunState }) => {
	const config = statusConfig[run.status] ?? statusConfig.idle;

	return (
		<div className='flex items-center gap-3 text-xs'>
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold uppercase ${config.color}`}>
				<Icon icon={config.icon} className='text-xs' />
				{run.status}
			</span>
			{run.startedAt && (
				<span className='text-zinc-500 dark:text-zinc-400'>
					Started {new Date(run.startedAt).toLocaleTimeString()}
				</span>
			)}
			{run.finishedAt && (
				<span className='text-zinc-500 dark:text-zinc-400'>
					Finished {new Date(run.finishedAt).toLocaleTimeString()}
				</span>
			)}
			{run.status === 'running' && run.currentNodeId && (
				<span className='text-emerald-600 dark:text-emerald-400'>Running...</span>
			)}
		</div>
	);
};

export default RunTimeline;
