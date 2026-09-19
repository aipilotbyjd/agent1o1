import { ChevronRight, Link2 } from 'lucide-react';
import type { DisplayItem } from '../_types/history.types';

interface HistoryMobileCardProps {
	displayItem: DisplayItem;
	isSelected: boolean;
	onSelect: () => void;
}

const HistoryMobileCard = ({ displayItem, isSelected, onSelect }: HistoryMobileCardProps) => {
	const IconComponent = displayItem.icon;

	return (
		<div
			onClick={onSelect}
			className={`flex items-start justify-between gap-3 p-5 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 ${
				isSelected ? 'border-l-4 border-primary-500 bg-primary-400/[0.02] dark:bg-primary-400/[0.02]' : ''
			}`}>
			<div className='flex items-start gap-3.5 min-w-0 flex-1 text-left'>
				{/* Icon */}
				<div
					className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
						displayItem.type === 'Chat'
							? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
							: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
					}`}>
					<IconComponent className='h-5.5 w-5.5' />
				</div>

				{/* Text Info */}
				<div className='flex min-w-0 flex-1 flex-col text-left'>
					<span className='truncate text-[14px] font-black text-slate-850 dark:text-white leading-tight mb-1.5'>
						{displayItem.title}
					</span>

					{/* Meta details row */}
					<div className='flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-0.5'>
						<span
							className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[8.5px] font-black tracking-widest ${
								displayItem.type === 'Chat'
									? 'bg-primary-50 text-primary-600 border border-primary-100 dark:border-primary-900/30 dark:bg-primary-950/30 dark:text-primary-400'
									: 'bg-primary-50 text-primary-600 border border-primary-100 dark:border-primary-900/30 dark:bg-primary-950/30 dark:text-primary-400'
							}`}>
							{displayItem.type === 'Chat' ? 'CHAT' : 'WORKFLOW'}
						</span>

						<span className='text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1'>
							<Link2 size={10} className='text-primary-500' />
							<span className='font-black text-slate-700 dark:text-zinc-250'>
								{displayItem.credits} cr
							</span>
						</span>

						<span className='text-[10px] font-semibold text-slate-450 dark:text-zinc-500'>
							{displayItem.timestamp}
						</span>
					</div>
				</div>
			</div>

			{/* Right: Status and Chevron */}
			<div className='flex flex-col items-end shrink-0 gap-3'>
				<span
					className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide ${
						displayItem.status === 'Complete'
							? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400'
							: displayItem.status === 'Failed'
								? 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400'
								: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/10 dark:bg-zinc-500/5 dark:text-zinc-400'
					}`}>
					{displayItem.status}
				</span>
				<ChevronRight size={15} className='text-slate-400 dark:text-zinc-500' />
			</div>
		</div>
	);
};

export default HistoryMobileCard;
