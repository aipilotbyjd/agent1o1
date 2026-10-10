import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { TAttentionItem } from '../_helper/credentialHealth.helper';

/** Rows shown before the list folds behind "Show all". */
const COLLAPSED_ROWS = 3;

interface INeedsAttentionBannerProps {
	items: TAttentionItem[];
	busyId: string | null;
	/** Non-admins see what's broken but are pointed to an admin to fix it. */
	canManage: boolean;
	onFix: (item: TAttentionItem) => void;
}

const NeedsAttentionBanner = ({ items, busyId, canManage, onFix }: INeedsAttentionBannerProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const expiredCount = items.filter((item) => item.attention.level === 'expired').length;
	const visibleItems = isExpanded ? items : items.slice(0, COLLAPSED_ROWS);

	return (
		<section
			aria-label='Accounts that need attention'
			className='rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/20 dark:bg-amber-500/5'>
			<div className='flex items-start gap-3'>
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'>
					<AlertTriangle className='h-5 w-5' />
				</div>
				<div className='min-w-0'>
					<h2 className='text-sm font-black text-slate-900 dark:text-white'>
						{items.length} {items.length === 1 ? 'account needs' : 'accounts need'}{' '}
						attention
					</h2>
					<p className='mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400'>
						{expiredCount > 0
							? 'Workflows and agents using an expired account fail until it is reconnected.'
							: 'These keys expire soon. Update them before they stop working.'}
					</p>
				</div>
			</div>

			<ul className='mt-4 space-y-2'>
				{visibleItems.map(({ app, credential, attention }) => {
					const IconComponent = app.icon;
					const canReconnect = attention.level === 'expired' && app.isOAuth;
					return (
						<li
							key={credential.id}
							className='flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-white/80 p-3 dark:border-amber-500/10 dark:bg-zinc-900/60'>
							<div
								className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white'
								style={{ backgroundColor: app.color }}>
								<IconComponent className='h-4 w-4' />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-xs font-extrabold text-slate-900 dark:text-white'>
									{credential.name}
									{credential.account_label && (
										<span className='ml-1.5 font-semibold text-slate-500 dark:text-zinc-400'>
											{credential.account_label}
										</span>
									)}
								</p>
								<p
									className={`text-[10px] font-bold ${attention.level === 'expired' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
									{app.name} · {attention.label}
								</p>
							</div>
							{!canManage ? (
								<span className='shrink-0 text-[10px] font-bold text-slate-500 dark:text-zinc-400'>
									Ask an admin
								</span>
							) : (
								<button
									type='button'
									disabled={busyId === credential.id}
									onClick={() => onFix({ app, credential, attention })}
									className='bg-primary-400 text-primary-950 hover:bg-primary-500 h-8 shrink-0 cursor-pointer rounded-lg px-3.5 text-[10px] font-black transition-all active:scale-95 disabled:cursor-wait disabled:opacity-50'>
									{busyId === credential.id
										? 'Reconnecting...'
										: canReconnect
											? 'Reconnect'
											: 'Update key'}
								</button>
							)}
						</li>
					);
				})}
			</ul>

			{items.length > COLLAPSED_ROWS && (
				<button
					type='button'
					onClick={() => setIsExpanded((current) => !current)}
					className='mt-3 flex cursor-pointer items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline dark:text-amber-400'>
					{isExpanded ? 'Show less' : `Show all ${items.length}`}
					<ChevronDown
						className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
					/>
				</button>
			)}
		</section>
	);
};

export default NeedsAttentionBanner;
