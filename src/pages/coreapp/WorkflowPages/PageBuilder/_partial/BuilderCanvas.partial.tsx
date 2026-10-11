import { useEffect, useMemo, useRef } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Copy, Eye, GripVertical, MousePointerClick, Plus, Trash2 } from 'lucide-react';
import PageRenderer, { type TRenderBlock } from '@/components/workflowPage/PageRenderer';
import { usePageRun, type TPageTransport } from '@/components/workflowPage/usePageRun';
import { WorkflowPageService, workflowPageKeys } from '@/api/modules/workflow-pages';
import { BLOCK_CATALOG, resolveBlocks } from '../_helper/blockCatalog.helper';
import { selectBlocks, usePageBuilderStore, type TBuilderDevice, type TDropTarget } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { endDrag, startDrag } from './LeftPanel.partial';
import IssuesChip from './IssuesChip.partial';

const DEVICE_WIDTH: Record<TBuilderDevice, number | null> = {
	desktop: null,
	tablet: 820,
	mobile: 390,
};

/** Where a drop lands: the target's index, plus one when it goes after it. */
const dropIndex = (blocks: TRenderBlock[], target: TDropTarget) => {
	if (target.id === '__end') return blocks.length;
	const index = blocks.findIndex((block) => block.id === target.id);
	return 'side' in target && target.side === 'after' ? index + 1 : index;
};

const applyDrop = (blocks: TRenderBlock[]) => {
	const { dragging, dropTarget, insertBlock, moveBlock } = usePageBuilderStore.getState();
	if (dragging && dropTarget) {
		const index = dropIndex(blocks, dropTarget);
		if (dragging.kind === 'new') insertBlock(dragging.block, index);
		else moveBlock(dragging.id, index);
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

const BlockFrame = ({ block, blocks, children }: { block: TRenderBlock; blocks: TRenderBlock[]; children: ReactNode }) => {
	const { page } = usePageBuilder();
	const ref = useRef<HTMLDivElement>(null);
	const selected = usePageBuilderStore((store) => store.selectedId === block.id);
	const dropTarget = usePageBuilderStore((store) => (store.dropTarget?.id === block.id ? store.dropTarget : null));
	const isDragged = usePageBuilderStore((store) => store.dragging?.kind === 'move' && store.dragging.id === block.id);
	const store = usePageBuilderStore.getState;
	const issue = page.issues.find((item) => item.block_id === block.id);
	const meta = BLOCK_CATALOG[block.type];

	useEffect(() => {
		if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [selected]);

	const onDragOver = (event: DragEvent) => {
		if (!store().dragging) return;
		event.preventDefault();
		event.stopPropagation();
		const rect = event.currentTarget.getBoundingClientRect();
		const horizontal = block.width !== 'full';
		const before = horizontal
			? event.clientX < rect.left + rect.width / 2
			: event.clientY < rect.top + rect.height / 2;
		const side = before ? 'before' : 'after';
		const current = store().dropTarget;
		if (!current || current.id !== block.id || !('side' in current) || current.side !== side) {
			store().setDropTarget({ id: block.id, side, axis: horizontal ? 'x' : 'y' });
		}
	};

	const indicator =
		dropTarget && 'side' in dropTarget
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
			draggable
			onDragStart={(event) => {
				event.stopPropagation();
				startDrag(event, { kind: 'move', id: block.id });
			}}
			onDragEnd={endDrag}
			onDragOver={onDragOver}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				applyDrop(blocks);
			}}
			onClick={(event) => {
				event.stopPropagation();
				store().select(block.id);
			}}
			className={`group/block relative cursor-pointer rounded-md transition-opacity ${isDragged ? 'opacity-40' : ''}`}>
			{children}
			{/* Takes the clicks, so the form controls underneath can't be typed into. */}
			<span aria-hidden className='absolute inset-0 z-10' />
			<span
				aria-hidden
				className={`pointer-events-none absolute -inset-2 z-10 rounded-lg transition ${
					selected
						? 'ring-primary-500 ring-2'
						: issue
							? issue.severity === 'error'
								? 'ring-1 ring-rose-400/70'
								: 'ring-1 ring-amber-400/70'
							: 'group-hover/block:ring-primary-400/60 ring-0 group-hover/block:ring-1'
				}`}
			/>
			{indicator && <span aria-hidden className={`bg-primary-500 absolute z-30 rounded-full shadow ${indicator}`} />}
			<span
				className={`absolute -top-5 left-0 z-20 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition ${
					selected ? 'bg-primary-500 opacity-100' : 'bg-zinc-800/85 opacity-0 group-hover/block:opacity-100'
				}`}>
				<GripVertical size={10} className='cursor-grab' />
				{meta.label}
			</span>
			{selected && (
				<div className='absolute -top-6 right-0 z-20 flex items-center gap-0.5 rounded-lg bg-zinc-900 p-0.5 text-white shadow-lg dark:bg-zinc-800'>
					<ToolbarButton label='Move up' onClick={() => store().nudgeBlock(block.id, -1)}>
						<ArrowUp size={12} />
					</ToolbarButton>
					<ToolbarButton label='Move down' onClick={() => store().nudgeBlock(block.id, 1)}>
						<ArrowDown size={12} />
					</ToolbarButton>
					<ToolbarButton label='Duplicate' onClick={() => store().duplicateBlock(block.id)}>
						<Copy size={12} />
					</ToolbarButton>
					<ToolbarButton label='Delete' danger onClick={() => store().removeBlock(block.id)}>
						<Trash2 size={12} />
					</ToolbarButton>
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

const EndDropZone = ({ blocks, empty }: { blocks: TRenderBlock[]; empty?: boolean }) => {
	const active = usePageBuilderStore((store) => store.dropTarget?.id === '__end');
	const dragging = usePageBuilderStore((store) => !!store.dragging);
	const setLeftTab = usePageBuilderStore((store) => store.setLeftTab);

	return (
		<div
			onDragOver={(event) => {
				if (!usePageBuilderStore.getState().dragging) return;
				event.preventDefault();
				event.stopPropagation();
				if (!active) usePageBuilderStore.getState().setDropTarget({ id: '__end' });
			}}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				applyDrop(blocks);
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
			submit: (input) => WorkflowPageService.submit(ws, page.id, input, true).then((result) => ({ result })),
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
			blocks={blocks.filter((block) => block.type !== 'field' || block.field)}
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
				<div className='border-primary-500/30 bg-primary-50 text-primary-900 dark:bg-primary-400/10 dark:text-primary-100 flex shrink-0 items-center justify-center gap-3 border-b px-4 py-2 text-xs font-semibold'>
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
								wrapBlock={(block, content) => (
									<BlockFrame block={block} blocks={blocks}>
										{content}
									</BlockFrame>
								)}
								empty={<EndDropZone blocks={blocks} empty />}
								after={blocks.length > 0 ? <EndDropZone blocks={blocks} /> : undefined}
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
