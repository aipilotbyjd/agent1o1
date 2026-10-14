import { create } from 'zustand';
import type {
	TPageBlock,
	TPageBlockType,
	TPageColumnLayout,
	TPageContent,
	TPageTheme,
	TPageVariant,
} from '@/types/workflow-page.type';
import { createBlock, newBlockId } from '../_helper/blockCatalog.helper';
import {
	cloneBlock,
	findBlock,
	findPlace,
	fitColumns,
	fitsIn,
	insertAt,
	isContainer,
	moveTo,
	removeById,
	updateById,
	type TBlockPlace,
} from '../_helper/blockTree.helper';

export type TBuilderDevice = 'desktop' | 'tablet' | 'mobile';
export type TBuilderMode = 'edit' | 'preview';
export type TBuilderLeftTab = 'add' | 'layers' | 'theme';
export type TBuilderRightTab = 'design' | 'comments' | 'history' | 'runs';
/** `conflict`: the draft changed somewhere else since it was loaded, so saving stopped. */
export type TSaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

/** What is being dragged: a new block from the library, or one already on the page. */
export type TDragPayload = { kind: 'new'; block: TPageBlock } | { kind: 'move'; id: string };

/** Beside a block in whatever holds it, or at the end of a container (null for the page). */
export type TDropTarget =
	| { kind: 'beside'; id: string; side: 'before' | 'after'; axis: 'x' | 'y' }
	| { kind: 'end'; parentId: string | null };

/**
 * Where a new block goes: inside the selected container when it fits
 * there, else right after the selection — or after the nearest container
 * around it that it may sit beside — else at the end of the page.
 */
export const placeForNew = (blocks: TPageBlock[], selectedId: string | null, type: TPageBlockType): TBlockPlace => {
	const selected = selectedId ? findBlock(blocks, selectedId) : undefined;
	if (selected && isContainer(selected) && fitsIn(type, selected.type)) {
		return { parentId: selected.id, index: selected.children.length };
	}
	let id = selectedId;
	while (id) {
		const place = findPlace(blocks, id);
		if (!place) break;
		if (fitsIn(type, place.parent?.type ?? null)) return { parentId: place.parent?.id ?? null, index: place.index + 1 };
		id = place.parent?.id ?? null;
	}
	return { parentId: null, index: blocks.length };
};

/** Where a drop lands, or null when the dragged block may not go there. */
export const placeForDrop = (blocks: TPageBlock[], target: TDropTarget): TBlockPlace | null => {
	if (target.kind === 'end') {
		if (target.parentId === null) return { parentId: null, index: blocks.length };
		const parent = findBlock(blocks, target.parentId);
		return parent && isContainer(parent) ? { parentId: parent.id, index: parent.children.length } : null;
	}
	const place = findPlace(blocks, target.id);
	if (!place) return null;
	return { parentId: place.parent?.id ?? null, index: place.index + (target.side === 'after' ? 1 : 0) };
};

const HISTORY_LIMIT = 100;
/** Edits to the same prop this close together undo as one step. */
const COALESCE_MS = 1000;

type TState = {
	pageId: string | null;
	/** Which version is being edited: the page, or version B of an A/B test. */
	variant: TPageVariant;
	content: TPageContent | null;
	past: TPageContent[];
	future: TPageContent[];
	lastEdit: { key: string; at: number } | null;
	/** Bumped on every content change; the autosave compares it to `savedRevision`. */
	revision: number;
	savedRevision: number;
	saveState: TSaveState;
	/** The server's `draft_revision` the draft on screen builds on. */
	baseRevision: number | null;
	/** The block the inspector shows: the last one picked. */
	selectedId: string | null;
	/** Every block picked — more than one with Shift or ⌘/Ctrl-click. */
	selectedIds: string[];
	/** The block whose text is being edited in place on the canvas. */
	editingId: string | null;
	/** The quick-add palette (`/`) or the shortcut sheet (`?`). */
	overlay: 'palette' | 'shortcuts' | null;
	device: TBuilderDevice;
	mode: TBuilderMode;
	leftTab: TBuilderLeftTab;
	rightTab: TBuilderRightTab;
	dragging: TDragPayload | null;
	dropTarget: TDropTarget | null;
};

