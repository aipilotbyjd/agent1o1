import type { TPageBlock, TPageBlockType, TPageColumnLayout } from '@/types/workflow-page.type';
import { flattenBlocks } from '@/components/workflowPage/pageTree';

// The page is a tree: sections and columns hold blocks in `children`. These
// helpers edit it without mutating it, so every change is one undo step.

/** Where a block goes: into `parentId` (null for the page) at `index`. */
export type TBlockPlace = { parentId: string | null; index: number };

/** Mirrors `PageBlockType::fitsIn()` on the server. */
export const fitsIn = (type: TPageBlockType, parent: TPageBlockType | null): boolean => {
	switch (type) {
		case 'section':
			return parent === null;
		case 'columns':
			return parent === null || parent === 'section';
		case 'column':
			return parent === 'columns';
		default:
			return parent !== 'columns';
	}
};

export const isContainer = (
	block: TPageBlock,
): block is Extract<TPageBlock, { children: TPageBlock[] }> => 'children' in block;

export const findBlock = (blocks: TPageBlock[], id: string): TPageBlock | undefined =>
	flattenBlocks(blocks).find((block) => block.id === id);

/** The block holding `id` (null when it sits on the page) and its position there. */
export const findPlace = (
	blocks: TPageBlock[],
	id: string,
	parent: TPageBlock | null = null,
): { parent: TPageBlock | null; siblings: TPageBlock[]; index: number } | null => {
	const index = blocks.findIndex((block) => block.id === id);
	if (index >= 0) return { parent, siblings: blocks, index };
	for (const block of blocks) {
		if (!isContainer(block)) continue;
		const found = findPlace(block.children, id, block);
		if (found) return found;
	}
	return null;
};

/** Whether `id` is `ancestorId` or sits anywhere inside it. */
export const isWithin = (blocks: TPageBlock[], id: string, ancestorId: string): boolean => {
	if (id === ancestorId) return true;
	const ancestor = findBlock(blocks, ancestorId);
	return !!ancestor && isContainer(ancestor) && !!findBlock(ancestor.children, id);
};

const mapChildren = (
	blocks: TPageBlock[],
	parentId: string | null,
	update: (children: TPageBlock[]) => TPageBlock[],
): TPageBlock[] =>
	parentId === null
		? update(blocks)
		: blocks.map((block) =>
				!isContainer(block)
					? block
					: block.id === parentId
						? ({ ...block, children: update(block.children) } as TPageBlock)
						: ({
								...block,
								children: mapChildren(block.children, parentId, update),
							} as TPageBlock),
			);

export const insertAt = (
	blocks: TPageBlock[],
	place: TBlockPlace,
	block: TPageBlock,
): TPageBlock[] =>
	mapChildren(blocks, place.parentId, (children) => [
		...children.slice(0, place.index),
		block,
		...children.slice(place.index),
	]);

export const removeById = (blocks: TPageBlock[], id: string): TPageBlock[] =>
	blocks
		.filter((block) => block.id !== id)
		.map((block) =>
			isContainer(block)
				? ({ ...block, children: removeById(block.children, id) } as TPageBlock)
				: block,
		);

export const updateById = (
	blocks: TPageBlock[],
	id: string,
	update: (block: TPageBlock) => TPageBlock,
): TPageBlock[] =>
	blocks.map((block) =>
		block.id === id
			? update(block)
			: isContainer(block)
				? ({ ...block, children: updateById(block.children, id, update) } as TPageBlock)
				: block,
	);

/** Moves `id` to `place`, as measured before the move. */
export const moveTo = (blocks: TPageBlock[], id: string, place: TBlockPlace): TPageBlock[] => {
	const from = findPlace(blocks, id);
	const block = findBlock(blocks, id);
	if (!from || !block) return blocks;
	const sameParent = (from.parent?.id ?? null) === place.parentId;
	const index = sameParent && place.index > from.index ? place.index - 1 : place.index;
	if (sameParent && index === from.index) return blocks;
	return insertAt(removeById(blocks, id), { parentId: place.parentId, index }, block);
};

/** A copy of a block and everything inside it, with new ids throughout. */
export const cloneBlock = (block: TPageBlock, newId: () => string): TPageBlock =>
	({
		...block,
		id: newId(),
		props: structuredClone(block.props),
		...(isContainer(block)
			? { children: block.children.map((child) => cloneBlock(child, newId)) }
			: {}),
	}) as TPageBlock;

export const columnCount = (layout: TPageColumnLayout) => layout.split('-').length;

/**
 * Columns' children for a new layout: missing columns are added empty, and
 * the blocks of removed ones move into the last column kept.
 */
export const fitColumns = (
	columns: TPageBlock[],
	layout: TPageColumnLayout,
	makeColumn: () => TPageBlock,
): TPageBlock[] => {
	const wanted = columnCount(layout);
	if (columns.length > wanted) {
		const kept = columns.slice(0, wanted);
		const moved = columns
			.slice(wanted)
			.flatMap((column) => (isContainer(column) ? column.children : []));
		const last = kept[wanted - 1];
		if (isContainer(last))
			kept[wanted - 1] = { ...last, children: [...last.children, ...moved] } as TPageBlock;
		return kept;
	}
	return [...columns, ...Array.from({ length: wanted - columns.length }, makeColumn)];
};
