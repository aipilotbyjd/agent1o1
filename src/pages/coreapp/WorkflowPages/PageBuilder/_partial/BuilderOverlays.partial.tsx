import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bookmark, Keyboard, LogOut, Search, TextCursorInput, X } from 'lucide-react';
import { usePageSections } from '@/api/modules/workflow-pages';
import { humanize } from '@/components/workflowPage/PageBlocks';
import type { TPageBlock, TPageBlockType } from '@/types/workflow-page.type';
import { BLOCK_CATALOG, createBlock, newBlockId } from '../_helper/blockCatalog.helper';
import { cloneBlock } from '../_helper/blockTree.helper';
import { usePageBuilderStore } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';

type TEntry = {
	id: string;
	label: string;
	hint: string;
	group: string;
	icon: ReactNode;
	make: () => TPageBlock;
};

const GROUP_ORDER = ['Workflow', 'Layout', 'Content', 'Saved'];

const Backdrop = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
	<div
		className='fixed inset-0 z-[60] flex items-start justify-center bg-zinc-950/30 px-4 pt-[12vh] backdrop-blur-[2px]'
		onMouseDown={onClose}>
		<div
			onMouseDown={(event) => event.stopPropagation()}
			className='w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950'>
			{children}
		</div>
	</div>
);

/**
 * `/`: finds any block, workflow input or output, or saved section by
 * typing, and adds it after the selection. Arrow keys move, Enter adds.
 */