type TActions = {
	load: (pageId: string, content: TPageContent, variant?: TPageVariant, baseRevision?: number | null) => void;
	change: (update: (content: TPageContent) => TPageContent, coalesceKey?: string) => void;
	undo: () => void;
	redo: () => void;
	/** `additive` adds or removes `id` from the selection; `keepTab` leaves the right panel where it is. */
	select: (id: string | null, options?: { additive?: boolean; keepTab?: boolean }) => void;
	setEditing: (id: string | null) => void;
	setOverlay: (overlay: 'palette' | 'shortcuts' | null) => void;
	insertBlocks: (blocks: TPageBlock[]) => void;
	removeBlocks: (ids: string[]) => void;
	duplicateBlocks: (ids: string[]) => void;
	wrapInSection: (ids: string[]) => void;
	insertBlock: (block: TPageBlock, place?: TBlockPlace) => void;
	addBlock: (type: TPageBlockType, props?: Record<string, unknown>) => void;
	moveBlock: (id: string, place: TBlockPlace) => void;
	setColumnsLayout: (id: string, layout: TPageColumnLayout) => void;
	nudgeBlock: (id: string, by: -1 | 1) => void;
	updateBlock: (id: string, patch: { props?: Record<string, unknown>; width?: TPageBlock['width'] }, coalesceKey?: string) => void;
	removeBlock: (id: string) => void;
	duplicateBlock: (id: string) => void;
	updateTheme: (patch: Partial<TPageTheme>, coalesceKey?: string) => void;
	markSaving: () => void;
	markSaved: (revision: number, baseRevision: number) => void;
	markConflict: () => void;
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
	variant: 'a',
	content: null,
	past: [],
	future: [],
	lastEdit: null,
	revision: 0,
	savedRevision: 0,
	saveState: 'saved',
	baseRevision: null,
	selectedId: null,
	selectedIds: [],
	editingId: null,
	overlay: null,
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

		load: (pageId, content, variant = 'a', baseRevision = null) =>
			set({
				...initial,
				pageId,
				content,
				variant,
				baseRevision,
				device: get().device,
				leftTab: get().leftTab,
				// Reloading the same page (a restore, another version) keeps the panel open where it was.
				rightTab: get().pageId === pageId ? get().rightTab : initial.rightTab,
			}),

		change: (update, coalesceKey) => {
			const { content } = get();
			if (content) commit(update(content), coalesceKey);
		},

		undo: () => {
			const { past, content, future, revision } = get();
			if (!content || past.length === 0) return;
			const previous = past[past.length - 1];
			const selectedId = get().selectedId;
			const stillThere = !!selectedId && !!findBlock(previous.blocks, selectedId);
			set({
				content: previous,
				past: past.slice(0, -1),
				future: [content, ...future],
				lastEdit: null,
				revision: revision + 1,
				saveState: 'dirty',
				selectedId: stillThere ? get().selectedId : null,
				selectedIds: get().selectedIds.filter((id) => !!findBlock(previous.blocks, id)),
				editingId: null,
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

		select: (id, options) => {
			const { selectedIds, rightTab } = get();
			const tab = options?.keepTab ? rightTab : rightTab === 'runs' || rightTab === 'history' ? 'design' : rightTab;
			if (!id) {
				set({ selectedId: null, selectedIds: [], editingId: null });
				return;
			}
			if (options?.additive) {
				const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
				set({ selectedIds: next, selectedId: next[next.length - 1] ?? null, rightTab: tab, editingId: null });
				return;
			}
			set({ selectedId: id, selectedIds: [id], rightTab: tab, editingId: get().editingId === id ? id : null });
		},

		setEditing: (editingId) => set({ editingId }),
		setOverlay: (overlay) => set({ overlay }),

		insertBlocks: (incoming) => {
			let anchor = get().selectedId;
			const inserted: string[] = [];
			get().change((content) => {
				let list = content.blocks;
				for (const block of incoming) {
					list = insertAt(list, placeForNew(list, anchor, block.type), block);
					inserted.push(block.id);
					anchor = block.id;
				}
				return { ...content, blocks: list };
			});
			set({ selectedIds: inserted, selectedId: inserted[inserted.length - 1] ?? null });
		},

		removeBlocks: (ids) => {
			if (ids.length === 0) return;
			get().change((content) => ({ ...content, blocks: ids.reduce((list, id) => removeById(list, id), content.blocks) }));
			set({ selectedId: null, selectedIds: [], editingId: null });
		},

		duplicateBlocks: (ids) => {
			const copies: string[] = [];
			get().change((content) => {
				let list = content.blocks;
				for (const id of ids) {
					const place = findPlace(list, id);
					if (!place) continue;
					const copy = cloneBlock(place.siblings[place.index], newBlockId);
					list = insertAt(list, { parentId: place.parent?.id ?? null, index: place.index + 1 }, copy);
					copies.push(copy.id);
				}
				return { ...content, blocks: list };
			});
			set({ selectedIds: copies, selectedId: copies[copies.length - 1] ?? null });
		},

		wrapInSection: (ids) => {
			const list = blocks();
			const places = ids.map((id) => ({ id, place: findPlace(list, id) }));
			// Only blocks side by side on the page itself can go into a new section.
			if (places.some(({ place }) => !place || place.parent !== null || list[place.index].type === 'section')) return;
			const ordered = places.sort((a, b) => a.place!.index - b.place!.index);
			const section = { ...createBlock('section'), children: ordered.map(({ place }) => list[place!.index]) } as TPageBlock;
			const first = ordered[0].place!.index;
			get().change((content) => ({
				...content,
				blocks: insertAt(
					content.blocks.filter((block) => !ids.includes(block.id)),
					{ parentId: null, index: first },
					section,
				),
			}));
			set({ selectedId: section.id, selectedIds: [section.id] });
		},

		insertBlock: (block, place) => {
			const at = place ?? placeForNew(blocks(), get().selectedId, block.type);
			get().change((content) => ({ ...content, blocks: insertAt(content.blocks, at, block) }));
			set({ selectedId: block.id, selectedIds: [block.id], rightTab: 'design' });
		},

		addBlock: (type, props) => get().insertBlock(createBlock(type, props)),

		moveBlock: (id, place) => {
			const list = blocks();
			const block = findBlock(list, id);
			const parent = place.parentId === null ? null : findBlock(list, place.parentId);
			if (!block || (place.parentId !== null && !parent)) return;
			if (!fitsIn(block.type, parent?.type ?? null)) return;
			if (parent && findBlock([block], parent.id)) return;
			const next = moveTo(list, id, place);
			if (next !== list) get().change((content) => ({ ...content, blocks: next }));
		},

		nudgeBlock: (id, by) => {
			const place = findPlace(blocks(), id);
			if (!place) return;
			const target = place.index + by;
			if (target < 0 || target >= place.siblings.length) return;
			get().moveBlock(id, { parentId: place.parent?.id ?? null, index: by > 0 ? target + 1 : target });
		},

		updateBlock: (id, patch, coalesceKey) =>
			get().change(
				(content) => ({
					...content,
					blocks: updateById(content.blocks, id, (block) =>
						({
							...block,
							width: patch.width ?? block.width,
							props: { ...block.props, ...patch.props },
						}) as TPageBlock,
					),
				}),
				coalesceKey ? `${id}:${coalesceKey}` : undefined,
			),

		setColumnsLayout: (id, layout) =>
			get().change((content) => ({
				...content,
				blocks: updateById(content.blocks, id, (block) =>
					block.type === 'columns'
						? {
								...block,
								props: { ...block.props, layout },
								children: fitColumns(block.children, layout, () => createBlock('column')),
							}
						: block,
				),
			})),

		removeBlock: (id) => {
			const place = findPlace(blocks(), id);
			if (!place) return;
			const selectedId = get().selectedId;
			const neighbour = place.siblings[place.index + 1] ?? place.siblings[place.index - 1] ?? place.parent;
			get().change((content) => ({ ...content, blocks: removeById(content.blocks, id) }));
			const removedSelection = !!selectedId && !findBlock(get().content?.blocks ?? [], selectedId);
			const nextId = removedSelection ? (neighbour?.id ?? null) : selectedId;
			set({ selectedId: nextId, selectedIds: nextId ? [nextId] : [], editingId: null });
		},

		duplicateBlock: (id) => {
			const place = findPlace(blocks(), id);
			if (!place) return;
			const copy = cloneBlock(place.siblings[place.index], newBlockId);
			get().insertBlock(copy, { parentId: place.parent?.id ?? null, index: place.index + 1 });
		},

		updateTheme: (patch, coalesceKey) =>
			get().change(
				(content) => ({ ...content, theme: { ...content.theme, ...patch } }),
				coalesceKey ? `theme:${coalesceKey}` : undefined,
			),

		markSaving: () => set({ saveState: 'saving' }),
		markSaved: (revision, baseRevision) =>
			set({ savedRevision: revision, baseRevision, saveState: get().revision === revision ? 'saved' : 'dirty' }),
		markConflict: () => set({ saveState: 'conflict' }),
		markSaveFailed: () => set({ saveState: 'error' }),

		setDevice: (device) => set({ device }),
		setMode: (mode) =>
			set(
				mode === 'preview'
					? { mode, selectedId: null, selectedIds: [], editingId: null }
					: { mode },
			),
		setLeftTab: (leftTab) => set({ leftTab }),
		setRightTab: (rightTab) => set({ rightTab }),
		setDragging: (dragging) => set({ dragging, dropTarget: dragging ? get().dropTarget : null }),
		setDropTarget: (dropTarget) => set({ dropTarget }),
	};
});

const NO_BLOCKS: TPageBlock[] = [];

/** The selected block, wherever it sits in the tree. */
export const selectSelected = (state: TState) =>
	state.selectedId && state.content ? findBlock(state.content.blocks, state.selectedId) : undefined;

/** The draft's blocks, with a stable empty list before a page is loaded. */
export const selectBlocks = (state: TState) => state.content?.blocks ?? NO_BLOCKS;
