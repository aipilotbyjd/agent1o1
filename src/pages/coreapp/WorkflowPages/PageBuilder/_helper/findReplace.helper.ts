import type { TPageBlock } from '@/types/workflow-page.type';
import { isContainer } from './blockTree.helper';

/** The props that hold words people read; links, choices and ids are never touched. */
const TEXT_KEYS = new Set([
	'text',
	'markdown',
	'label',
	'title',
	'placeholder',
	'help',
	'empty_text',
	'idle_text',
	'running_label',
	'ended_text',
	'caption',
	'alt',
	'question',
	'answer',
	'quote',
	'author',
	'role',
	'description',
	'name',
	'price',
	'period',
	'features',
	'cta_label',
	'before_label',
	'after_label',
	'before_items',
	'after_items',
	'date',
	'value',
	'code',
	'filename',
]);

export type TFindOptions = { matchCase: boolean };

export type TFindMatch = {
	blockId: string;
	/** How many times the text appears in this block. */
	count: number;
	/** The first line it appears in, trimmed around the match. */
	preview: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pattern = (query: string, { matchCase }: TFindOptions) =>
	new RegExp(escapeRegExp(query), matchCase ? 'g' : 'gi');

/** Runs `visit` over every readable string in `value`, returning the value with each replaced. */
const mapText = (value: unknown, key: string | null, visit: (text: string) => string): unknown => {
	if (typeof value === 'string') return key !== null && TEXT_KEYS.has(key) ? visit(value) : value;
	if (Array.isArray(value)) return value.map((item) => mapText(item, key, visit));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([name, inner]) => [name, mapText(inner, name, visit)]),
		);
	}
	return value;
};

const preview = (text: string, match: RegExpMatchArray): string => {
	const index = match.index ?? 0;
	const line = text.slice(text.lastIndexOf('\n', index) + 1).split('\n')[0];
	const offset = index - (text.length - text.slice(text.lastIndexOf('\n', index) + 1).length);
	const start = Math.max(0, offset - 24);
	return `${start > 0 ? '…' : ''}${line.slice(start, offset + match[0].length + 40)}`;
};

/** The blocks, at any depth, whose text contains `query`, in page order. */
export const findInBlocks = (blocks: TPageBlock[], query: string, options: TFindOptions): TFindMatch[] => {
	if (!query) return [];
	const found: TFindMatch[] = [];
	const walk = (list: TPageBlock[]) => {
		for (const block of list) {
			let count = 0;
			let first = '';
			mapText(block.props, null, (text) => {
				const matches = [...text.matchAll(pattern(query, options))];
				if (matches.length > 0 && count === 0) first = preview(text, matches[0]);
				count += matches.length;
				return text;
			});
			if (count > 0) found.push({ blockId: block.id, count, preview: first });
			if (isContainer(block)) walk(block.children);
		}
	};
	walk(blocks);
	return found;
};

/**
 * The blocks with `query` replaced everywhere it appears. Locked blocks are
 * left as they are; `replaced` counts what changed.
 */
export const replaceInBlocks = (
	blocks: TPageBlock[],
	query: string,
	replacement: string,
	options: TFindOptions,
): { blocks: TPageBlock[]; replaced: number } => {
	if (!query) return { blocks, replaced: 0 };
	let replaced = 0;
	const walk = (list: TPageBlock[]): TPageBlock[] =>
		list.map((block) => {
			const next = block.locked
				? block
				: ({
						...block,
						props: mapText(block.props, null, (text) =>
							text.replace(pattern(query, options), () => {
								replaced += 1;
								return replacement;
							}),
						),
					} as TPageBlock);
			return isContainer(next) ? ({ ...next, children: walk(next.children) } as TPageBlock) : next;
		});
	return { blocks: walk(blocks), replaced };
};
