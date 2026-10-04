import { ChevronRight, Loader2 } from 'lucide-react';
import type { TAgentTemplate } from '@/types/template.type';
import { agentColorTileClass, agentIconFor } from '../../_helper/agentAppearance';

const AgentTemplateCard = ({
	template,
	isCreating = false,
	onClick,
}: {
	template: TAgentTemplate;
	isCreating?: boolean;
	onClick?: () => void;
}) => {
	const Icon = agentIconFor(template.icon);

	return (
		<button
			type='button'
			onClick={onClick}
			disabled={isCreating}
			className='group relative flex min-h-[190px] w-full flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 text-left shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/35 hover:bg-zinc-50/10 hover:shadow-lg hover:shadow-primary-500/5 disabled:cursor-wait disabled:opacity-70 sm:min-h-[200px] lg:min-h-[210px] dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 dark:hover:shadow-none'>
			<div className='w-full'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<div
							className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${agentColorTileClass(template.color)}`}>
							<Icon size={18} />
						</div>
						<h3 className='truncate text-[15px] font-black tracking-tight text-zinc-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400'>
							{template.name}
						</h3>
					</div>
					{isCreating ? (
						<Loader2 size={16} className='shrink-0 animate-spin text-zinc-400' />
					) : (
						<ChevronRight
							size={16}
							className='shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5'
						/>
					)}
				</div>

				<p className='mt-4 line-clamp-3 text-xs leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
					{template.description}
				</p>
			</div>

			<div className='mt-5 flex w-full items-center gap-2'>
				{template.category && (
					<span className='inline-flex items-center rounded-full border border-zinc-200/60 bg-zinc-50 px-3 py-1 text-[11px] font-black text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
						{template.category}
					</span>
				)}
				{template.usage_count > 0 && (
					<span className='text-[11px] font-bold text-zinc-400 dark:text-zinc-500'>
						Used {template.usage_count}×
					</span>
				)}
			</div>
		</button>
	);
};

export default AgentTemplateCard;
