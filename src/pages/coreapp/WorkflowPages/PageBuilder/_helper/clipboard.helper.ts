import { notify } from '@/api/core';
import safeStorage from '@/utils/safeStorage.util';
import type { TPageBlock } from '@/types/workflow-page.type';
import { newBlockId } from './blockCatalog.helper';
import { cloneBlock, findBlock, isWithin } from './blockTree.helper';
import { usePageBuilderStore } from '../_store/pageBuilder.store';

// Blocks copied in the builder, to paste into this page or any other. Kept
// in local storage — so it works across pages and tabs without asking for
// clipboard permission — and written to the system clipboard as well, so a
// copy made in another browser window can be pasted too.

const STORAGE_KEY = 'page-builder-clipboard';
const MARKER = 'agent1o1/page-blocks';

type TClip = { kind: typeof MARKER; blocks: TPageBlock[] };

const parse = (text: string | null): TPageBlock[] | null => {
	if (!text) return null;
	try {
		const clip = JSON.parse(text) as Partial<TClip>;
		return clip.kind === MARKER && Array.isArray(clip.blocks) && clip.blocks.length > 0
			? clip.blocks
			: null;
	} catch {
		return null;
	}
};

/** The picked blocks, leaving out any that sit inside another picked one. */
const outermost = (blocks: TPageBlock[], ids: string[]) =>
	ids
		.filter((id) => !ids.some((other) => other !== id && isWithin(blocks, id, other)))
		.map((id) => findBlock(blocks, id))
		.filter((block): block is TPageBlock => !!block);

export const copyBlocks = async (ids: string[], { quiet = false } = {}) => {
	const blocks = outermost(usePageBuilderStore.getState().content?.blocks ?? [], ids);
	if (blocks.length === 0) return false;
	const text = JSON.stringify({ kind: MARKER, blocks } satisfies TClip);
	safeStorage.set(STORAGE_KEY, text);
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		// Local storage alone still pastes in this browser.
	}
	if (!quiet) {
		notify.success(
			blocks.length === 1
				? 'Copied. Paste it with ⌘V here or on any page.'
				: `Copied ${blocks.length} blocks. Paste with ⌘V on any page.`,
		);
	}
	return true;
};

export const cutBlocks = async (ids: string[]) => {
	if (await copyBlocks(ids, { quiet: true })) usePageBuilderStore.getState().removeBlocks(ids);
};

/**
 * Pastes copied blocks after the selection — or wherever they're allowed
 * near it — with new ids, so pasting twice gives two copies.
 */
export const pasteBlocks = async () => {
	// This browser's own copy first: reading the system clipboard can stop
	// for a permission prompt, so it's only asked when there's nothing here.
	let blocks = parse(safeStorage.get(STORAGE_KEY));
	if (!blocks) {
		try {
			blocks = parse(await navigator.clipboard.readText());
		} catch {
			blocks = null;
		}
	}
	if (!blocks) {
		notify.info('Nothing to paste. Copy a block with ⌘C first.');
		return;
	}
	usePageBuilderStore
		.getState()
		.insertBlocks(blocks.map((block) => cloneBlock(block, newBlockId)));
};
