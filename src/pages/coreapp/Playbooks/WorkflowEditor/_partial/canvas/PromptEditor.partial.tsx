import { createElement, useLayoutEffect, useState, type KeyboardEvent } from 'react';
import type { Editor, Range } from 'slate';
import {
	Editable,
	ReactEditor,
	Slate,
	useFocused,
	useSelected,
	type RenderElementProps,
} from 'slate-react';
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import type { TConnector } from '@/types/connector.type';
import { connectorIconFor } from '@/pages/coreapp/Apps/_helper/connectorCatalog.helper';
import { filesFromPaste } from '@/utils/chatAttachments.util';
import { usePromptMentionItems } from '../../_hooks/usePromptMentionItems.hook';
import {
	credentialMentionElement,
	emptyPrompt,
	findTrigger,
	insertMention,
	isMention,
	nodeMentionElement,
	promptText,
	type TMentionElement,
	type TPromptTrigger,
} from '../../_helper/promptEditor.helper';
import { readableColor, type TPromptMentionItem } from '../../_helper/promptMentions.helper';
import NodeIcon from '../library/NodeIcon.partial';
import PromptMentionMenu from './PromptMentions.partial';

type Props = {
	editor: Editor;
	workspaceId: string;
	onTextChange: (text: string) => void;
	onSubmit: () => void;
	onPasteFiles: (files: File[]) => void;
	/** Picking an app to connect: the chip for its new account goes in place of `at`. */
	onConnect: (connector: TConnector, at: Range) => void;
};

const ConnectorGlyph = ({ icon }: { icon: string | null }) =>
	createElement(connectorIconFor(icon), { className: 'h-3.5 w-3.5' });

const MentionChip = ({
	attributes,
	children,
	element,
}: RenderElementProps & { element: TMentionElement }) => {
	const selected = useSelected();
	const focused = useFocused();
	const color = element.color ?? '#71717a';
	return (
		<span
			{...attributes}
			contentEditable={false}
			className={`mx-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-px align-baseline text-[0.8em] leading-5 font-semibold text-zinc-600 dark:text-zinc-200 ${
				selected && focused ? 'ring-primary-400 ring-2' : ''
			}`}
			style={{ backgroundColor: `${color}14`, borderColor: `${color}33` }}>
			<span className='flex items-center' style={{ color: readableColor(color) }}>
				{element.mention.kind === 'credential' ? (
					<ConnectorGlyph icon={element.icon} />
				) : (
					<NodeIcon icon={element.icon ?? undefined} size={13} />
				)}
			</span>
			{element.label}
			{children}
		</span>
	);
};

const renderElement = (props: RenderElementProps) =>
	isMention(props.element) ? (
		<MentionChip attributes={props.attributes} element={props.element}>
			{props.children}
		</MentionChip>
	) : (
		<p {...props.attributes}>{props.children}</p>
	);

const triggerKey = (trigger: TPromptTrigger) =>
	`${trigger.range.anchor.path.join('.')}:${trigger.range.anchor.offset}`;

/** The prompt: `/` picks a step and `@` an account, each shown as a chip in the text. */
const PromptEditor = ({
	editor,
	workspaceId,
	onTextChange,
	onSubmit,
	onPasteFiles,
	onConnect,
}: Props) => {
	const [initialValue] = useState(emptyPrompt);
	const [trigger, setTrigger] = useState<TPromptTrigger | null>(null);
	const [dismissed, setDismissed] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const items = usePromptMentionItems(
		workspaceId,
		trigger?.trigger ?? null,
		trigger?.query ?? '',
	);
	const active = Math.min(activeIndex, items.length - 1);

	const {
		refs: { setFloating, setPositionReference },
		floatingStyles,
	} = useFloating({
		placement: 'bottom-start',
		middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate,
	});

	// The list follows the `/` or `@` being typed.
	useLayoutEffect(() => {
		if (!trigger) return;
		try {
			const domRange = ReactEditor.toDOMRange(editor as ReactEditor, trigger.range);
			setPositionReference({
				getBoundingClientRect: () => domRange.getBoundingClientRect(),
			});
		} catch {
			// The range moved out from under the list before it was placed: it re-places on the next change.
		}
	}, [editor, trigger, setPositionReference]);

	const handleChange = () => {
		onTextChange(promptText(editor));
		const next = findTrigger(editor);
		const open = next && triggerKey(next) !== dismissed ? next : null;
		if (open?.query !== trigger?.query || !open !== !trigger) setActiveIndex(0);
		setTrigger(open);
	};

	const select = (item: TPromptMentionItem) => {
		if (!trigger) return;
		if (item.kind === 'connect') {
			onConnect(item.connector, trigger.range);
		} else {
			insertMention(
				editor,
				item.kind === 'node'
					? nodeMentionElement(item.node)
					: credentialMentionElement(item.credential, item.connector),
				trigger.range,
			);
			ReactEditor.focus(editor as ReactEditor);
		}
		setTrigger(null);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (trigger) {
			if (event.key === 'Escape') {
				event.preventDefault();
				setDismissed(triggerKey(trigger));
				setTrigger(null);
				return;
			}
			if (items.length > 0) {
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					event.preventDefault();
					const step = event.key === 'ArrowDown' ? 1 : -1;
					setActiveIndex((active + step + items.length) % items.length);
					return;
				}
				if ((event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) {
					event.preventDefault();
					select(items[active]);
					return;
				}
			}
		}
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onSubmit();
		}
	};

	return (
		<Slate editor={editor as ReactEditor} initialValue={initialValue} onChange={handleChange}>
			<Editable
				aria-label='Prompt description'
				renderElement={renderElement}
				onKeyDown={handleKeyDown}
				onPaste={(event) => {
					const files = filesFromPaste(event);
					if (!files.length) return;
					event.preventDefault();
					onPasteFiles(files);
				}}
				// Dropped files go to the attachment tray around the editor.
				onDrop={(event) => event.dataTransfer.files.length > 0}
				onBlur={() => setTrigger(null)}
				className='min-h-[90px] w-full cursor-text text-lg font-medium whitespace-pre-wrap text-zinc-800 outline-none select-text dark:text-zinc-100'
			/>
			{trigger && (
				<FloatingPortal>
					<div ref={setFloating} style={floatingStyles} className='z-[60]'>
						<PromptMentionMenu
							trigger={trigger.trigger}
							items={items}
							activeIndex={active}
							onHover={setActiveIndex}
							onSelect={select}
						/>
					</div>
				</FloatingPortal>
			)}
		</Slate>
	);
};

export default PromptEditor;
