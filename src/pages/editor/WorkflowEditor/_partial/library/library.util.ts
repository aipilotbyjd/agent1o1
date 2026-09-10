export const tintStyle = (hex?: string) =>
	hex
		? { backgroundColor: `${hex}1a`, color: hex }
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
export const getNodeAccentColor = (nodeId: string, explicitColor?: string, defColorHex?: string): string =>
	explicitColor ?? defColorHex ?? NODE_COLOR_PALETTE[hashString(nodeId) % NODE_COLOR_PALETTE.length];
