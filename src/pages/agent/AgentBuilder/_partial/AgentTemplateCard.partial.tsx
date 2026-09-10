import type { TAgentTemplate } from '../_types/agentBuilder.type';
import { ChevronRight, Zap, Star } from 'lucide-react';

const AgentTemplateCard = ({ template, onClick }: { template: TAgentTemplate; onClick?: () => void }) => {
	const HeaderIcon = template.headerIcon;
	const FooterIcon = template.footerIcon;

	return (
		<button
			type='button'
			onClick={onClick}
			className='group relative flex min-h-[190px] flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 text-left shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/35 hover:bg-zinc-50/10 hover:shadow-lg hover:shadow-primary-500/5 sm:min-h-[200px] lg:min-h-[210px] dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 dark:hover:shadow-none'>
			<div className='w-full'>
				{/* Header: Icon, Title, Chevron */}
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-3 min-w-0'>
						{HeaderIcon && (
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
									template.headerIconColor === 'green'
										? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400'
										: 'border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-500/10 dark:bg-primary-400/5 dark:text-primary-400'
								}`}>
								<HeaderIcon size={18} />
							</div>
						)}
						<h3 className='truncate text-[15px] font-black tracking-tight text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400'>
							{template.title}
						</h3>
					</div>
					<ChevronRight size={16} className='text-zinc-400 transition-transform group-hover:translate-x-0.5' />
				</div>

				{/* Copy Description */}
				<p className='mt-4 line-clamp-3 text-xs leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
					{template.copy}
				</p>
			</div>

			{/* Footer row */}
			<div className='mt-5 flex w-full items-center justify-between'>
				<div className='flex items-center gap-2'>
					{/* Badge (Popular/New) */}
					{template.badge === 'Popular' && (
						<span className='inline-flex items-center gap-1.5 rounded-full border border-primary-200/50 bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-600 dark:border-primary-500/20 dark:bg-primary-400/10 dark:text-primary-400'>
							<Zap size={11} fill='currentColor' />
							Popular
						</span>
					)}
					{template.badge === 'New' && (
						<span className='inline-flex items-center gap-1.5 rounded-full border border-primary-200/50 bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-600 dark:border-primary-500/20 dark:bg-primary-400/10 dark:text-primary-400'>
							<Star size={11} fill='currentColor' />
							New
						</span>
					)}

					{/* Footer Icon */}
					{FooterIcon && (
						<span className='flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400'>
							<FooterIcon size={14} />
						</span>
					)}

					{/* Plus/Count Badge */}
					{template.count && (
						<span className='inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-2.5 text-[11px] font-black text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
							{template.count}
						</span>
					)}
				</div>

				<ChevronRight size={15} className='text-zinc-400 transition-transform group-hover:translate-x-0.5' />
			</div>
		</button>
	);
};

export default AgentTemplateCard;
