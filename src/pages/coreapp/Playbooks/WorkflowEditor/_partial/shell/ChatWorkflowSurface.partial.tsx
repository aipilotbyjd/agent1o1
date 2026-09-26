import {
	ArrowUp,
	AtSign,
	Briefcase,
	Grid2X2,
	Paperclip,
	Plus,
	Search,
	Sparkles,
	SquareArrowOutUpRight,
	X,
	Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const chartDays = [
	'Apr 14',
	'Apr 16',
	'Apr 18',
	'Apr 20',
	'Apr 22',
	'Apr 24',
	'Apr 26',
	'Apr 28',
	'Apr 30',
	'May 2',
	'May 4',
	'May 6',
	'May 8',
	'May 10',
	'May 12',
	'May 14',
];

const recentChats = [
	{ title: 'Skill Creation', icon: Briefcase, time: 'yesterday' },
	{ title: 'Skill Creator Planning', icon: Briefcase, time: 'yesterday' },
	{ title: 'Workflow publishing flow', icon: Zap, time: 'today' },
];

const AppDot = ({ label, color }: { label: string; color: string }) => (
	<div
		title={label}
		className={[
			'-ml-1 flex h-6 w-6 items-center justify-center rounded-md border border-white text-[10px] font-black text-white shadow-sm first:ml-0',
			color,
		].join(' ')}>
		{label.slice(0, 1)}
	</div>
);

const ChatWorkflowSurface = () => {
	return (
		<div className='min-w-0 flex-1 overflow-y-auto bg-[#fbfbfc] text-zinc-950'>
			<div className='mx-auto flex min-h-full w-full max-w-[1080px] flex-col px-5 py-10 sm:px-8 lg:px-10'>
				<div className='flex flex-1 flex-col justify-center py-10 lg:py-16'>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
						className='mx-auto w-full max-w-[760px]'>
						<h1 className='mb-7 text-center text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl'>
							Hey Amaan, how can I help?
						</h1>

						<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_46px_rgba(24,24,27,0.10)]'>
							<textarea
								aria-label='Ask AI'
								placeholder='Ask anything, type @ to mention an agent'
								className='h-36 w-full resize-none border-0 bg-transparent px-5 pt-5 text-base leading-7 font-medium text-zinc-800 shadow-none outline-none placeholder:text-zinc-400 focus:border-0 focus:shadow-none focus:ring-0 focus:outline-none sm:h-40 sm:px-6 sm:text-lg'
							/>
							<div className='flex flex-wrap items-center justify-between gap-3 px-4 pb-4 sm:px-5'>
								<div className='flex min-w-0 flex-wrap items-center gap-4 text-sm font-bold text-zinc-700'>
									<button className='flex items-center gap-2 transition hover:text-zinc-950'>
										<Sparkles size={19} className='text-orange-500' />
										Recommended
									</button>
									<button className='flex items-center gap-2 transition hover:text-zinc-950'>
										<Grid2X2 size={18} />
										14 apps
									</button>
									<button
										type='button'
										aria-label='Attach file'
										className='transition hover:text-zinc-950'>
										<Paperclip size={18} />
									</button>
									<button className='flex items-center gap-2 transition hover:text-zinc-950'>
										<AtSign size={18} />
									</button>
									<button className='flex items-center gap-2 transition hover:text-zinc-950'>
										<SquareArrowOutUpRight size={17} />
										Skill
									</button>
								</div>
								<button
									type='button'
									aria-label='Send prompt'
									className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#60a5fa,#f472b6)] text-white shadow-lg ring-4 shadow-primary-300/40 ring-zinc-100 transition hover:-translate-y-0.5 hover:shadow-xl'>
									<ArrowUp size={19} />
								</button>
							</div>
						</div>

						<div className='flex items-center justify-between gap-4 rounded-b-2xl bg-zinc-100/90 px-5 py-3 text-sm font-semibold text-zinc-800 shadow-inner shadow-zinc-200/60'>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex shrink-0 items-center'>
									<AppDot label='S' color='bg-sky-500' />
									<AppDot label='H' color='bg-emerald-500' />
									<AppDot label='A' color='bg-orange-500' />
									<AppDot label='N' color='bg-yellow-500' />
								</div>
								<span className='min-w-0 truncate'>
									Connect apps to power your agent's abilities
								</span>
							</div>
							<button
								type='button'
								aria-label='Dismiss app suggestion'
								className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white hover:text-zinc-950'>
								<X size={16} />
							</button>
						</div>
					</motion.div>

					<div className='mx-auto mt-12 w-full max-w-[760px]'>
						<div className='flex h-18 items-end gap-1.5 border-b border-zinc-200 px-1'>
							{chartDays.map((day) => (
								<div key={day} className='flex flex-1 flex-col items-center gap-2'>
									<div
										className={[
											'w-4 rounded-t-sm transition',
											day === 'May 14'
												? 'h-14 bg-emerald-500'
												: 'h-0 bg-transparent',
										].join(' ')}
									/>
								</div>
							))}
						</div>
						<div className='mt-2 flex justify-between gap-1 text-center text-xs font-medium text-zinc-500'>
							{chartDays.map((day) => (
								<div key={day} className='min-w-0 flex-1 truncate'>
									{day}
								</div>
							))}
						</div>

						<section className='mt-9'>
							<div className='flex items-center gap-4 text-base font-semibold text-zinc-500'>
								<span>Triggers</span>
								<button
									type='button'
									aria-label='Add trigger'
									className='flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-zinc-100 hover:text-zinc-950'>
									<Plus size={17} />
								</button>
							</div>
							<div className='mt-3 border-t border-zinc-200 pt-4 text-base font-medium text-zinc-500'>
								No triggers found
							</div>
						</section>

						<section className='mt-10'>
							<div className='flex items-center justify-between border-b border-zinc-200 pb-4'>
								<h2 className='text-base font-semibold text-zinc-500'>
									Recent Chats
								</h2>
								<div className='flex items-center gap-2 text-base font-medium text-zinc-400'>
									<Search size={18} />
									Search chats
								</div>
							</div>
							<div className='divide-y divide-zinc-100'>
								{recentChats.map((chat) => {
									const Icon = chat.icon;
									return (
										<button
											key={chat.title}
											type='button'
											className='flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-zinc-50'>
											<div className='flex min-w-0 items-center gap-3'>
												<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500'>
													<Icon size={17} />
												</div>
												<div className='truncate text-base font-medium text-zinc-500 sm:text-lg'>
													{chat.title}
												</div>
											</div>
											<div className='shrink-0 text-base font-medium text-zinc-500'>
												{chat.time}
											</div>
										</button>
									);
								})}
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChatWorkflowSurface;
