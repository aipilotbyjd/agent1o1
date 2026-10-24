import { useEffect } from 'react';
import { flattenBlocks } from '@/components/workflowPage/pageTree';
import { usePageBuilderStore } from '../_store/pageBuilder.store';
import { findBlock } from '../_helper/blockTree.helper';
import { copyBlocks, cutBlocks, pasteBlocks } from '../_helper/clipboard.helper';
import { INLINE_EDITABLE } from '../_partial/InlineEditor.partial';

const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * The builder's shortcuts: listed for people in the `?` sheet
 * (`ShortcutsSheet`), so a new one belongs there too. Undo, redo, copy and
 * paste stay with the browser while a text box has focus.
 */
export const useBuilderHotkeys = (onPublish: () => void) => {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const store = usePageBuilderStore.getState();
			const mod = event.metaKey || event.ctrlKey;
			const key = event.key.toLowerCase();
			const typing = isTyping(event.target);

			if (mod && key === 's') {
				event.preventDefault();
				onPublish();
				return;
			}
			if (mod && key === 'p') {
				event.preventDefault();
				store.setMode(store.mode === 'edit' ? 'preview' : 'edit');
				return;
			}
			if (typing || store.mode !== 'edit' || store.overlay) return;

			if (mod && key === 'z') {
				event.preventDefault();
				if (event.shiftKey) store.redo();
				else store.undo();
				return;
			}
			if (mod && key === 'y') {
				event.preventDefault();
				store.redo();
				return;
			}
			if (mod && key === 'v') {
				event.preventDefault();
				void pasteBlocks();
				return;
			}
			if (mod && key === 'a') {
				event.preventDefault();
				const ids = (store.content?.blocks ?? []).map((block) => block.id);
				usePageBuilderStore.setState({
					selectedIds: ids,
					selectedId: ids[ids.length - 1] ?? null,
				});
				return;
			}
			if (key === '/' || (mod && key === 'k')) {
				event.preventDefault();
				store.setOverlay('palette');
				return;
			}
			if (event.key === '?') {
				event.preventDefault();
				store.setOverlay('shortcuts');
				return;
			}

			const selected = store.selectedId;
			const ids = store.selectedIds.length ? store.selectedIds : selected ? [selected] : [];
			if (ids.length === 0) return;

			if (key === 'escape') {
				store.select(null);
			} else if (key === 'delete' || key === 'backspace') {
				event.preventDefault();
				if (ids.length > 1) store.removeBlocks(ids);
				else store.removeBlock(ids[0]);
			} else if (mod && key === 'c') {
				event.preventDefault();
				void copyBlocks(ids);
			} else if (mod && key === 'x') {
				event.preventDefault();
				void cutBlocks(ids);
			} else if (mod && key === 'd') {
				event.preventDefault();
				if (ids.length > 1) store.duplicateBlocks(ids);
				else store.duplicateBlock(ids[0]);
			} else if (mod && key === 'g') {
				event.preventDefault();
				store.wrapInSection(ids);
			} else if (key === 'enter' && selected) {
				const block = findBlock(store.content?.blocks ?? [], selected);
				if (block && INLINE_EDITABLE.has(block.type)) {
					event.preventDefault();
					store.setEditing(selected);
				}
			} else if (event.altKey && key === 'arrowup' && selected) {
				event.preventDefault();
				store.nudgeBlock(selected, -1);
			} else if (event.altKey && key === 'arrowdown' && selected) {
				event.preventDefault();
				store.nudgeBlock(selected, 1);
			} else if ((key === 'arrowup' || key === 'arrowdown') && selected) {
				const blocks = flattenBlocks(store.content?.blocks ?? []);
				const index = blocks.findIndex((block) => block.id === selected);
				const next = blocks[index + (key === 'arrowup' ? -1 : 1)];
				if (next) {
					event.preventDefault();
					store.select(next.id, { keepTab: true });
				}
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onPublish]);
};
