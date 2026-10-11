import type { TCanvasNode } from '../_types/canvas.type';

/**
 * Resolves `{{ }}` expressions in the editor against outputs steps already
 * produced (test results, pinned data), so a field can preview what it will
 * read. Runs themselves happen on the server.
 */
export type TNodeOutputs = Record<string, unknown>;

/**
 * The templating context, shaped exactly like the backend engine's
 * (`WorkflowRunner::buildContext`): `{ input, nodes: { <id>: <output> } }`,
 * so `{{nodes.node_2.city}}` previews the same value a real run resolves.
 */
export type TRuntimeContext = Record<string, unknown>;

/**
 * Build the context from the outputs produced so far. References are by
 * stable node **id**, never by label (labels break on rename/duplicate).
 */
export const buildRuntimeContext = (
	nodes: TCanvasNode[],
	outputs: TNodeOutputs,
	input: Record<string, unknown> = {},
): TRuntimeContext => {
	const nodesScope: Record<string, unknown> = {};
	nodes.forEach((node) => {
		if (node.id in outputs) nodesScope[node.id] = outputs[node.id];
	});
	return { input, nodes: nodesScope };
};

const stringifyToken = (value: unknown): string => {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
};

/** Walk a dotted/indexed path (`nodes.node_2.data[0].id`) into the context. */
const getPath = (ctx: TRuntimeContext, path: string): unknown => {
	const parts = path
		.replace(/\[(\d+)\]/g, '.$1')
		.split('.')
		.map((p) => p.trim())
		.filter(Boolean);
	let cur: unknown = ctx;
	for (const part of parts) {
		if (cur === null || cur === undefined) return undefined;
		if (Array.isArray(cur)) {
			if (!/^\d+$/.test(part)) return undefined;
			cur = cur[Number(part)];
		} else if (typeof cur === 'object') {
			cur = (cur as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}
	return cur;
};

// Same charset as the backend's `SafePattern`: a path, nothing else. Anything
// else stays literal text there, so it does here too.
const WHOLE_TOKEN_RE = /^\s*\{\{\s*([a-zA-Z0-9_.[\]]+)\s*\}\}\s*$/;
const EMBEDDED_TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.[\]]*)\s*\}\}/g;

/**
 * Replace every `{{ … }}` token in a string with its resolved value, the way
 * the backend's `TemplateResolver` does: a string that is a single token
 * becomes the raw typed value (preserving arrays/objects/numbers); tokens
 * inside text are stringified. Tokens with no value yet are left as-is so an
 * in-progress expression still shows in the preview.
 */
export const resolveExpressions = (input: unknown, ctx: TRuntimeContext): unknown => {
	if (typeof input !== 'string') return input;
	if (!input.includes('{{')) return input;

	const single = input.match(WHOLE_TOKEN_RE);
	if (single) {
		const value = getPath(ctx, single[1]);
		if (value !== undefined) return value;
	}

	return input.replace(EMBEDDED_TOKEN_RE, (match, body: string) => {
		const value = getPath(ctx, body);
		return value === undefined ? match : stringifyToken(value);
	});
};
