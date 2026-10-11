import { useEffect } from 'react';
import { usePageBuilderStore } from '../_store/pageBuilder.store';

const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * The builder's shortcuts. Undo and redo stay with the browser while a text
 * box has focus, so typing can be undone a character at a time there.
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
			if (typing || store.mode !== 'edit') return;

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

			const selected = store.selectedId;
			if (!selected) return;

			if (key === 'escape') {
				store.select(null);
			} else if (key === 'delete' || key === 'backspace') {
				event.preventDefault();
				store.removeBlock(selected);
			} else if (mod && key === 'd') {
				event.preventDefault();
				store.duplicateBlock(selected);
			} else if (event.altKey && key === 'arrowup') {
				event.preventDefault();
				store.nudgeBlock(selected, -1);
			} else if (event.altKey && key === 'arrowdown') {
				event.preventDefault();
				store.nudgeBlock(selected, 1);
			} else if (key === 'arrowup' || key === 'arrowdown') {
				const blocks = store.content?.blocks ?? [];
				const index = blocks.findIndex((block) => block.id === selected);
				const next = blocks[index + (key === 'arrowup' ? -1 : 1)];
				if (next) {
					event.preventDefault();
					store.select(next.id);
				}
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onPublish]);
};
