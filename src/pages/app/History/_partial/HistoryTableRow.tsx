import { Calendar, Link2, MoreVertical } from 'lucide-react';
import type { DisplayItem } from '../_types/history.types';
import type { IHistoryItem } from '../_types/history.types';
import type { TExecution } from '@/types/execution.type';

interface HistoryTableRowProps {
	item: IHistoryItem | TExecution;
	displayItem: DisplayItem;
	isSelected: boolean;
	onSelect: () => void;
}

const HistoryTableRow = ({ displayItem, isSelected, onSelect }: HistoryTableRowProps) => {
	const IconComponent = displayItem.icon;

	return (
		<div
			onClick={onSelect}
			className={`grid cursor-pointer grid-cols-12 items-center gap-4 px-6 py-4.5 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 ${
				isSelected ? 'border-l-4 border-primary-500 bg-primary-400/[0.02] dark:bg-primary-400/[0.02]' : ''
			}`}>
			{/* Activity col */}
			<div className='col-span-5 flex min-w-0 items-center gap-4'>
				<div
					className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
						displayItem.type === 'Chat'
							? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
							: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
					}`}>
					<IconComponent className='h-5.5 w-5.5' />
				</div>
				<div className='flex min-w-0 flex-col items-start'>
					<span className='w-full truncate text-[14px] font-black text-slate-850 dark:text-white leading-tight mb-0.5'>
						{displayItem.title}
					</span>
					<span className='dark:text-zinc-550 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider'>
						{displayItem.type === 'Chat' ? 'Chat Activity' : 'Workflow Run'}
					</span>
				</div>
			</div>

			{/* Type tag col */}
			<div className='col-span-2 flex justify-start'>
				<span
					className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-black tracking-widest ${
						displayItem.type === 'Chat'
							? 'border border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/30 dark:text-primary-400'
							: 'border border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/30 dark:text-primary-400'
					}`}>
					{displayItem.type === 'Chat' ? 'CHAT' : 'WORKFLOW'}
				</span>
			</div>

			{/* Connections col */}
			<div className='text-slate-655 col-span-2 flex items-center justify-start gap-1.5 text-xs font-bold dark:text-zinc-400'>
				<div className='flex h-7 items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-2 dark:border-zinc-800 dark:bg-zinc-950/40'>
					<Link2 size={12} className='shrink-0 text-primary-500' />
					<span className='dark:text-zinc-250 font-black text-slate-750'>
						{displayItem.credits} cr
					</span>
				</div>
			</div>

			{/* Date Time col */}
			<div className='col-span-2 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-zinc-400'>
				<Calendar size={12.5} className='shrink-0 text-slate-400' />
				<span>{displayItem.timestamp}</span>
			</div>

			{/* Action button col */}
			<div className='col-span-1 flex justify-end'>
				<button
					type='button'
					aria-label='More actions'
					onClick={(e) => e.stopPropagation()}
					className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-750 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
					<MoreVertical size={16} />
				</button>
			</div>
		</div>
	);
};

export default HistoryTableRow;
