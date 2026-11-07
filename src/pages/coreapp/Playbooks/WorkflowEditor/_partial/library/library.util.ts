const isNearBlack = (hex: string) => {
	const value = parseInt(hex.slice(1, 7), 16);
	const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b < 60;
};

/** Brand colors like GitHub's near-black would vanish on the dark theme, so they go light there. */
export const tintStyle = (hex?: string) =>
	hex
		? {
				backgroundColor: `${hex}1a`,
				color: isNearBlack(hex) ? `light-dark(${hex}, #e4e4e7)` : hex,
			}
		: { backgroundColor: 'rgb(124 58 237 / 0.1)', color: 'rgb(124 58 237)' };

/**
 * Curated, visually distinct hues so nodes without an explicit color still
 * read apart from each other on the canvas and in the IO panel/token chips.
 */
const NODE_COLOR_PALETTE = [
	'#6366f1',
	'#0ea5e9',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#ec4899',
	'#8b5cf6',
	'#14b8a6',
	'#f97316',
	'#84cc16',
	'#06b6d4',
	'#a855f7',
];

const hashString = (value: string) => {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
};

/**
 * Resolve the color a node should be identified by: an explicit per-node
 * override, then the definition's brand color, then a deterministic pick
 * from the palette (stable per node id) so every node still stands apart
 * even when nothing was color-picked manually.
 */
export const getNodeAccentColor = (
	nodeId: string,
	explicitColor?: string,
	defColorHex?: string,
): string =>
	explicitColor ??
	defColorHex ??
	NODE_COLOR_PALETTE[hashString(nodeId) % NODE_COLOR_PALETTE.length];

export type TFocusDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Moves focus to the library item nearest in `direction` from where focus is,
 * so arrow keys walk a grid of tiles and a list of rows alike. From the search
 * box it enters the first item; up from the first item returns to the search.
 */
export const focusNeighbour = (
	root: HTMLElement,
	from: Element | null,
	direction: TFocusDirection,
) => {
	const items = [...root.querySelectorAll<HTMLElement>('[data-library-item]')].filter(
		(item) => item.offsetParent !== null,
	);
	const search = root.querySelector<HTMLElement>('[data-library-search]');
	const current =
		from instanceof HTMLElement ? from.closest<HTMLElement>('[data-library-item]') : null;

	if (!current) {
		(direction === 'up' ? items[items.length - 1] : items[0])?.focus();
		return;
	}

	const origin = current.getBoundingClientRect();
	const originX = origin.left + origin.width / 2;
	const originY = origin.top + origin.height / 2;
	const vertical = direction === 'up' || direction === 'down';
	let best: HTMLElement | null = null;
	let bestScore = Infinity;

	for (const item of items) {
		if (item === current) continue;
		const rect = item.getBoundingClientRect();
		const dx = rect.left + rect.width / 2 - originX;
		const dy = rect.top + rect.height / 2 - originY;
		const ahead =
			direction === 'down'
				? dy > origin.height / 2
				: direction === 'up'
					? dy < -origin.height / 2
					: direction === 'right'
						? dx > origin.width / 2 && Math.abs(dy) < origin.height / 2
						: dx < -origin.width / 2 && Math.abs(dy) < origin.height / 2;
		if (!ahead) continue;

		const score = vertical ? Math.abs(dy) + Math.abs(dx) * 2 : Math.abs(dx) + Math.abs(dy) * 2;
		if (score < bestScore) {
			best = item;
			bestScore = score;
		}
	}

	if (best) {
		best.focus();
		best.scrollIntoView({ block: 'nearest' });
	} else if (direction === 'up') {
		search?.focus();
	}
};
