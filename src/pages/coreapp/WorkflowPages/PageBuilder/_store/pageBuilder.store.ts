import { create } from 'zustand';
import type { TPageBlock, TPageBlockType, TPageContent, TPageTheme } from '@/types/workflow-page.type';
import { createBlock, newBlockId } from '../_helper/blockCatalog.helper';

export type TBuilderDevice = 'desktop' | 'tablet' | 'mobile';
export type TBuilderMode = 'edit' | 'preview';
export type TBuilderLeftTab = 'add' | 'layers' | 'theme';
export type TBuilderRightTab = 'design' | 'runs';
export type TSaveState = 'saved' | 'dirty' | 'saving' | 'error';

/** What is being dragged: a new block from the library, or one already on the page. */
export type TDragPayload =
	| { kind: 'new'; block: TPageBlock }
	| { kind: 'move'; id: string };

export type TDropTarget = { id: string; side: 'before' | 'after'; axis: 'x' | 'y' } | { id: '__end' };

const HISTORY_LIMIT = 100;
/** Edits to the same prop this close together undo as one step. */
const COALESCE_MS = 1000;

type TState = {
	pageId: string | null;
	content: TPageContent | null;
	past: TPageContent[];
	future: TPageContent[];
	lastEdit: { key: string; at: number } | null;
	/** Bumped on every content change; the autosave compares it to `savedRevision`. */
	revision: number;
	savedRevision: number;
	saveState: TSaveState;
	selectedId: string | null;
	device: TBuilderDevice;
	mode: TBuilderMode;
	leftTab: TBuilderLeftTab;
	rightTab: TBuilderRightTab;
	dragging: TDragPayload | null;
	dropTarget: TDropTarget | null;
};

type TActions = {
	load: (pageId: string, content: TPageContent) => void;
	change: (update: (content: TPageContent) => TPageContent, coalesceKey?: string) => void;
	undo: () => void;
	redo: () => void;
	select: (id: string | null) => void;
	insertBlock: (block: TPageBlock, index?: number) => void;
	addBlock: (type: TPageBlockType, props?: Record<string, unknown>) => void;
	moveBlock: (id: string, toIndex: number) => void;
	nudgeBlock: (id: string, by: -1 | 1) => void;
	updateBlock: (id: string, patch: { props?: Record<string, unknown>; width?: TPageBlock['width'] }, coalesceKey?: string) => void;
	removeBlock: (id: string) => void;
	duplicateBlock: (id: string) => void;
	updateTheme: (patch: Partial<TPageTheme>, coalesceKey?: string) => void;
	markSaving: () => void;
	markSaved: (revision: number) => void;
	markSaveFailed: () => void;
	setDevice: (device: TBuilderDevice) => void;
	setMode: (mode: TBuilderMode) => void;
	setLeftTab: (tab: TBuilderLeftTab) => void;
	setRightTab: (tab: TBuilderRightTab) => void;
	setDragging: (payload: TDragPayload | null) => void;
	setDropTarget: (target: TDropTarget | null) => void;
};

const initial: TState = {
	pageId: null,
	content: null,
	past: [],
	future: [],
	lastEdit: null,
	revision: 0,
	savedRevision: 0,
	saveState: 'saved',
	selectedId: null,
	device: 'desktop',
	mode: 'edit',
	leftTab: 'add',
	rightTab: 'design',
	dragging: null,
	dropTarget: null,
};

/**
 * The page builder's editing state: the draft content with undo history,
 * what is selected, and how the canvas is shown. The draft here is the
 * source of truth while the builder is open — the autosave sends it to the
 * server but never reads it back, so a save landing mid-edit can't undo
 * what was typed since.
 */