const QuickAddPalette = ({ onClose }: { onClose: () => void }) => {
	const { ws, fields, outputs } = usePageBuilder();
	const { data: sections } = usePageSections(ws);
	const insertBlock = usePageBuilderStore((store) => store.insertBlock);
	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const listRef = useRef<HTMLUListElement>(null);

	const entries = useMemo<TEntry[]>(() => {
		const blocks = (Object.keys(BLOCK_CATALOG) as TPageBlockType[])
			.filter((type) => type !== 'column' && type !== 'field' && type !== 'output')
			.map((type) => {
				const meta = BLOCK_CATALOG[type];
				const Icon = meta.icon;
				return {
					id: type,
					label: meta.label,
					hint: meta.description,
					group:
						meta.group === 'layout'
							? 'Layout'
							: meta.group === 'workflow'
								? 'Workflow'
								: 'Content',
					icon: <Icon size={15} />,
					make: () => createBlock(type),
				};
			});
		return [
			...fields.map((field) => ({
				id: `field:${field.key}`,
				label: field.label || field.key,
				hint: `Input field · ${field.type}`,
				group: 'Workflow',
				icon: <TextCursorInput size={15} />,
				make: () => createBlock('field', { field_key: field.key }),
			})),
			...outputs.map(({ name }) => ({
				id: `output:${name}`,
				label: humanize(name),
				hint: 'Shows this output',
				group: 'Workflow',
				icon: <LogOut size={15} />,
				make: () => createBlock('output', { output_name: name }),
			})),
			...blocks,
			...(sections ?? []).map((section) => ({
				id: `saved:${section.id}`,
				label: section.name,
				hint: `Saved ${BLOCK_CATALOG[section.block.type].label.toLowerCase()}`,
				group: 'Saved',
				icon: <Bookmark size={15} />,
				make: () => cloneBlock(section.block, newBlockId),
			})),
		];
	}, [fields, outputs, sections]);

	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		const matches = entries.filter(
			(entry) =>
				!q || `${entry.label} ${entry.hint} ${entry.group}`.toLowerCase().includes(q),
		);
		return matches.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
	}, [entries, query]);

	useEffect(() => {
		listRef.current
			?.querySelector<HTMLElement>(`[data-index="${active}"]`)
			?.scrollIntoView({ block: 'nearest' });
	}, [active]);

	const add = (entry: TEntry | undefined) => {
		if (!entry) return;
		insertBlock(entry.make());
		onClose();
	};

	return (
		<Backdrop onClose={onClose}>
			<div className='flex items-center gap-2 border-b border-zinc-100 px-4 dark:border-white/[0.06]'>
				<Search size={15} className='shrink-0 text-zinc-400' />
				<input
					autoFocus
					value={query}
					placeholder='Add a block, input, output or saved section…'
					aria-label='Search blocks'
					onChange={(e) => {
						setQuery(e.target.value);
						setActive(0);
					}}
					onKeyDown={(e) => {
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							setActive((index) => Math.min(index + 1, shown.length - 1));
						} else if (e.key === 'ArrowUp') {
							e.preventDefault();
							setActive((index) => Math.max(index - 1, 0));
						} else if (e.key === 'Enter') {
							e.preventDefault();
							add(shown[active]);
						} else if (e.key === 'Escape') {
							onClose();
						}
					}}
					className='h-12 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white'
				/>
				<kbd className='shrink-0 rounded border border-zinc-200 px-1.5 text-[10px] text-zinc-400 dark:border-white/10'>
					Esc
				</kbd>
			</div>
			<ul
				ref={listRef}
				role='listbox'
				aria-label='Blocks'
				className='max-h-[50vh] overflow-y-auto p-1.5'>
				{shown.length === 0 ? (
					<li className='px-3 py-6 text-center text-xs text-zinc-400'>
						Nothing matches “{query}”.
					</li>
				) : (
					shown.map((entry, index) => (
						<li key={entry.id}>
							{(index === 0 || shown[index - 1].group !== entry.group) && (
								<p className='px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-wide text-zinc-400 uppercase'>
									{entry.group}
								</p>
							)}
							<button
								type='button'
								role='option'
								data-index={index}
								aria-selected={index === active}
								onMouseEnter={() => setActive(index)}
								onClick={() => add(entry)}
								className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${
									index === active
										? 'bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-200'
										: 'text-zinc-700 dark:text-zinc-200'
								}`}>
								<span className='flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-white/[0.06]'>
									{entry.icon}
								</span>
								<span className='min-w-0 flex-1'>
									<span className='block truncate text-xs font-semibold'>
										{entry.label}
									</span>
									<span className='block truncate text-[10px] opacity-60'>
										{entry.hint}
									</span>
								</span>
								{index === active && (
									<kbd className='text-[10px] opacity-60'>↵</kbd>
								)}
							</button>
						</li>
					))
				)}
			</ul>
		</Backdrop>
	);
};

const SHORTCUTS: { group: string; items: [string, string][] }[] = [
	{
		group: 'Blocks',
		items: [
			['/ or ⌘K', 'Add a block'],
			['↵ or double-click', 'Edit text in place'],
			['⌘C · ⌘X · ⌘V', 'Copy, cut, paste: across pages too'],
			['⌘D', 'Duplicate'],
			['⌘G', 'Group in a section'],
			['⌫', 'Delete'],
		],
	},
	{
		group: 'Selection',
		items: [
			['⇧ or ⌘ + click', 'Pick more than one block'],
			['⌘A', 'Pick every block on the page'],
			['↑ ↓', 'Pick the block above or below'],
			['⌥↑ ⌥↓', 'Move the block up or down'],
			['Esc', 'Clear the selection'],
		],
	},
	{
		group: 'Page',
		items: [
			['⌘Z · ⇧⌘Z', 'Undo, redo'],
			['⌘P', 'Switch between edit and preview'],
			['⌘S', 'Publish'],
			['?', 'Show these shortcuts'],
		],
	},
];

const ShortcutsSheet = ({ onClose }: { onClose: () => void }) => {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<Backdrop onClose={onClose}>
			<div className='flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<Keyboard size={15} className='text-zinc-400' />
				<p className='text-sm font-bold text-zinc-900 dark:text-white'>
					Keyboard shortcuts
				</p>
				<button
					type='button'
					onClick={onClose}
					aria-label='Close'
					className='ml-auto rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]'>
					<X size={15} />
				</button>
			</div>
			<div className='max-h-[60vh] space-y-4 overflow-y-auto p-4'>
				{SHORTCUTS.map((group) => (
					<section key={group.group}>
						<p className='mb-1.5 text-[10px] font-bold tracking-wide text-zinc-400 uppercase'>
							{group.group}
						</p>
						<dl className='space-y-1'>
							{group.items.map(([keys, label]) => (
								<div
									key={keys}
									className='flex items-center justify-between gap-4 text-xs'>
									<dt className='text-zinc-700 dark:text-zinc-300'>{label}</dt>
									<dd>
										<kbd className='rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[11px] text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300'>
											{keys}
										</kbd>
									</dd>
								</div>
							))}
						</dl>
					</section>
				))}
			</div>
		</Backdrop>
	);
};

/** The palette and shortcut sheet, opened from the keyboard (see `useBuilderHotkeys`). */
const BuilderOverlays = () => {
	const overlay = usePageBuilderStore((store) => store.overlay);
	const setOverlay = usePageBuilderStore((store) => store.setOverlay);
	const close = () => setOverlay(null);
	if (overlay === 'palette') return <QuickAddPalette onClose={close} />;
	if (overlay === 'shortcuts') return <ShortcutsSheet onClose={close} />;
	return null;
};

export default BuilderOverlays;
