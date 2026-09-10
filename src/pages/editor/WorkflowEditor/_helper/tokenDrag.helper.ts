/**
 * Shared contract for dragging a node's output "pill" onto an input field to
 * insert an expression token — the Gumloop-style visual mapping. The drag source
 * (NodeIOPanel output pills) and the drop target (ExpressionInput) both go
 * through here so the MIME type and token format never drift apart.
 */

/** Custom drag payload type so we only accept our own output-pill drags. */
export const TOKEN_DND_MIME = 'application/x-agent-output-token';

/**
 * Build the id-based expression token for a node output, matching
 * `collectUpstreamVariables` exactly (`{{node_2.output.city}}`). Id-based so
 * rename/duplicate never breaks a dropped reference.
 */
export const buildOutputToken = (nodeId: string, outputName: string): string =>
	`{{${nodeId}.output.${outputName}}}`;

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
