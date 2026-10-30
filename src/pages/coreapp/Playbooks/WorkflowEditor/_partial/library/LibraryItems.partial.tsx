import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Star } from 'lucide-react';
import type { TAppSection, TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import NodeIcon from './NodeIcon.partial';
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
		data-library-item
		type='button'
		draggable
		title={node.description}
		onDragStart={(event) => startNodeDrag(event, node)}
		onClick={() => onAdd(node)}
		className='group hover:border-primary-200/70 hover:bg-primary-50/60 dark:hover:border-primary-500/25 dark:hover:bg-primary-500/[0.07] flex w-full cursor-grab items-center gap-3.5 rounded-xl border border-transparent p-2.5 text-left transition hover:shadow-[0_1px_2px_rgba(147,51,234,0.06)]'>
		<span
			className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition group-hover:scale-105'
			style={tintStyle(node.colorHex)}>
			<NodeIcon icon={node.icon} size={16} />
		</span>
		<span className='min-w-0 flex-1'>
			<span className='group-hover:text-primary-700 dark:group-hover:text-primary-300 block truncate text-xs font-bold text-zinc-900 transition dark:text-zinc-100'>
				{node.label}
			</span>
			<span className='mt-0.5 line-clamp-2 text-[10px] leading-normal text-zinc-400 dark:text-zinc-500'>
				{node.description}
			</span>
		</span>
		<span className='bg-primary-100 text-primary-600 dark:bg-primary-400/15 dark:text-primary-300 flex h-6 w-6 shrink-0 translate-x-1 items-center justify-center rounded-lg opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'>
			<Plus size={14} strokeWidth={2.5} />
		</span>
	</button>
);

