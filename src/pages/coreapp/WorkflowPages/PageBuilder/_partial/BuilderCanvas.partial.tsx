import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Copy, Eye, GripVertical, MessageSquare, MousePointerClick, Plus, Trash2 } from 'lucide-react';
import PageRenderer, { type TRenderBlock } from '@/components/workflowPage/PageRenderer';
import { usePageRun, type TPageTransport } from '@/components/workflowPage/usePageRun';
import { WorkflowPageService, useWorkflowPageComments, workflowPageKeys } from '@/api/modules/workflow-pages';
import InlineEditor, { INLINE_EDITABLE } from './InlineEditor.partial';
import type { TPageBlock, TPageBlockType, TPageBlockWidth } from '@/types/workflow-page.type';
import { BLOCK_CATALOG, resolveBlocks, withoutUnboundFields } from '../_helper/blockCatalog.helper';
import { findBlock, findPlace, fitsIn, isContainer, isWithin } from '../_helper/blockTree.helper';
import {
	placeForDrop,
	selectBlocks,
	usePageBuilderStore,
	type TBuilderDevice,
} from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { endDrag, startDrag } from './LeftPanel.partial';
import IssuesChip from './IssuesChip.partial';

const DEVICE_WIDTH: Record<TBuilderDevice, number | null> = {
	desktop: null,
	tablet: 820,
	mobile: 390,
};

/** The type of what is being dragged, and its id when it's already on the page. */
const dragged = (): { type: TPageBlockType; id: string | null } | null => {
	const { dragging, content } = usePageBuilderStore.getState();
	if (!dragging || !content) return null;
	if (dragging.kind === 'new') return { type: dragging.block.type, id: null };
	const block = findBlock(content.blocks, dragging.id);
	return block ? { type: block.type, id: block.id } : null;
};

/** Whether the dragged block may land in `parent` (null for the page), and not inside itself. */
const canDropInto = (parent: TPageBlock | null) => {
	const what = dragged();
	const blocks = usePageBuilderStore.getState().content?.blocks ?? [];
	if (!what || !fitsIn(what.type, parent?.type ?? null)) return false;
	return !(what.id && parent && isWithin(blocks, parent.id, what.id));
};

const applyDrop = () => {
	const { dragging, dropTarget, content, insertBlock, moveBlock } = usePageBuilderStore.getState();
	const place = content && dropTarget ? placeForDrop(content.blocks, dropTarget) : null;
	if (dragging && place) {
		const parent = place.parentId ? findBlock(content!.blocks, place.parentId) : null;
		if (dragging.kind === 'new') {
			if (fitsIn(dragging.block.type, parent?.type ?? null)) insertBlock(dragging.block, place);
		} else {
			moveBlock(dragging.id, place);
		}
	}
	endDrag();
};

