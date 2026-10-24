import { Plus } from 'lucide-react';
import type { TConnector } from '@/types/connector.type';
import { connectorToApp } from '@/pages/coreapp/Apps/_helper/connectorCatalog.helper';
import {
	readableColor,
	type TPromptMentionItem,
	type TPromptMentionTrigger,
} from '../../_helper/promptMentions.helper';
import NodeIcon from '../library/NodeIcon.partial';

const ConnectorBadge = ({ connector }: { connector?: TConnector }) => {
	const app = connector ? connectorToApp(connector) : null;
	const AppIcon = app?.icon;
	return (
		<span
			className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-300'
			style={{
				backgroundColor: `${app?.color ?? '#71717a'}1a`,
				color: app ? readableColor(app.color) : undefined,
			}}>
			{AppIcon && <AppIcon className='h-3.5 w-3.5' />}
		</span>
	);
};

const GroupLabel = ({ children }: { children: string }) => (
	<div className='px-2 pt-2 pb-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase first:pt-1 dark:text-zinc-500'>
		{children}
	</div>
);

type TMenuProps = {
	trigger: TPromptMentionTrigger;
	items: TPromptMentionItem[];
	activeIndex: number;
	onHover: (index: number) => void;
	onSelect: (item: TPromptMentionItem) => void;
};

const PromptMentionMenu = ({ trigger, items, activeIndex, onHover, onSelect }: TMenuProps) => (
	<div
		role='listbox'
		aria-label={trigger === 'slash' ? 'Steps' : 'Accounts'}
		className='max-h-72 w-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95'>
		{items.length === 0 && (
			<div className='px-2.5 py-3 text-xs text-zinc-400 dark:text-zinc-500'>
				{trigger === 'slash' ? 'No steps match.' : 'No accounts or apps match.'}
			</div>
		)}
		{items.map((item, index) => {
			const previous = items[index - 1];
			const label =
				item.kind === 'node'
					? index === 0 && 'Steps'
					: item.kind === 'credential'
						? previous?.kind !== 'credential' && 'Connected accounts'
						: previous?.kind !== 'connect' && 'Connect an app';
			return (
				<div key={item.id}>
					{label && <GroupLabel>{label}</GroupLabel>}
					<button
						type='button'
						role='option'
						aria-selected={index === activeIndex}
						onMouseEnter={() => onHover(index)}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => onSelect(item)}
						className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-700 transition dark:text-zinc-300 ${
							index === activeIndex ? 'bg-zinc-100 dark:bg-white/[0.06]' : ''
						}`}>
						{item.kind === 'node' ? (
							<span
								className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px]'
								style={{
									backgroundColor: `${item.node.colorHex ?? '#71717a'}1a`,
									color: item.node.colorHex,
								}}>
								<NodeIcon icon={item.node.icon} size={13} />
							</span>
						) : (
							<ConnectorBadge connector={item.connector} />
						)}
						<span className='min-w-0 flex-1'>
							<span className='block truncate font-semibold'>
								{item.kind === 'node'
									? item.node.label
									: item.kind === 'credential'
										? item.credential.name
										: item.connector.name}
							</span>
							<span className='block truncate text-[10px] text-zinc-400 dark:text-zinc-500'>
								{item.kind === 'node'
									? item.node.description
									: item.kind === 'credential'
										? [item.connector?.name, item.credential.account_label]
												.filter(Boolean)
												.join(' · ')
										: item.connector.category_label}
							</span>
						</span>
						{item.kind === 'credential' && item.credential.is_expired && (
							<span className='text-[10px] font-semibold text-amber-600 dark:text-amber-400'>
								Expired
							</span>
						)}
						{item.kind === 'credential' &&
							!item.credential.is_expired &&
							item.credential.is_default && (
								<span className='text-[10px] text-zinc-400'>Default</span>
							)}
						{item.kind === 'connect' && <Plus size={14} className='text-zinc-400' />}
					</button>
				</div>
			);
		})}
	</div>
);

export default PromptMentionMenu;
