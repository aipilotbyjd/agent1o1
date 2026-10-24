import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { TPageBlock, TPageBlockType } from '@/types/workflow-page.type';
import { usePageBuilderStore } from '../_store/pageBuilder.store';

/** Blocks whose text can be edited right on the canvas (double-click or Enter). */
export const INLINE_EDITABLE: ReadonlySet<TPageBlockType> = new Set([
	'heading',
	'text',
	'callout',
	'button',
	'submit',
]);

const HEADING_SIZE = {
	1: 'text-3xl leading-tight font-extrabold',
	2: 'text-xl font-bold',
	3: 'text-base font-bold',
} as const;

/** The prop a block's text lives in, and whether it runs to several lines. */
const field = (block: TPageBlock): { prop: string; value: string; multiline: boolean } | null => {
	switch (block.type) {
		case 'heading':
			return { prop: 'text', value: block.props.text, multiline: false };
		case 'text':
		case 'callout':
			return { prop: 'markdown', value: block.props.markdown, multiline: true };
		case 'button':
		case 'submit':
			return { prop: 'label', value: block.props.label, multiline: false };
		default:
			return null;
	}
};

/**
 * Edits a block's text where it sits. Single-line text saves on Enter,
 * longer text on ⌘/Ctrl+Enter; Esc cancels and clicking away saves.
 */
const InlineEditor = ({ block }: { block: TPageBlock }) => {
	const target = field(block);
	const [value, setValue] = useState(target?.value ?? '');
	const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
	const done = useRef(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.focus();
		// A short label is usually retyped; a paragraph is usually added to.
		if (target?.multiline) element.setSelectionRange(element.value.length, element.value.length);
		else element.select();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Grows with the text, so long paragraphs don't scroll inside a tiny box.
	useEffect(() => {
		const element = ref.current;
		if (element && target?.multiline) {
			element.style.height = 'auto';
			element.style.height = `${element.scrollHeight}px`;
		}
	}, [value, target?.multiline]);

	if (!target) return null;

	const finish = (save: boolean) => {
		if (done.current) return;
		done.current = true;
		const store = usePageBuilderStore.getState();
		if (save && value !== target.value)
			store.updateBlock(block.id, { props: { [target.prop]: value } });
		store.setEditing(null);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		event.stopPropagation();
		if (event.key === 'Escape') finish(false);
		if (event.key === 'Enter' && (!target.multiline || event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			finish(true);
		}
	};

	const shared = {
		ref,
		value,
		onChange: (event: { target: { value: string } }) => setValue(event.target.value),
		onKeyDown,
		onBlur: () => finish(true),
		onClick: (event: { stopPropagation: () => void }) => event.stopPropagation(),
		'aria-label': 'Edit text',
	};

	const look =
		block.type === 'heading'
			? `${HEADING_SIZE[block.props.level]} tracking-tight ${block.props.align === 'center' ? 'text-center' : block.props.align === 'right' ? 'text-right' : ''}`
			: block.type === 'button' || block.type === 'submit'
				? 'text-sm font-bold'
				: 'text-sm leading-relaxed';

	return (
		<div className='relative z-20'>
			{target.multiline ? (
				<textarea
					{...shared}
					rows={2}
					className={`ring-primary-500 w-full resize-none overflow-hidden rounded-md bg-[var(--pg-surface)] px-2 py-1 text-[var(--pg-text)] ring-2 outline-none ${look}`}
				/>
			) : (
				<input
					{...shared}
					className={`ring-primary-500 w-full rounded-md bg-[var(--pg-surface)] px-2 py-1 text-[var(--pg-text)] ring-2 outline-none ${look}`}
				/>
			)}
			<p className='absolute -bottom-5 left-0 text-[10px] font-semibold whitespace-nowrap text-zinc-500'>
				{target.multiline
					? '⌘↵ to save · Esc to cancel · Markdown works'
					: '↵ to save · Esc to cancel'}
			</p>
		</div>
	);
};

export default InlineEditor;