const ToolbarButton = ({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) => (
	<button
		type='button'
		aria-label={label}
		title={label}
		onClick={(event) => {
			event.stopPropagation();
			onClick();
		}}
		className={`flex size-6 items-center justify-center rounded-md transition ${
			danger ? 'hover:bg-rose-500 hover:text-white' : 'hover:bg-white/20'
		}`}>
		{children}
	</button>
);

const SNAPS: { span: number; width: TPageBlockWidth; label: string }[] = [
	{ span: 2, width: 'third', label: '1/3' },
	{ span: 3, width: 'half', label: '1/2' },
	{ span: 4, width: 'two_thirds', label: '2/3' },
	{ span: 6, width: 'full', label: 'Full' },
];

/**
 * The handle on a selected block's right edge: drag to set its width.
 * While dragging, guides mark the widths it snaps to (measured from where
 * the block starts on the page's six-column grid) and an outline shows
 * the width it will take.
 */
const ResizeHandle = ({ block, frame }: { block: TRenderBlock; frame: React.RefObject<HTMLDivElement | null> }) => {
	const [drag, setDrag] = useState<{ grid: number; room: number; snap: (typeof SNAPS)[number] } | null>(null);

	const snapFor = (offset: number, grid: number, room: number) => {
		const allowed = SNAPS.filter((snap) => (snap.span / 6) * grid <= room + 2);
		return allowed.reduce((best, snap) =>
			Math.abs((snap.span / 6) * grid - offset) < Math.abs((best.span / 6) * grid - offset) ? snap : best,
		);
	};

	return (
		<>
			<span
				role='separator'
				aria-label='Drag to change the width'
				title='Drag to change the width'
				onClick={(event) => event.stopPropagation()}
				onPointerDown={(event) => {
					event.preventDefault();
					event.stopPropagation();
					const cell = frame.current?.parentElement;
					const gridElement = cell?.parentElement;
					if (!cell || !gridElement) return;
					const grid = gridElement.getBoundingClientRect();
					const left = cell.getBoundingClientRect().left;
					const room = grid.right - left;
					(event.target as HTMLElement).setPointerCapture(event.pointerId);
					setDrag({ grid: grid.width, room, snap: snapFor(event.clientX - left, grid.width, room) });
					const onMove = (move: PointerEvent) =>
						setDrag({ grid: grid.width, room, snap: snapFor(move.clientX - left, grid.width, room) });
					const onUp = (up: PointerEvent) => {
						window.removeEventListener('pointermove', onMove);
						window.removeEventListener('pointerup', onUp);
						const snap = snapFor(up.clientX - left, grid.width, room);
						if (snap.width !== block.width) usePageBuilderStore.getState().updateBlock(block.id, { width: snap.width });
						setDrag(null);
					};
					window.addEventListener('pointermove', onMove);
					window.addEventListener('pointerup', onUp);
				}}
				className='bg-primary-500 absolute top-1/2 -right-3 z-30 h-8 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full shadow ring-2 ring-white dark:ring-zinc-900'
			/>
			{drag && (
				<span aria-hidden className='pointer-events-none absolute -inset-y-4 left-0 z-30'>
					{SNAPS.filter((snap) => (snap.span / 6) * drag.grid <= drag.room + 2).map((snap) => (
						<span
							key={snap.span}
							className={`absolute top-0 bottom-0 w-px ${snap === drag.snap ? 'bg-primary-500' : 'bg-primary-400/40 border-dashed'}`}
							style={{ left: (snap.span / 6) * drag.grid - 1 }}>
							<span
								className={`absolute -top-5 -translate-x-1/2 rounded px-1 text-[9px] font-bold ${
									snap === drag.snap ? 'bg-primary-500 text-white' : 'bg-white/90 text-zinc-500 dark:bg-zinc-900/90'
								}`}>
								{snap.label}
							</span>
						</span>
					))}
					<span
						className='border-primary-500 bg-primary-500/5 absolute top-4 bottom-4 left-0 rounded-md border-2 border-dashed'
						style={{ width: (drag.snap.span / 6) * drag.grid - 16 }}
					/>
				</span>
			)}
		</>
	);
};

/** Open threads on a block, as a bubble that opens them. */
const CommentBadge = ({ block }: { block: TRenderBlock }) => {
	const { ws, page } = usePageBuilder();
	const { data: comments } = useWorkflowPageComments(ws, page.id);
	const count = (comments ?? []).filter((thread) => thread.block_id === block.id && !thread.resolved_at).length;
	if (count === 0) return null;
	return (
		<button
			type='button'
			aria-label={`${count} open comment${count === 1 ? '' : 's'}`}
			title='Open comments'
			onClick={(event) => {
				event.stopPropagation();
				const store = usePageBuilderStore.getState();
				store.select(block.id, { keepTab: true });
				store.setRightTab('comments');
			}}
			className='absolute -bottom-3 -left-3 z-30 flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full rounded-tl-none bg-amber-400 px-1 text-[10px] font-black text-amber-950 shadow ring-2 ring-white dark:ring-zinc-900'>
			<MessageSquare size={9} className='fill-current' />
			{count}
		</button>
	);
};

const BlockFrame = ({ block, children }: { block: TRenderBlock; children: ReactNode }) => {
	const { page } = usePageBuilder();
	const ref = useRef<HTMLDivElement>(null);
	const selected = usePageBuilderStore((store) => store.selectedIds.includes(block.id));
	const primary = usePageBuilderStore((store) => store.selectedId === block.id && store.selectedIds.length <= 1);
	const editing = usePageBuilderStore((store) => store.editingId === block.id);
	const inColumn = usePageBuilderStore((store) =>
		store.content ? findPlace(store.content.blocks, block.id)?.parent?.type === 'column' : false,
	);
	const dropTarget = usePageBuilderStore((store) =>
		store.dropTarget?.kind === 'beside' && store.dropTarget.id === block.id ? store.dropTarget : null,
	);
	const isDragged = usePageBuilderStore((store) => store.dragging?.kind === 'move' && store.dragging.id === block.id);
	const store = usePageBuilderStore.getState;
	const issue = page.issues.find((item) => item.block_id === block.id);
	const meta = BLOCK_CATALOG[block.type];
	const container = isContainer(block);
	const isColumn = block.type === 'column';

	useEffect(() => {
		if (primary) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [primary]);

	const onDragOver = (event: DragEvent) => {
		const what = dragged();
		if (!what) return;
		const blocks = store().content?.blocks ?? [];
		if (what.id && isWithin(blocks, block.id, what.id)) {
			event.stopPropagation();
			if (store().dropTarget) store().setDropTarget(null);
			return;
		}
		const place = findPlace(blocks, block.id);
		// Not allowed beside this block: let the container around it take the drop.
		if (!place || !canDropInto(place.parent)) return;
		event.preventDefault();
		event.stopPropagation();
		const rect = event.currentTarget.getBoundingClientRect();
		const horizontal = isColumn || (block.width !== 'full' && place.parent?.type !== 'column');
		const before = horizontal
			? event.clientX < rect.left + rect.width / 2
			: event.clientY < rect.top + rect.height / 2;
		const side = before ? 'before' : 'after';
		const current = store().dropTarget;
		if (current?.kind !== 'beside' || current.id !== block.id || current.side !== side) {
			store().setDropTarget({ kind: 'beside', id: block.id, side, axis: horizontal ? 'x' : 'y' });
		}
	};

	const indicator = dropTarget
		? dropTarget.axis === 'y'
			? dropTarget.side === 'before'
				? '-top-3 inset-x-0 h-1'
				: '-bottom-3 inset-x-0 h-1'
			: dropTarget.side === 'before'
				? '-left-2.5 inset-y-0 w-1'
				: '-right-2.5 inset-y-0 w-1'
		: null;

	return (
		<div
			ref={ref}
			draggable={!isColumn}
			onDragStart={(event) => {
				event.stopPropagation();
				startDrag(event, { kind: 'move', id: block.id });
			}}
			onDragEnd={endDrag}
			onDragOver={onDragOver}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				applyDrop();
			}}
			onClick={(event) => {
				event.stopPropagation();
				if (editing) return;
				store().select(block.id, { additive: event.shiftKey || event.metaKey || event.ctrlKey, keepTab: store().rightTab === 'comments' });
			}}
			onDoubleClick={(event) => {
				if (!INLINE_EDITABLE.has(block.type)) return;
				event.stopPropagation();
				store().select(block.id);
				store().setEditing(block.id);
			}}
			className={`${container ? 'group/container' : 'group/block'} relative cursor-pointer rounded-md transition-opacity ${isColumn ? 'h-full min-h-16' : ''} ${isDragged ? 'opacity-40' : ''}`}>
			{editing ? <InlineEditor block={block} /> : children}
			{/* Takes the clicks, so form controls can't be typed into; containers let them through to their blocks. */}
			{!container && !editing && <span aria-hidden className='absolute inset-0 z-10' />}
			<CommentBadge block={block} />
			{primary && !editing && !container && !inColumn && <ResizeHandle block={block} frame={ref} />}
			<span
				aria-hidden
				className={`pointer-events-none absolute z-10 rounded-lg transition ${container ? '-inset-1' : '-inset-2'} ${
					selected
						? 'ring-primary-500 ring-2'
						: issue
							? issue.severity === 'error'
								? 'ring-1 ring-rose-400/70'
								: 'ring-1 ring-amber-400/70'
							: container
								? 'ring-0 group-hover/container:ring-1 group-hover/container:ring-zinc-400/50'
								: 'group-hover/block:ring-primary-400/60 ring-0 group-hover/block:ring-1'
				}`}
			/>
			{indicator && <span aria-hidden className={`bg-primary-500 absolute z-30 rounded-full shadow ${indicator}`} />}
			<span
				className={`absolute -top-5 left-0 z-20 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition ${
					selected
						? 'bg-primary-500 opacity-100'
						: container
							? 'pointer-events-none opacity-0'
							: 'bg-zinc-800/85 opacity-0 group-hover/block:opacity-100'
				}`}>
				{!isColumn && <GripVertical size={10} className='cursor-grab' />}
				{meta.label}
			</span>
			{primary && !editing && (
				<div className='absolute -top-6 right-0 z-20 flex items-center gap-0.5 rounded-lg bg-zinc-900 p-0.5 text-white shadow-lg dark:bg-zinc-800'>
					<ToolbarButton label={isColumn ? 'Move left' : 'Move up'} onClick={() => store().nudgeBlock(block.id, -1)}>
						<ArrowUp size={12} className={isColumn ? '-rotate-90' : ''} />
					</ToolbarButton>
					<ToolbarButton label={isColumn ? 'Move right' : 'Move down'} onClick={() => store().nudgeBlock(block.id, 1)}>
						<ArrowDown size={12} className={isColumn ? '-rotate-90' : ''} />
					</ToolbarButton>
					{!isColumn && (
						<>
							<ToolbarButton label='Duplicate' onClick={() => store().duplicateBlock(block.id)}>
								<Copy size={12} />
							</ToolbarButton>
							<ToolbarButton label='Delete' danger onClick={() => store().removeBlock(block.id)}>
								<Trash2 size={12} />
							</ToolbarButton>
						</>
					)}
				</div>
			)}
			{issue && !selected && (
				<span
					className={`absolute -top-2 -right-2 z-20 size-3 rounded-full border-2 border-white ${
						issue.severity === 'error' ? 'bg-rose-500' : 'bg-amber-500'
					}`}
					title={issue.message}
				/>
			)}
		</div>
	);
};

