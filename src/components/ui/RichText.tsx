import {
	CSSProperties,
	Dispatch,
	FC,
	HTMLAttributes,
	ReactNode,
	SetStateAction,
	useCallback,
	useMemo,
	useState,
} from 'react';
import isHotkey from 'is-hotkey';
import {
	Editable,
	Slate,
	useSlate,
	withReact,
	RenderElementProps,
	RenderLeafProps,
	ReactEditor,
} from 'slate-react';
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms } from 'slate';
import { withHistory, HistoryEditor } from 'slate-history';
import classNames from 'classnames';
import Button from '@/components/ui/Button';
import { TBorderWidth } from '@/types/borderWidth.type';
import { TColors } from '@/types/colors.type';
import { TRounded } from '@/types/rounded.type';
import themeConfig from '@/config/theme.config';
import ButtonGroup from '@/components/ui/ButtonGroup';

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		Editor.nodes(editor, {
			at: Editor.unhangRange(editor, selection),
			match: (n) =>
				// @ts-ignore
				!Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
		}),
	);

	return !!match;
};
export const ToggleBlock = (editor: Editor, format: string) => {
	const isActive = isBlockActive(
		editor,
		format,

		TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type',
	);

	const isList = LIST_TYPES.includes(format);

	Transforms.unwrapNodes(editor, {
		match: (n) =>
			!Editor.isEditor(n) &&
			SlateElement.isElement(n) &&
			// @ts-ignore
			LIST_TYPES.includes(n.type) &&
			!TEXT_ALIGN_TYPES.includes(format),
		split: true,
	});
	let newProperties: Partial<SlateElement>;

	if (TEXT_ALIGN_TYPES.includes(format)) {
		newProperties = {
			// @ts-ignore
			align: isActive ? undefined : format,
		};
	} else {
		newProperties = {
			// @ts-ignore
			type: isActive ? 'paragraph' : isList ? 'list-item' : format,
		};
	}

	Transforms.setNodes<SlateElement>(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };

		Transforms.wrapNodes(editor, block);
	}
};

const isMarkActive = (editor: Editor, format: string) => {
	const marks = Editor.marks(editor);

	return marks ? (format in marks ? marks[format as keyof typeof marks] === true : false) : false;
};
export const ToggleMark = (editor: Editor, format: string) => {
	const isActive = isMarkActive(editor, format);

	if (isActive) {
		Editor.removeMark(editor, format);
	} else {
		Editor.addMark(editor, format, true);
	}
};

export const Element = ({ attributes, children, element }: RenderElementProps) => {
	const style: CSSProperties = {
		textAlign: (element as { align?: CSSProperties['textAlign'] }).align,
	};

	switch ((element as { type?: string }).type) {
		case 'block-quote':
			return (
				<blockquote style={style} {...attributes}>
					{children}
				</blockquote>
			);
		case 'bulleted-list':
			return (
				<ul style={style} {...attributes}>
					{children}
				</ul>
			);
		case 'heading-one':
			return (
				<h1 style={style} {...attributes}>
					{children}
				</h1>
			);
		case 'heading-two':
			return (
				<h2 style={style} {...attributes}>
					{children}
				</h2>
			);
		case 'list-item':
			return (
				<li style={style} {...attributes}>
					{children}
				</li>
			);
		case 'numbered-list':
			return (
				<ol style={style} {...attributes}>
					{children}
				</ol>
			);
		default:
			return (
				<p style={style} {...attributes}>
					{children}
				</p>
			);
	}
};

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
	const formattedLeaf = leaf as {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
		code?: boolean;
	};
	if (formattedLeaf.bold) {
		children = <strong>{children}</strong>;
	}

	if (formattedLeaf.code) {
		children = <code>{children}</code>;
	}

	if (formattedLeaf.italic) {
		children = <em>{children}</em>;
	}

	if (formattedLeaf.underline) {
		children = <u>{children}</u>;
	}

	return <span {...attributes}>{children}</span>;
};

interface IButtonProps extends Record<string, unknown> {
	format: string;
	icon: string;
}
export const BlockButton = ({ format, icon, ...rest }: IButtonProps) => {
	const editor = useSlate();
	return (
		<Button
			aria-label='Align'
			icon={icon}
			isActive={isBlockActive(
				editor,
				format,

				TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type',
			)}
			onMouseDown={(event) => {
				event.preventDefault();
				ToggleBlock(editor, format);
			}}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...rest}
		/>
	);
};

export const MarkButton = ({ format, icon, ...rest }: IButtonProps) => {
	const editor = useSlate();
	return (
		<Button
			aria-label='Mark'
			icon={icon}
			isActive={isMarkActive(editor, format)}
			onMouseDown={(event) => {
				event.preventDefault();
				ToggleMark(editor, format);
			}}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...rest}
		/>
	);
};

export const Toolbar = ({ children }: { children: ReactNode }) => {
	return (
		<span className='flex items-center justify-between bg-zinc-100 dark:bg-zinc-800'>
			{children}
		</span>
	);
};

