import type { TPageAlign, TPageBlock, TPageBlockDisplay, TPageBlockType } from '@/types/workflow-page.type';

/** The props that change how a block looks, never what it says. */
const STYLE_KEYS = [
	'align',
	'style',
	'tone',
	'level',
	'fit',
	'height',
	'size',
	'background',
	'padding',
	'gap',
	'valign',
	'ratio',
	'columns',
	'grayscale',
	'lightbox',
	'show_copy',
	'show_values',
	'copyable',
	'new_tab',
	'open_first',
	'show_progress',
	'show_seconds',
] as const;

/** Blocks whose `align` takes left, centre and right. */
const ALIGNABLE = new Set<TPageBlockType>(['heading', 'text', 'button', 'submit', 'social']);

export type TStylePreset = {
	type: TPageBlockType;
	width: TPageBlock['width'];
	display: Pick<TPageBlockDisplay, 'visibility' | 'space_above' | 'mobile_space_above' | 'mobile_align'>;
	props: Record<string, unknown>;
};

export type TSavedStylePreset = { id: string; name: string; preset: TStylePreset };

/** How a block looks, to paste onto another. */
export const captureStyle = (block: TPageBlock): TStylePreset => {
	const props = block.props as Record<string, unknown>;
	return {
		type: block.type,
		width: block.width,
		display: {
			visibility: block.visibility,
			space_above: block.space_above,
			mobile_space_above: block.mobile_space_above,
			mobile_align: block.mobile_align,
		},
		props: Object.fromEntries(STYLE_KEYS.filter((key) => key in props).map((key) => [key, props[key]])),
	};
};

/**
 * The block with a style applied: its width and display settings always,
 * and the look props when it is the same kind of block. Containers keep
 * their width, and a locked block is left alone.
 */
export const applyStyle = (block: TPageBlock, preset: TStylePreset, keepWidth: boolean): TPageBlock => {
	if (block.locked) return block;
	const sameType = block.type === preset.type;
	const own = block.props as Record<string, unknown>;
	const props = { ...own };
	if (sameType) {
		for (const [key, value] of Object.entries(preset.props)) {
			if (key in own) props[key] = value;
		}
	} else if (ALIGNABLE.has(block.type) && ALIGNABLE.has(preset.type) && 'align' in preset.props) {
		props.align = preset.props.align;
	}
	return {
		...block,
		...preset.display,
		width: keepWidth ? block.width : preset.width,
		props,
	} as TPageBlock;
};

/** The block aligned, when it can be: heading, text, button, Run button and social links. */
export const alignBlock = (block: TPageBlock, align: TPageAlign): TPageBlock =>
	block.locked || !ALIGNABLE.has(block.type)
		? block
		: ({ ...block, props: { ...block.props, align } } as TPageBlock);

export const canAlign = (block: TPageBlock) => ALIGNABLE.has(block.type);

const STORAGE_KEY = 'agent1o1.pageStylePresets';

export const loadStylePresets = (): TSavedStylePreset[] => {
	try {
		const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
		return Array.isArray(parsed)
			? parsed.filter(
					(item): item is TSavedStylePreset =>
						!!item && typeof item.id === 'string' && typeof item.name === 'string' && !!item.preset?.type,
				)
			: [];
	} catch {
		return [];
	}
};

export const storeStylePresets = (presets: TSavedStylePreset[]) => {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, 50)));
	} catch {
		// Storage blocked: presets last until the page is closed.
	}
};
