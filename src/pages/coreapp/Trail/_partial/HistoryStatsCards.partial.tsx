import { MessageSquare, Workflow } from 'lucide-react';

const HistoryStatsCards = () => {
	return (
		<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
			{/* Card 1: Total Runs */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Total Runs
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						128
					</span>
				</div>
				{/* SVG sparkline chart */}
				<div className='h-12 w-24 text-primary-500 drop-shadow-[0_2px_4px_rgba(139,92,246,0.15)]'>
					<svg viewBox='0 0 100 40' className='h-full w-full overflow-visible'>
						<defs>
							<linearGradient id='violet-glow' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='rgb(139, 92, 246)' stopOpacity='0.15' />
								<stop offset='100%' stopColor='rgb(139, 92, 246)' stopOpacity='0.0' />
							</linearGradient>
						</defs>
						<path
							d='M 0,30 Q 15,35 30,20 T 60,10 T 80,25 T 100,5'
							fill='url(#violet-glow)'
							className='transition-all duration-300'
						/>
						<path
							d='M 0,30 Q 15,35 30,20 T 60,10 T 80,25 T 100,5'
							fill='none'
							stroke='currentColor'
							strokeWidth='2.8'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>
			</div>

			{/* Card 2: Chats */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Chats
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						82
					</span>
				</div>
				<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:bg-primary-950/30 dark:text-primary-400'>
					<MessageSquare className='h-5 w-5' />
				</div>
			</div>

			{/* Card 3: Workflow Runs */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Workflow Runs
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						46
					</span>
				</div>
				<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:bg-primary-950/30 dark:text-primary-400'>
					<Workflow className='h-5 w-5' />
				</div>
			</div>

			{/* Card 4: Success Rate */}
			<div className='group relative flex items-center justify-between rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-primary-500/20 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<div className='flex flex-col gap-1 text-left'>
					<span className='text-[10px] font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
						Success Rate
					</span>
					<span className='text-3.5xl font-black tracking-tight text-slate-900 dark:text-white'>
						98.2%
					</span>
				</div>
				{/* SVG sparkline chart */}
				<div className='h-12 w-24 text-primary-500 drop-shadow-[0_2px_4px_rgba(196,238,61,0.15)]'>
					<svg viewBox='0 0 100 40' className='h-full w-full overflow-visible'>
						<defs>
							<linearGradient id='blue-glow' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='0%' stopColor='var(--primary-500)' stopOpacity='0.15' />
								<stop offset='100%' stopColor='var(--primary-500)' stopOpacity='0.0' />
							</linearGradient>
						</defs>
						<path
							d='M 0,35 Q 20,20 40,30 T 70,10 T 100,8'
							fill='url(#blue-glow)'
							className='transition-all duration-300'
						/>
						<path
							d='M 0,35 Q 20,20 40,30 T 70,10 T 100,8'
							fill='none'
							stroke='currentColor'
							strokeWidth='2.8'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>
			</div>
		</div>
	);
};

export default HistoryStatsCards;