/** The end of a section or column: a drop zone while dragging, a prompt while empty. */
const ContainerEnd = ({ container }: { container: TPageBlock }) => {
	const active = usePageBuilderStore(
		(store) => store.dropTarget?.kind === 'end' && store.dropTarget.parentId === container.id,
	);
	const dragging = usePageBuilderStore((store) => !!store.dragging);
	const empty = isContainer(container) && container.children.length === 0;
	if (!empty && !dragging) return null;

	return (
		<div
			onDragOver={(event) => {
				if (!canDropInto(container)) return;
				event.preventDefault();
				event.stopPropagation();
				if (!active) usePageBuilderStore.getState().setDropTarget({ kind: 'end', parentId: container.id });
			}}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				applyDrop();
			}}
			className={`relative z-20 flex items-center justify-center rounded-lg border-2 border-dashed text-[11px] font-semibold transition ${
				empty ? 'min-h-20 p-3' : 'min-h-10 p-2'
			} ${active ? 'border-primary-500 bg-primary-500/10 text-primary-700' : 'border-zinc-300/80 text-zinc-400'}`}>
			{dragging ? (
				'Drop here'
			) : (
				<button
					type='button'
					onClick={(event) => {
						event.stopPropagation();
						const store = usePageBuilderStore.getState();
						store.select(container.id);
						store.setLeftTab('add');
					}}
					className='flex items-center gap-1.5'>
					<Plus size={13} /> Drop blocks here or add one
				</button>
			)}
		</div>
	);
};

