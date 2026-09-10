import type { ReactNode } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import NodeIcon from './NodeIcon.partial';
import CategoryIcon from './CategoryIcon.partial';
import { tintStyle } from './library.util';

const startNodeDrag = (event: React.DragEvent, node: TNodeDefinition) => {
	event.dataTransfer.setData('application/x-node-def', node.key);
	event.dataTransfer.setData('application/x-node-definition', JSON.stringify(node));
	event.dataTransfer.effectAllowed = 'move';
};

type TNodeProps = { node: TNodeDefinition; onAdd: (node: TNodeDefinition) => void };
type TGroupProps = { group: TNodeCategoryGroup; onSelect: (group: TNodeCategoryGroup) => void };

export const NodeRow = ({ node, onAdd }: TNodeProps) => (
	<button
		type='button'
		draggable
		title={node.description}
		onDragStart={(event) => startNodeDrag(event, node)}
		onClick={() => onAdd(node)}
		className='group flex w-full cursor-grab items-center gap-3.5 rounded-xl border border-transparent p-2.5 text-left transition hover:border-primary-200/70 hover:bg-primary-50/60 hover:shadow-[0_1px_2px_rgba(147,51,234,0.06)] dark:hover:border-primary-500/25 dark:hover:bg-primary-500/[0.07]'>
		<span
			className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition group-hover:scale-105'
			style={tintStyle(node.colorHex)}>
			<NodeIcon icon={node.icon} size={16} />
		</span>
		<span className='min-w-0 flex-1'>
			<span className='block truncate text-xs font-bold text-zinc-900 transition group-hover:text-primary-700 dark:text-zinc-100 dark:group-hover:text-primary-300'>
				{node.label}
			</span>
			<span className='mt-0.5 line-clamp-2 text-[10px] leading-normal text-zinc-400 dark:text-zinc-500'>
				{node.description}
			</span>
		</span>
		<span className='flex h-6 w-6 shrink-0 translate-x-1 items-center justify-center rounded-lg bg-primary-100 text-primary-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:bg-primary-400/15 dark:text-primary-300'>
			<Plus size={14} strokeWidth={2.5} />
		</span>
	</button>
);

export const FrequentCard = ({ node, onAdd }: TNodeProps) => (
	<button
		type='button'
		draggable
		onDragStart={(event) => startNodeDrag(event, node)}
		onClick={() => onAdd(node)}
		className='group flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-sm dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:shadow-black/20'>
		<span
			className='flex h-9 w-9 items-center justify-center rounded-xl text-base'
			style={tintStyle(node.colorHex)}>
			<NodeIcon icon={node.icon} size={18} />
		</span>
		<span className='mt-1 min-w-0'>
			<span className='block truncate text-xs font-bold text-zinc-900 transition group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white'>
				{node.label}
			</span>
			<span className='mt-0.5 line-clamp-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500'>
				{node.description}
			</span>
		</span>
	</button>
);

export const CategoryRow = ({ group, onSelect }: TGroupProps) => (
	<button
		type='button'
		onClick={() => onSelect(group)}
		className='group flex w-full items-center gap-3.5 rounded-2xl border border-transparent p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.03]'>
		<span
			className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-[1.03]'
			style={tintStyle(group.colorHex)}>
			<CategoryIcon slug={group.slug} label={group.label} size={20} />
		</span>
		<span className='min-w-0 flex-1'>
			<span className='block truncate text-sm font-bold text-zinc-900 transition group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white'>
				{group.label}
			</span>
			<span className='mt-0.5 line-clamp-1 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
				{group.description || `${group.nodesCount} nodes`}
			</span>
		</span>
		<ChevronRight
			size={16}
			className='shrink-0 transform text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400'
		/>
	</button>
);

export const AppCard = ({ group, onSelect }: TGroupProps) => (
	<button
		type='button'
		onClick={() => onSelect(group)}
		className='group relative flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-zinc-200 dark:border-white/[0.04] dark:bg-white/[0.01] dark:hover:border-white/10'>
		{group.connected && (
			<span
				className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500'
				title='Connected'
			/>
		)}
		<span
			className='flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-105'
			style={tintStyle(group.colorHex)}>
			<CategoryIcon slug={group.slug} label={group.label} size={18} />
		</span>
		<span className='mt-2 line-clamp-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-300'>
			{group.label}
		</span>
	</button>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
	<div className='px-1 pb-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500'>
		{children}
	</div>
);

export const StateMessage = ({
	icon,
	title,
	children,
}: {
	icon: ReactNode;
	title: string;
	children?: ReactNode;
}) => (
	<div className='flex h-full flex-col items-center justify-center gap-3 px-8 text-center'>
		<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900'>
			{icon}
		</div>
		<div className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>{title}</div>
		{children}
	</div>
);

export const PanelLoader = () => (
	<div className='flex h-full items-center justify-center text-zinc-400'>
		<span className='h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-primary-500' />
	</div>
);

export const RetryButton = ({ onClick }: { onClick: () => void }) => (
	<button
		type='button'
		onClick={onClick}
		className='rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-primary-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-primary-400'>
		Try again
	</button>
);