interface IToolbarChildProps {
	children: ReactNode;
	className?: string;
}
export const ToolbarChild: FC<IToolbarChildProps> = ({ children, className }) => {
	return <span className={classNames('flex items-center', className)}>{children}</span>;
};

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underline',
	'mod+`': 'code',
};

const initialValue = [
	{
		type: 'paragraph',
		children: [{ text: '' }],
	},
];

export type TRichTextVariants = 'solid';

interface IRichTextProps extends HTMLAttributes<HTMLDivElement> {
	borderWidth?: TBorderWidth;
	className?: string;
	color?: TColors;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isValidMessage?: boolean;
	validFeedback?: string;
	rounded?: TRounded;
	variant?: TRichTextVariants;
	value: Descendant[] | [];
	handleChange: Dispatch<SetStateAction<Descendant[] | []>>;
	placeholder?: string;
}
const RichText: FC<IRichTextProps> = (props) => {
	const {
		borderWidth = themeConfig.borderWidth,
		className,
		color = themeConfig.themeColor,
		invalidFeedback,
		isTouched = false,
		isValid = false,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		isValidMessage = true,
		rounded = themeConfig.rounded,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		validFeedback,
		variant = 'solid',
		value,
		handleChange,
		placeholder = 'Enter some rich text…',
		...rest
	} = props;

	const [isFocused, setIsFocused] = useState<boolean>(false);

	const richTextVariants: {
		[key in TRichTextVariants]: {
			general: string;
			validation: string;
		};
	} = {
		solid: {
			general: classNames(
				// Default
				[`${borderWidth}`],
				{
					'border-zinc-100 dark:border-zinc-800': !isFocused,
					'bg-zinc-100 dark:bg-zinc-800': !isFocused,
				},
				// Hover
				{
					[`hover:border-${color}-500`]: !isFocused,
					[`dark:hover:border-${color}-500`]: !isFocused,
				},
				// Focus
				{
					'border-zinc-300 dark:border-zinc-800': isFocused,
					'bg-transparent dark:bg-transparent': isFocused,
				},
			),
			validation: classNames({
				'!border-red-500 ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'!border-green-500 focus:ring-4 focus:ring-green-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
	};
	const richTextVariantClasses = richTextVariants[variant as TRichTextVariants].general;

	// eslint-disable-next-line react/jsx-props-no-spreading
	const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);

	// eslint-disable-next-line react/jsx-props-no-spreading
	const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
	const editor = useMemo(() => withHistory(withReact(createEditor())), []) as ReactEditor &
		HistoryEditor;

	return (
		<div
			data-component-name='RichText'
			className={classNames(
				'w-full appearance-none overflow-hidden outline-0',
				themeConfig.transition,
				rounded,
				richTextVariantClasses,
				className,
			)}
			{...rest}>
			<style>{`
			[data-slate-editor] :is(ol, ul) {list-style-position: inside;} 
			[data-slate-editor] ul li {list-style-type: disc;} 
			[data-slate-editor] ol li {list-style-type: numeric;} 
			[data-slate-editor] blockquote {font-style: italic; font-size: 110%; opacity: 0.9; border-left: 2px solid; padding-left: 0.5rem}
			`}</style>
			<Slate
				editor={editor}
				initialValue={!value.length ? initialValue : value}
				onChange={handleChange}>
				<Toolbar>
					<ToolbarChild className='flex-wrap gap-4'>
						<ButtonGroup variant='link' dimension='sm'>
							<MarkButton format='bold' icon='TextBold' />
							<MarkButton format='italic' icon='TextItalic' />
							<MarkButton format='underline' icon='TextUnderline' />
							<MarkButton format='code' icon='SourceCode' />
						</ButtonGroup>
						<ButtonGroup variant='link' dimension='sm'>
							<BlockButton format='heading-one' icon='Heading01' />
							<BlockButton format='heading-two' icon='Heading02' />
							<BlockButton format='block-quote' icon='QuoteDown' />
							<BlockButton format='numbered-list' icon='LeftToRightListNumber' />
							<BlockButton format='bulleted-list' icon='LeftToRightListStar' />
							<BlockButton format='left' icon='TextAlignLeft' />
							<BlockButton format='center' icon='TextAlignCenter' />
							<BlockButton format='right' icon='TextAlignRight' />
							<BlockButton format='justify' icon='TextAlignJustifyCenter' />
						</ButtonGroup>
					</ToolbarChild>
					<ToolbarChild>
						<Button
							aria-label='Undo'
							icon='DuoReply'
							onMouseDown={() => {
								HistoryEditor.undo(editor);
							}}
							isDisable={!editor.history.undos.length}
						/>
						<Button
							aria-label='Redo'
							icon='DuoRedo'
							onMouseDown={() => {
								HistoryEditor.redo(editor);
							}}
							isDisable={!editor.history.redos.length}
						/>
					</ToolbarChild>
				</Toolbar>
				<Editable
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					placeholder={placeholder}
					spellCheck
					onKeyDown={(event) => {
						for (const hotkey in HOTKEYS) {
							if (isHotkey(hotkey, event as never)) {
								event.preventDefault();

								const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
								ToggleMark(editor, mark);
							}
						}
					}}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className='p-4 outline-0'
				/>
			</Slate>
		</div>
	);
};

export default RichText;