const EndDropZone = ({ empty }: { empty?: boolean }) => {
	const active = usePageBuilderStore((store) => store.dropTarget?.kind === 'end' && store.dropTarget.parentId === null);
	const dragging = usePageBuilderStore((store) => !!store.dragging);
	const setLeftTab = usePageBuilderStore((store) => store.setLeftTab);

	return (
		<div
			onDragOver={(event) => {
				if (!canDropInto(null)) return;
				event.preventDefault();
				event.stopPropagation();
				if (!active) usePageBuilderStore.getState().setDropTarget({ kind: 'end', parentId: null });
			}}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				applyDrop();
			}}
			className={`col-span-6 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition ${
				empty ? 'min-h-[220px] p-8' : dragging ? 'min-h-16 p-3' : 'min-h-12 p-2 opacity-0 hover:opacity-100'
			} ${
				active
					? 'border-primary-500 bg-primary-500/10 text-primary-700'
					: 'border-zinc-300/70 text-zinc-400'
			}`}>
			{empty ? (
				<>
					<MousePointerClick size={26} />
					<p className='text-sm font-bold text-zinc-600'>Build your page</p>
					<p className='max-w-xs text-xs'>
						Drag blocks here from the library, or click one to add it. Start with the workflow’s inputs and a Run button.
					</p>
				</>
			) : (
				<button
					type='button'
					onClick={(event) => {
						event.stopPropagation();
						usePageBuilderStore.getState().select(null);
						setLeftTab('add');
					}}
					className='flex items-center gap-1.5 text-xs font-semibold'>
					<Plus size={13} /> {dragging ? 'Drop here' : 'Add a block'}
				</button>
			)}
		</div>
	);
};