export const FrequentCard = ({ node, onAdd }: TNodeProps) => (
	<button
		data-library-item
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
		data-library-item
		type='button'
		onClick={() => onSelect(group)}
		className='group flex w-full items-center gap-3.5 rounded-2xl border border-transparent p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.03]'>
		<span
			className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-[1.03]'
			style={tintStyle(group.colorHex)}>
			<NodeIcon icon={group.icon} size={20} />
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

type TAppCardProps = TGroupProps & {
	connected: boolean;
	pinned: boolean;
	onTogglePin: (appSlug: string) => void;
};

export const AppCard = ({ group, connected, pinned, onTogglePin, onSelect }: TAppCardProps) => (
	<div className='group relative flex'>
		<button
			data-library-item
			type='button'
			onClick={() => onSelect(group)}
			className='flex w-full flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-zinc-200 dark:border-white/[0.04] dark:bg-white/[0.01] dark:hover:border-white/10'>
			<span
				className='flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-105'
				style={tintStyle(group.colorHex)}>
				<NodeIcon icon={group.icon} size={22} />
			</span>
			<span
				title={group.label}
				className='mt-2 line-clamp-3 min-h-[2.1em] text-[10px] leading-tight font-bold break-words text-zinc-600 dark:text-zinc-300'>
				{group.label}
			</span>
		</button>
		{connected && (
			<span
				className='pointer-events-none absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500'
				title='Connected'
			/>
		)}
		<button
			type='button'
			aria-pressed={pinned}
			aria-label={pinned ? `Unpin ${group.label}` : `Pin ${group.label}`}
			title={pinned ? 'Unpin from Your apps' : 'Pin to Your apps'}
			onClick={() => onTogglePin(group.slug)}
			className={`absolute top-1.5 left-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition focus-visible:opacity-100 ${
				pinned
					? 'text-amber-500'
					: 'text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-amber-500 dark:text-zinc-600'
			}`}>
			<Star size={12} fill={pinned ? 'currentColor' : 'none'} />
		</button>
	</div>
);

type TAppSectionProps = {
	section: TAppSection;
	collapsed: boolean;
	connectedApps: Set<string>;
	pinnedApps: string[];
	onTogglePin: (appSlug: string) => void;
	onToggle: (sectionId: string) => void;
	onSelect: (group: TNodeCategoryGroup) => void;
};

/** One Apps-panel section: a foldable header with the app count, then its tiles. */
export const AppSection = ({
	section,
	collapsed,
	connectedApps,
	pinnedApps,
	onTogglePin,
	onToggle,
	onSelect,
}: TAppSectionProps) => (
	<div className='border-t border-zinc-100 py-2 first:border-t-0 dark:border-white/[0.04]'>
		<button
			data-library-item
			type='button'
			aria-expanded={!collapsed}
			onClick={() => onToggle(section.id)}
			className='flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left'>
			<ChevronDown
				size={14}
				className={`shrink-0 text-zinc-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
			/>
			<span className='text-xs font-bold text-zinc-700 dark:text-zinc-200'>
				{section.label}
			</span>
			<span className='ml-auto text-[10px] font-semibold text-zinc-400 tabular-nums'>
				{section.apps.length}
			</span>
		</button>
		{!collapsed && (
			<div className='mt-1 grid grid-cols-3 gap-2.5'>
				{section.apps.map((app) => (
					<AppCard
						key={app.id}
						group={app}
						connected={connectedApps.has(app.slug)}
						pinned={pinnedApps.includes(app.slug)}
						onTogglePin={onTogglePin}
						onSelect={onSelect}
					/>
				))}
			</div>
		)}
	</div>
);

type TAppFilterChip = { id: string; label: string };

type TAppFilterChipsProps = {
	chips: TAppFilterChip[];
	active: string;
	onChange: (chipId: string) => void;
};

/** One-tap filters over the Apps panel: everything, what is connected, or a maker's whole suite. */
export const AppFilterChips = ({ chips, active, onChange }: TAppFilterChipsProps) => (
	<div
		role='group'
		aria-label='Filter apps'
		className='-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3'>
		{chips.map((chip) => (
			<button
				key={chip.id}
				type='button'
				aria-pressed={active === chip.id}
				onClick={() => onChange(chip.id)}
				className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-[11px] font-bold transition ${
					active === chip.id
						? 'border-primary-300 bg-primary-50 text-primary-900 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300'
						: 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-white/10 dark:text-zinc-400 dark:hover:text-zinc-200'
				}`}>
				{chip.label}
			</button>
		))}
	</div>
);

type TNodeSearchBoxProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
};

/** A search box that narrows only the list under it, as opposed to the library-wide one at the top. */
export const NodeSearchBox = ({ value, onChange, placeholder }: TNodeSearchBoxProps) => (
	<label className='relative mb-3 block'>
		<Search size={13} className='absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400' />
		<input
			type='search'
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			aria-label={placeholder}
			className='focus:border-primary-300 w-full rounded-xl border border-zinc-200 bg-white py-2 pr-3 pl-8 text-xs font-medium text-zinc-800 outline-none placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100'
		/>
	</label>
);

type TNodeGroupHeaderProps = { title: string; count: number; hint?: string };

/** Heading over one run of nodes inside an app or the Triggers view. */
export const NodeGroupHeader = ({ title, count, hint }: TNodeGroupHeaderProps) => (
	<div className='flex items-baseline gap-2 px-1 pt-3 pb-1.5'>
		<span className='text-[10px] font-black tracking-widest text-zinc-500 uppercase dark:text-zinc-400'>
			{title}
		</span>
		<span className='text-[10px] font-semibold text-zinc-400 tabular-nums'>{count}</span>
		{hint && <span className='ml-auto truncate text-[10px] text-zinc-400'>{hint}</span>}
	</div>
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
		<span className='border-t-primary-500 h-5 w-5 animate-spin rounded-full border-2 border-zinc-300' />
	</div>
);

export const RetryButton = ({ onClick }: { onClick: () => void }) => (
	<button
		type='button'
		onClick={onClick}
		className='text-primary-600 dark:text-primary-400 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
		Try again
	</button>
);