export const usePageBuilderStore = create<TState & TActions>()((set, get) => {
	const commit = (next: TPageContent, coalesceKey?: string) => {
		const { content, past, lastEdit, revision } = get();
		if (!content) return;
		const now = Date.now();
		const coalesce = !!coalesceKey && lastEdit?.key === coalesceKey && now - lastEdit.at < COALESCE_MS;
		set({
			content: next,
			past: coalesce ? past : [...past, content].slice(-HISTORY_LIMIT),
			future: [],
			lastEdit: coalesceKey ? { key: coalesceKey, at: now } : null,
			revision: revision + 1,
			saveState: 'dirty',
		});
	};

	const blocks = () => get().content?.blocks ?? [];

	return {
		...initial,

		load: (pageId, content) =>
			set({ ...initial, pageId, content, device: get().device, leftTab: get().leftTab }),

		change: (update, coalesceKey) => {
			const { content } = get();
			if (content) commit(update(content), coalesceKey);
		},

		undo: () => {
			const { past, content, future, revision } = get();
			if (!content || past.length === 0) return;
			const previous = past[past.length - 1];
			const stillThere = previous.blocks.some((block) => block.id === get().selectedId);
			set({
				content: previous,
				past: past.slice(0, -1),
				future: [content, ...future],
				lastEdit: null,
				revision: revision + 1,
				saveState: 'dirty',
				selectedId: stillThere ? get().selectedId : null,
			});
		},

		redo: () => {
			const { past, content, future, revision } = get();
			if (!content || future.length === 0) return;
			set({
				content: future[0],
				past: [...past, content],
				future: future.slice(1),
				lastEdit: null,
				revision: revision + 1,
				saveState: 'dirty',
			});
		},

		select: (id) => set({ selectedId: id, rightTab: 'design' }),

		insertBlock: (block, index) => {
			const list = blocks();
			const at = index ?? list.length;
			get().change((content) => ({
				...content,
				blocks: [...content.blocks.slice(0, at), block, ...content.blocks.slice(at)],
			}));
			set({ selectedId: block.id, rightTab: 'design' });
		},

		addBlock: (type, props) => {
			const list = blocks();
			const selected = list.findIndex((block) => block.id === get().selectedId);
			get().insertBlock(createBlock(type, props), selected >= 0 ? selected + 1 : list.length);
		},

		moveBlock: (id, toIndex) => {
			const list = blocks();
			const from = list.findIndex((block) => block.id === id);
			if (from < 0) return;
			const target = toIndex > from ? toIndex - 1 : toIndex;
			if (target === from) return;
			get().change((content) => {
				const next = [...content.blocks];
				const [moved] = next.splice(from, 1);
				next.splice(target, 0, moved);
				return { ...content, blocks: next };
			});
		},

		nudgeBlock: (id, by) => {
			const index = blocks().findIndex((block) => block.id === id);
			if (index < 0) return;
			const target = index + by;
			if (target < 0 || target >= blocks().length) return;
			get().moveBlock(id, by > 0 ? target + 1 : target);
		},

		updateBlock: (id, patch, coalesceKey) =>
			get().change(
				(content) => ({
					...content,
					blocks: content.blocks.map((block) =>
						block.id === id
							? ({
									...block,
									width: patch.width ?? block.width,
									props: { ...block.props, ...patch.props },
								} as TPageBlock)
							: block,
					),
				}),
				coalesceKey ? `${id}:${coalesceKey}` : undefined,
			),

		removeBlock: (id) => {
			const list = blocks();
			const index = list.findIndex((block) => block.id === id);
			if (index < 0) return;
			get().change((content) => ({ ...content, blocks: content.blocks.filter((block) => block.id !== id) }));
			const neighbour = list[index + 1] ?? list[index - 1];
			set({ selectedId: get().selectedId === id ? (neighbour?.id ?? null) : get().selectedId });
		},

		duplicateBlock: (id) => {
			const list = blocks();
			const index = list.findIndex((block) => block.id === id);
			if (index < 0) return;
			const copy = { ...list[index], id: newBlockId(), props: { ...list[index].props } } as TPageBlock;
			get().insertBlock(copy, index + 1);
		},

		updateTheme: (patch, coalesceKey) =>
			get().change(
				(content) => ({ ...content, theme: { ...content.theme, ...patch } }),
				coalesceKey ? `theme:${coalesceKey}` : undefined,
			),

		markSaving: () => set({ saveState: 'saving' }),
		markSaved: (revision) =>
			set({ savedRevision: revision, saveState: get().revision === revision ? 'saved' : 'dirty' }),
		markSaveFailed: () => set({ saveState: 'error' }),

		setDevice: (device) => set({ device }),
		setMode: (mode) => set({ mode, selectedId: mode === 'preview' ? null : get().selectedId }),
		setLeftTab: (leftTab) => set({ leftTab }),
		setRightTab: (rightTab) => set({ rightTab }),
		setDragging: (dragging) => set({ dragging, dropTarget: dragging ? get().dropTarget : null }),
		setDropTarget: (dropTarget) => set({ dropTarget }),
	};
});

const NO_BLOCKS: TPageBlock[] = [];

/** The draft's blocks, with a stable empty list before a page is loaded. */
export const selectBlocks = (state: TState) => state.content?.blocks ?? NO_BLOCKS;