const PreviewSurface = ({ blocks }: { blocks: TRenderBlock[] }) => {
	const { ws, page, fields } = usePageBuilder();
	const theme = usePageBuilderStore((store) => store.content?.theme);
	const qc = useQueryClient();

	const transport = useMemo<TPageTransport>(
		() => ({
			submit: (input) =>
				WorkflowPageService.submit(ws, page.id, input, true, usePageBuilderStore.getState().variant).then((result) => ({ result })),
			poll: (id, _secret, signal) => WorkflowPageService.submission(ws, page.id, id, signal),
		}),
		[ws, page.id],
	);
	const run = usePageRun(fields, transport);

	useEffect(() => {
		if (run.phase === 'done') qc.invalidateQueries({ queryKey: workflowPageKeys.submissions(ws, page.id) });
	}, [run.phase, qc, ws, page.id]);

	if (!theme) return null;
	return (
		<PageRenderer
			theme={theme}
			blocks={withoutUnboundFields(blocks)}
			mode='live'
			run={run}
			fill
		/>
	);
};

const BuilderCanvas = () => {
	const { fields } = usePageBuilder();
	const rawBlocks = usePageBuilderStore(selectBlocks);
	const theme = usePageBuilderStore((store) => store.content?.theme);
	const device = usePageBuilderStore((store) => store.device);
	const mode = usePageBuilderStore((store) => store.mode);
	const setMode = usePageBuilderStore((store) => store.setMode);
	const select = usePageBuilderStore((store) => store.select);
	const setDropTarget = usePageBuilderStore((store) => store.setDropTarget);
	const blocks = useMemo(() => resolveBlocks(rawBlocks, fields), [rawBlocks, fields]);
	const width = DEVICE_WIDTH[device];

	if (!theme) return null;

	return (
		<div
			className='relative flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-100 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[#0b0c10] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'
			onClick={() => select(null)}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null);
			}}>
			{mode === 'preview' && (
				<div className='border-primary-500/30 bg-primary-50 text-primary-900 dark:bg-primary-400/10 dark:text-primary-200 flex shrink-0 items-center justify-center gap-3 border-b px-4 py-2 text-xs font-semibold'>
					<Eye size={14} />
					Preview. Runs use this draft and spend real credits.
					<button
						type='button'
						onClick={() => setMode('edit')}
						className='bg-primary-500 text-primary-950 rounded-md px-2 py-1 text-[11px] font-bold hover:brightness-110'>
						Back to editing
					</button>
				</div>
			)}
			<div className='min-h-0 flex-1 overflow-hidden p-4 sm:p-6'>
				<div
					className='mx-auto flex h-full flex-col overflow-hidden border border-zinc-300/80 bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.35)] transition-[width] duration-300 dark:border-white/10 dark:bg-zinc-950'
					style={{
						width: width ?? '100%',
						maxWidth: '100%',
						borderRadius: device === 'mobile' ? 32 : 14,
					}}>
					{device !== 'mobile' && (
						<div className='flex h-8 shrink-0 items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-3 dark:border-white/10 dark:bg-zinc-900'>
							<span className='size-2.5 rounded-full bg-rose-400/80' />
							<span className='size-2.5 rounded-full bg-amber-400/80' />
							<span className='size-2.5 rounded-full bg-emerald-400/80' />
						</div>
					)}
					<div className='min-h-0 flex-1 overflow-y-auto'>
						{mode === 'preview' ? (
							<PreviewSurface blocks={blocks} />
						) : (
							<PageRenderer
								theme={theme}
								blocks={blocks}
								mode='edit'
								fill
								wrapBlock={(block, content) => <BlockFrame block={block}>{content}</BlockFrame>}
								containerEnd={(container) => <ContainerEnd container={container} />}
								empty={<EndDropZone empty />}
								after={blocks.length > 0 ? <EndDropZone /> : undefined}
							/>
						)}
					</div>
				</div>
			</div>
			{mode === 'edit' && <IssuesChip />}
		</div>
	);
};

export default BuilderCanvas;
