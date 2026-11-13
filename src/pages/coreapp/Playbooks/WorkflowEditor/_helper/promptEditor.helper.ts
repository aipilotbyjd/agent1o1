import { Editor, Element, Node, Range, Text, Transforms, type Descendant } from 'slate';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';
import type { TBuilderMessageContext } from '@/types/workflow-builder.type';
import type { TNodeDefinition } from '../_types/node.type';
import {
	credentialMentionToken,
	mentionContext,
	nodeMentionToken,
	type TPromptMention,
	type TPromptMentionTrigger,
} from './promptMentions.helper';

/** A picked step or account, shown as a chip inside the prompt. */
export type TMentionElement = {
	type: 'mention';
	mention: TPromptMention;
	label: string;
	/** A node's icon name, or a connector's (`mail`, `slack`, ...). */
	icon: string | null;
	color: string | null;
	children: [{ text: '' }];
};

/** The `/` or `@` being typed at the cursor, and the range it covers. */
export type TPromptTrigger = { trigger: TPromptMentionTrigger; query: string; range: Range };

export const emptyPrompt = (): Descendant[] => [
	{ type: 'paragraph', children: [{ text: '' }] } as Descendant,
];

export const isMention = (node: unknown): node is TMentionElement =>
	Element.isElement(node) && (node as { type?: string }).type === 'mention';

export const withMentions = <T extends Editor>(editor: T): T => {
	const { isInline, isVoid, markableVoid } = editor;
	editor.isInline = (element) => isMention(element) || isInline(element);
	editor.isVoid = (element) => isMention(element) || isVoid(element);
	editor.markableVoid = (element) => isMention(element) || markableVoid(element);
	return editor;
};

export const nodeMentionElement = (node: TNodeDefinition): TMentionElement => ({
	type: 'mention',
	mention: { kind: 'node', token: nodeMentionToken(node), key: node.key },
	label: node.label,
	icon: node.icon ?? null,
	color: node.colorHex ?? null,
	children: [{ text: '' }],
});

export const credentialMentionElement = (
	credential: TConnectorCredential,
	connector?: TConnector,
): TMentionElement => ({
	type: 'mention',
	mention: {
		kind: 'credential',
		token: credentialMentionToken(credential, connector),
		id: credential.id,
	},
	label: credential.name,
	icon: connector?.icon ?? null,
	color: connector?.color ?? null,
	children: [{ text: '' }],
});

/** The prompt as the builder reads it: each chip becomes its token. */
export const promptText = (editor: Editor) =>
	editor.children
		.map((block) =>
			Element.isElement(block)
				? block.children
						.map((child) =>
							isMention(child)
								? child.mention.token
								: Text.isText(child)
									? child.text
									: Node.string(child),
						)
						.join('')
				: Node.string(block),
		)
		.join('\n')
		.trim();

export const promptContext = (editor: Editor): TBuilderMessageContext | undefined =>
	mentionContext(
		Array.from(Node.descendants(editor))
			.map(([node]) => node)
			.filter(isMention)
			.map((element) => element.mention),
	);

/** A `/` or `@` that starts a word, followed by the query typed so far. */
export const findTrigger = (editor: Editor): TPromptTrigger | null => {
	const { selection } = editor;
	if (!selection || !Range.isCollapsed(selection)) return null;
	const { anchor } = selection;
	const leaf = Node.get(editor, anchor.path);
	if (!Text.isText(leaf)) return null;
	const match = /(?:^|\s)([@/])([^\s@/]*)$/.exec(leaf.text.slice(0, anchor.offset));
	if (!match) return null;
	return {
		trigger: match[1] === '/' ? 'slash' : 'at',
		query: match[2],
		range: {
			anchor: { path: anchor.path, offset: anchor.offset - match[2].length - 1 },
			focus: anchor,
		},
	};
};

const ensureSelection = (editor: Editor) => {
	if (!editor.selection) Transforms.select(editor, Editor.end(editor, []));
};

/** Whether the cursor sits right after a non-space character, so new text needs a space first. */
const followsWord = (editor: Editor) => {
	const { anchor } = editor.selection!;
	const before = Editor.before(editor, anchor, { unit: 'character' });
	const previous = before ? Editor.string(editor, { anchor: before, focus: anchor }) : '';
	return previous !== '' && !/\s/.test(previous);
};

/** Puts a chip in place of `at` (the typed `@query`), or at the cursor, followed by a space. */
export const insertMention = (editor: Editor, element: TMentionElement, at?: Range | null) => {
	if (at) Transforms.select(editor, at);
	else {
		ensureSelection(editor);
		if (followsWord(editor)) Editor.insertText(editor, ' ');
	}
	Transforms.insertNodes(editor, element as unknown as Node);
	Transforms.move(editor);
	Editor.insertText(editor, ' ');
};

/** Types a `@` at the cursor, starting a new word, so the account list opens. */
export const insertAtTrigger = (editor: Editor) => {
	ensureSelection(editor);
	Editor.insertText(editor, followsWord(editor) ? ' @' : '@');
};

/** The chip for an account connected from the prompt, before its details have loaded. */
export const connectedAccountElement = (connector: TConnector, id: string): TMentionElement => ({
	type: 'mention',
	mention: { kind: 'credential', token: `@${connector.name}`, id },
	label: connector.name,
	icon: connector.icon,
	color: connector.color,
	children: [{ text: '' }],
});
