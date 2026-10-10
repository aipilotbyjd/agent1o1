/**
 * Shared contract for dragging a node's output "pill" onto an input field to
 * insert an expression token — the Gumloop-style visual mapping. The drag source
 * (NodeIOPanel output pills) and the drop target (ExpressionInput) both go
 * through here so the MIME type and token format never drift apart.
 */

/** Custom drag payload type so we only accept our own output-pill drags. */
export const TOKEN_DND_MIME = 'application/x-agent-output-token';

/**
 * Build the expression token for a node output in the form the backend
 * resolves: its templating context is `{ input, nodes: { <id>: <output> } }`,
 * so `{{nodes.node_2.city}}` reads a field and `{{nodes.node_2}}` the whole
 * output. Id-based so rename/duplicate never breaks a dropped reference.
 */
export const buildOutputToken = (nodeId: string, outputPath: string): string =>
	`{{nodes.${nodeId}${outputPath ? `.${outputPath}` : ''}}}`;

const NODE_TOKEN_RE = /^\{\{\s*nodes\.([A-Za-z0-9_]+)((?:\.[A-Za-z0-9_]+|\[\d+\])*)\s*\}\}$/;

/** The node and output path a `{{nodes.<id>.<path>}}` token points at, or null. */
export const parseNodeToken = (token: string): { nodeId: string; path: string } | null => {
	const match = token.match(NODE_TOKEN_RE);
	return match ? { nodeId: match[1], path: match[2].replace(/^\./, '') } : null;
};

const LEGACY_TOKEN_RE = /\{\{\s*([A-Za-z0-9_]+)\.output((?:\.[A-Za-z0-9_]+|\[\d+\])*)\s*\}\}/g;

/**
 * Rewrite the editor's old `{{<id>.output.<path>}}` form, which the backend
 * never resolved, to `{{nodes.<id>.<path>}}` — for workflow files exported
 * before the change. Only ids of nodes in the same workflow are touched.
 */
export const upgradeLegacyTokens = (value: unknown, nodeIds: Set<string>): unknown => {
	if (typeof value === 'string')
		return value.includes('{{')
			? value.replace(LEGACY_TOKEN_RE, (match, id: string, path: string) =>
					nodeIds.has(id) ? `{{nodes.${id}${path}}}` : match,
				)
			: value;
	if (Array.isArray(value)) return value.map((item) => upgradeLegacyTokens(item, nodeIds));
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, upgradeLegacyTokens(item, nodeIds)]),
		);
	return value;
};

/** Write the token onto a drag event's dataTransfer (custom type + text fallback). */
export const setTokenDragData = (dataTransfer: DataTransfer, token: string): void => {
	dataTransfer.setData(TOKEN_DND_MIME, token);
	// Plain-text fallback so dropping into a native textarea still yields the token.
	dataTransfer.setData('text/plain', token);
	dataTransfer.effectAllowed = 'copy';
};

/** Read a token back from a drop event, or null when it isn't one of ours. */
export const getTokenFromDrop = (dataTransfer: DataTransfer): string | null => {
	const token = dataTransfer.getData(TOKEN_DND_MIME) || dataTransfer.getData('text/plain');
	return token && token.includes('{{') ? token : null;
};
