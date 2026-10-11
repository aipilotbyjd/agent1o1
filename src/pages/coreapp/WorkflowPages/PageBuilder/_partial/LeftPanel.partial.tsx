import { useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { Check, GripVertical, Layers, LogOut, Palette, Plus, TextCursorInput, Trash2 } from 'lucide-react';
import type { TPageBlock, TPageBlockType, TPageTheme } from '@/types/workflow-page.type';
import { humanize } from '@/components/workflowPage/PageBlocks';
import { BLOCK_CATALOG, blockSummary, createBlock } from '../_helper/blockCatalog.helper';
import { selectBlocks, usePageBuilderStore, type TBuilderLeftTab, type TDragPayload } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { PanelSection, PanelText, Segmented, Toggle } from './controls.partial';

export const DRAG_MIME = 'application/x-agent1o1-page-block';

export const startDrag = (event: DragEvent, payload: TDragPayload) => {
	event.dataTransfer.setData(DRAG_MIME, '1');
	event.dataTransfer.effectAllowed = payload.kind === 'new' ? 'copy' : 'move';
	usePageBuilderStore.getState().setDragging(payload);
};

export const endDrag = () => usePageBuilderStore.getState().setDragging(null);

const TABS: { id: TBuilderLeftTab; label: string; icon: typeof Plus }[] = [
	{ id: 'add', label: 'Add', icon: Plus },
	{ id: 'layers', label: 'Layers', icon: Layers },
	{ id: 'theme', label: 'Theme', icon: Palette },
];

/** A library row: click adds it after the selected block, drag drops it anywhere. */
const LibraryItem = ({
	icon,
	label,
	description,
	onAdd,
	makeBlock,
	trailing,
	muted,
}: {
	icon: ReactNode;
	label: string;
	description?: string;
	onAdd: () => void;
	makeBlock: () => TPageBlock;
	trailing?: ReactNode;
	muted?: boolean;
}) => (
	<button
		type='button'
		draggable
		onDragStart={(event) => startDrag(event, { kind: 'new', block: makeBlock() })}
		onDragEnd={endDrag}
		onClick={onAdd}
		className={`group flex w-full cursor-grab items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2 text-left transition hover:border-primary-400/60 hover:bg-primary-50/50 hover:shadow-sm active:cursor-grabbing dark:border-white/[0.07] dark:bg-zinc-900/60 dark:hover:border-primary-400/30 dark:hover:bg-primary-400/5 ${muted ? 'opacity-60' : ''}`}>
		<span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition group-hover:bg-primary-100 group-hover:text-primary-800 dark:bg-white/[0.06] dark:text-zinc-300 dark:group-hover:bg-primary-400/15 dark:group-hover:text-primary-300'>
			{icon}
		</span>
		<span className='min-w-0 flex-1'>
			<span className='block truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100'>{label}</span>
			{description && (
				<span className='block truncate text-[10px] text-zinc-400 dark:text-zinc-500'>{description}</span>
			)}
		</span>
		{trailing}
	</button>
);

const AddTab = () => {
	const { fields, outputs, interfaceLoading } = usePageBuilder();
	const blocks = usePageBuilderStore(selectBlocks);
	const insertBlock = usePageBuilderStore((store) => store.insertBlock);
	const addBlock = usePageBuilderStore((store) => store.addBlock);

	const placedFields = new Set(blocks.flatMap((block) => (block.type === 'field' ? [block.props.field_key] : [])));
	const placedOutputs = new Set(blocks.flatMap((block) => (block.type === 'output' ? [block.props.output_name] : [])));

	const addAfterSelection = (block: TPageBlock) => {
		const { selectedId, content } = usePageBuilderStore.getState();
		const index = content?.blocks.findIndex((item) => item.id === selectedId) ?? -1;
		insertBlock(block, index >= 0 ? index + 1 : undefined);
	};

	const generic = (type: TPageBlockType) => {
		const meta = BLOCK_CATALOG[type];
		const Icon = meta.icon;
		return (
			<LibraryItem
				key={type}
				icon={<Icon size={15} />}
				label={meta.label}
				description={meta.description}
				onAdd={() => addBlock(type)}
				makeBlock={() => createBlock(type)}
			/>
		);
	};

	return (
		<>
			<PanelSection title='Workflow inputs'>
				{interfaceLoading ? (
					<p className='text-[11px] text-zinc-400'>Reading the workflow…</p>
				) : fields.length === 0 ? (
					<p className='text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500'>
						This workflow asks for nothing. Add Input steps to it to collect values here.
					</p>
				) : (
					<div className='space-y-1.5'>
						{fields.map((field) => {
							const placed = placedFields.has(field.key);
							return (
								<LibraryItem
									key={field.key}
									icon={<TextCursorInput size={15} />}
									label={field.label || field.key}
									description={`${field.type}${field.required ? ' · required' : ''}`}
									muted={placed}
									onAdd={() => addAfterSelection(createBlock('field', { field_key: field.key }))}
									makeBlock={() => createBlock('field', { field_key: field.key })}
									trailing={
										placed ? (
											<Check size={14} className='shrink-0 text-emerald-500' aria-label='On the page' />
										) : field.required ? (
											<span className='shrink-0 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'>
												Needed
											</span>
										) : null
									}
								/>
							);
						})}
					</div>
				)}
			</PanelSection>

			<PanelSection title='Workflow outputs'>
				{interfaceLoading ? null : outputs.length === 0 ? (
					<p className='text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500'>
						This workflow returns nothing yet. Add Output steps to it to show its result here.
					</p>
				) : (
					<div className='space-y-1.5'>
						{outputs.map(({ name }) => (
							<LibraryItem
								key={name}
								icon={<LogOut size={15} />}
								label={humanize(name)}
								description={name}
								muted={placedOutputs.has(name)}
								onAdd={() => addAfterSelection(createBlock('output', { output_name: name }))}
								makeBlock={() => createBlock('output', { output_name: name })}
								trailing={
									placedOutputs.has(name) ? (
										<Check size={14} className='shrink-0 text-emerald-500' aria-label='On the page' />
									) : null
								}
							/>
						))}
					</div>
				)}
			</PanelSection>

			<PanelSection title='Run'>
				<div className='space-y-1.5'>{(['submit', 'status'] as const).map(generic)}</div>
			</PanelSection>

			<PanelSection title='Content'>
				<div className='space-y-1.5'>
					{(['heading', 'text', 'image', 'callout', 'divider', 'spacer'] as const).map(generic)}
				</div>
			</PanelSection>
		</>
	);
};

const LayersTab = () => {
	const { fields, page } = usePageBuilder();
	const blocks = usePageBuilderStore(selectBlocks);
	const selectedId = usePageBuilderStore((store) => store.selectedId);
	const select = usePageBuilderStore((store) => store.select);
	const moveBlock = usePageBuilderStore((store) => store.moveBlock);
	const removeBlock = usePageBuilderStore((store) => store.removeBlock);
	const [over, setOver] = useState<{ index: number } | null>(null);
	const flagged = new Map(page.issues.filter((issue) => issue.block_id).map((issue) => [issue.block_id, issue.severity]));

	if (blocks.length === 0) {
		return (
			<PanelSection>
				<p className='text-[11px] text-zinc-400'>The page is empty. Add blocks from the Add tab.</p>
			</PanelSection>
		);
	}

	return (
		<ol className='space-y-0.5 p-2' aria-label='Blocks on the page'>
			{blocks.map((block, index) => {
				const meta = BLOCK_CATALOG[block.type];
				const Icon = meta.icon;
				const selected = block.id === selectedId;
				const flag = flagged.get(block.id);
				return (
					<li
						key={block.id}
						draggable
						onDragStart={(event) => startDrag(event, { kind: 'move', id: block.id })}
						onDragEnd={() => {
							endDrag();
							setOver(null);
						}}
						onDragOver={(event) => {
							if (usePageBuilderStore.getState().dragging?.kind !== 'move') return;
							event.preventDefault();
							const rect = event.currentTarget.getBoundingClientRect();
							setOver({ index: event.clientY < rect.top + rect.height / 2 ? index : index + 1 });
						}}
						onDrop={(event) => {
							event.preventDefault();
							const dragging = usePageBuilderStore.getState().dragging;
							if (dragging?.kind === 'move' && over) moveBlock(dragging.id, over.index);
							endDrag();
							setOver(null);
						}}
						className='relative'>
						{over?.index === index && <span className='bg-primary-500 absolute inset-x-1 -top-px h-0.5 rounded-full' />}
						{over?.index === index + 1 && index === blocks.length - 1 && (
							<span className='bg-primary-500 absolute inset-x-1 -bottom-px h-0.5 rounded-full' />
						)}
						<div
							className={`group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition ${
								selected
									? 'bg-primary-100/80 text-primary-900 dark:bg-primary-400/15 dark:text-primary-100'
									: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.05]'
							}`}>
							<GripVertical size={13} className='shrink-0 cursor-grab text-zinc-300 dark:text-zinc-600' />
							<button
								type='button'
								onClick={() => select(block.id)}
								className='flex min-w-0 flex-1 items-center gap-2 text-left'>
								<Icon size={14} className='shrink-0 opacity-70' />
								<span className='min-w-0 flex-1'>
									<span className='block truncate text-xs font-semibold'>{blockSummary(block, fields)}</span>
									<span className='block text-[10px] opacity-60'>
										{meta.label}
										{block.width !== 'full' && ` · ${block.width.replace('_', ' ')}`}
									</span>
								</span>
								{flag && (
									<span
										className={`size-2 shrink-0 rounded-full ${flag === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`}
										aria-label='Needs attention'
									/>
								)}
							</button>
							<button
								type='button'
								onClick={() => removeBlock(block.id)}
								aria-label={`Remove ${meta.label}`}
								className='rounded p-1 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 dark:hover:bg-rose-500/10'>
								<Trash2 size={12} />
							</button>
						</div>
					</li>
				);
			})}
		</ol>
	);
};

const ACCENTS = ['#4f46e5', '#2563eb', '#0891b2', '#059669', '#65a30d', '#d97706', '#dc2626', '#db2777', '#7c3aed', '#18181b'];

const ThemeTab = () => {
	const theme = usePageBuilderStore((store) => store.content?.theme);
	const updateTheme = usePageBuilderStore((store) => store.updateTheme);
	if (!theme) return null;
	const set = <K extends keyof TPageTheme>(key: K, value: TPageTheme[K], coalesce?: boolean) =>
		updateTheme({ [key]: value } as Partial<TPageTheme>, coalesce ? key : undefined);

	return (
		<>
			<PanelSection title='Colour'>
				<div className='grid grid-cols-5 gap-2'>
					{ACCENTS.map((accent) => (
						<button
							key={accent}
							type='button'
							aria-label={`Accent ${accent}`}
							aria-pressed={theme.accent === accent}
							onClick={() => set('accent', accent)}
							style={{ backgroundColor: accent }}
							className={`flex h-8 items-center justify-center rounded-lg transition hover:scale-105 ${
								theme.accent === accent ? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950' : ''
							}`}>
							{theme.accent === accent && <Check size={14} className='text-white mix-blend-difference' />}
						</button>
					))}
				</div>
				<label className='flex items-center gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300'>
					<input
						type='color'
						value={theme.accent}
						onChange={(e) => set('accent', e.target.value, true)}
						className='h-7 w-10 cursor-pointer rounded border border-zinc-200 bg-transparent dark:border-white/10'
					/>
					Custom <span className='font-mono text-zinc-400'>{theme.accent}</span>
				</label>
			</PanelSection>

			<PanelSection title='Look'>
				<Segmented
					label='Appearance'
					value={theme.appearance}
					onChange={(value) => set('appearance', value)}
					options={[
						{ value: 'light', label: 'Light' },
						{ value: 'dark', label: 'Dark' },
						{ value: 'auto', label: 'System' },
					]}
				/>
				<Segmented
					label='Background'
					value={theme.background}
					onChange={(value) => set('background', value)}
					options={[
						{ value: 'soft', label: 'Soft' },
						{ value: 'plain', label: 'Plain' },
						{ value: 'dots', label: 'Dots' },
						{ value: 'gradient', label: 'Glow' },
					]}
				/>
				<Segmented
					label='Corners'
					value={theme.radius}
					onChange={(value) => set('radius', value)}
					options={[
						{ value: 'none', label: '0' },
						{ value: 'sm', label: 'S' },
						{ value: 'md', label: 'M' },
						{ value: 'lg', label: 'L' },
						{ value: 'xl', label: 'XL' },
					]}
				/>
				<Segmented
					label='Font'
					value={theme.font}
					onChange={(value) => set('font', value)}
					options={[
						{ value: 'sans', label: 'Sans' },
						{ value: 'serif', label: <span className='font-serif'>Serif</span> },
						{ value: 'mono', label: <span className='font-mono'>Mono</span> },
					]}
				/>
				<Segmented
					label='Page width'
					value={theme.width}
					onChange={(value) => set('width', value)}
					options={[
						{ value: 'narrow', label: 'Narrow' },
						{ value: 'medium', label: 'Medium' },
						{ value: 'wide', label: 'Wide' },
					]}
				/>
			</PanelSection>

			<PanelSection title='Branding'>
				<PanelText
					label='Logo'
					type='url'
					value={theme.logo_url}
					placeholder='https://…/logo.png'
					onChange={(value) => set('logo_url', value || null, true)}
				/>
				<PanelText
					label='Cover image'
					type='url'
					value={theme.cover_url}
					placeholder='https://…/cover.jpg'
					hint='A wide banner across the top of the page.'
					onChange={(value) => set('cover_url', value || null, true)}
				/>
				<Toggle
					label='Show “Made with Agent1o1”'
					checked={theme.show_branding}
					onChange={(value) => set('show_branding', value)}
				/>
			</PanelSection>
		</>
	);
};

const LeftPanel = () => {
	const tab = usePageBuilderStore((store) => store.leftTab);
	const setTab = usePageBuilderStore((store) => store.setLeftTab);

	return (
		<aside className='flex h-full min-h-0 flex-col border-r border-zinc-200 bg-zinc-50/70 dark:border-white/10 dark:bg-zinc-950'>
			<div role='tablist' aria-label='Builder panels' className='flex shrink-0 gap-1 border-b border-zinc-200 p-2 dark:border-white/10'>
				{TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type='button'
						role='tab'
						aria-selected={tab === id}
						onClick={() => setTab(id)}
						className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
							tab === id
								? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-white dark:ring-white/10'
								: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
						}`}>
						<Icon size={13} />
						{label}
					</button>
				))}
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto'>
				{tab === 'add' ? <AddTab /> : tab === 'layers' ? <LayersTab /> : <ThemeTab />}
			</div>
		</aside>
	);
};

export default LeftPanel;
