import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';

/**
 * Frontend execution runtime for the workflow editor.
 *
 * There is no backend here — instead of issuing real network/API calls we run a
 * deterministic simulation that genuinely flows data from node to node, resolves
 * {{variable}} expressions against upstream outputs, evaluates branch conditions,
 * and executes user-authored Code nodes in a sandboxed Function. This is what
 * makes loops, conditions, expressions and the Code node behave for real.
 */

export type TNodeOutputs = Record<string, unknown>;

/** Sanitise a value into something safe to read inside an evaluated expression. */
const asScopeObject = (value: unknown): Record<string, unknown> => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return { value };
};

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

/**
 * Extract an iterable list from a value: the value itself when it's an array, or
 * the first array-valued field (preferring conventional names) when it's an
 * object. Mirrors the backend NodeRunner::firstList so per-node Loop Mode fans
 * out over the same list in the local simulation as it does in a real run.
 */
export const firstList = (value: unknown): unknown[] | null => {
	if (Array.isArray(value)) return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		for (const key of ['items', 'data', 'results', 'rows', 'records', 'body']) {
			if (Array.isArray(obj[key])) return obj[key] as unknown[];
		}
		for (const nested of Object.values(obj)) {
			if (Array.isArray(nested)) return nested as unknown[];
		}
	}
	return null;
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

/** Resolve every field value's expressions against the current context. */
export const resolveNodeValues = (
	values: Record<string, unknown>,
	ctx: TRuntimeContext,
): Record<string, unknown> => {
	const resolved: Record<string, unknown> = {};
	Object.entries(values).forEach(([key, value]) => {
		resolved[key] = resolveExpressions(value, ctx);
	});
	return resolved;
};

/**
 * Evaluate a boolean expression against an input payload. The payload's own keys
 * are exposed as locals (so `lead.score >= 80` works) plus `input`, `value`,
 * `item` and `$json` aliases. Failures resolve to false.
 */
export const evaluateCondition = (expression: string, input: unknown): boolean => {
	if (!expression?.trim()) return true;
	const scope = asScopeObject(input);
	const keys = Object.keys(scope);
	try {
		const fn = new Function(
			...keys,
			'input',
			'value',
			'item',
			'$json',
			`"use strict"; return Boolean(${expression});`,
		);
		return Boolean(fn(...keys.map((k) => scope[k]), input, input, input, input));
	} catch {
		return false;
	}
};

export type TExecutionResult = {
	output: unknown;
	/** For branching nodes, which output handle is active. */
	branch?: string;
};

const sampleFromSchema = (raw: unknown): unknown => {
	if (typeof raw !== 'string') return { extracted: true };
	try {
		const schema = JSON.parse(raw) as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		Object.entries(schema).forEach(([key, type]) => {
			out[key] = type === 'number' ? 42 : type === 'boolean' ? true : `sample ${key}`;
		});
		return out;
	} catch {
		return { extracted: 'value', confidence: 0.92 };
	}
};

/**
 * Execute a single node given its resolved field values and upstream inputs.
 * Returns the produced output and (for branch nodes) the active branch handle.
 */
export const executeNode = (
	node: TCanvasNode,
	inputs: unknown[],
	resolvedValues: Record<string, unknown>,
): TExecutionResult => {
	const def = getNodeDefinition(node.data.defKey, node.data.definition);
	const primaryInput = inputs.length <= 1 ? inputs[0] : inputs;
	const category = def?.category;

	switch (def?.key) {
		case 'utility.code': {
			const code = String(resolvedValues.code ?? 'return input;');
			try {
				const fn = new Function('input', 'items', '$json', `"use strict";\n${code}`);
				return { output: fn(primaryInput, inputs, primaryInput) };
			} catch (error) {
				throw new Error(error instanceof Error ? error.message : 'Code execution failed');
			}
		}
		case 'logic.condition':
		case 'logic.if': {
			const expr = String(resolvedValues.expression ?? '');
			const passed = evaluateCondition(expr, primaryInput);
			return {
				output: { branch: passed ? 'true' : 'false', passed, input: primaryInput },
				branch: passed ? 'true' : 'false',
			};
		}
		case 'utility.delay':
			return { output: primaryInput ?? resolvedValues };
		default:
			break;
	}

	switch (category) {
		case 'trigger':
			return {
				output: {
					triggeredAt: new Date().toISOString(),
					...resolvedValues,
				},
			};
		case 'input':
			return {
				output: {
					value: resolvedValues.question ?? resolvedValues.value ?? 'sample input',
				},
			};
		case 'ai': {
			const prompt = String(resolvedValues.prompt ?? resolvedValues.goal ?? '');
			return {
				output: prompt
					? `AI response for: "${prompt.slice(0, 80)}"`
					: 'Generated AI response preview.',
			};
		}
		case 'extract':
			return { output: sampleFromSchema(resolvedValues.schema) };
		case 'scrape':
			return {
				output: `# ${resolvedValues.url ?? 'page'}\n\nFetched markdown content preview.`,
			};
		case 'data':
			return {
				output: {
					status: 200,
					url: resolvedValues.url,
					method: resolvedValues.method ?? 'GET',
					data: { id: 1, value: 'sample', input: primaryInput ?? null },
				},
			};
		case 'storage':
			return {
				output: {
					operation: resolvedValues.operation ?? 'upsert',
					table: resolvedValues.table,
					rows: [{ id: 1 }, { id: 2 }],
					count: 2,
				},
			};
		case 'loop': {
			const items = Array.isArray(primaryInput)
				? primaryInput
				: [{ index: 0, item: primaryInput }];
			return { output: { items, count: items.length } };
		}
		case 'integration':
			return {
				output: {
					sent: true,
					channel: resolvedValues.channel,
					message: resolvedValues.message,
				},
			};
		case 'output':
			return { output: primaryInput ?? resolvedValues.name ?? 'result' };
		default:
			return { output: { ...resolvedValues, input: primaryInput ?? null } };
	}
};

/** Active edge = source ran and (if source branched) the handle matches the decision. */
export const isEdgeActive = (
	edge: TCanvasEdge,
	outputs: TNodeOutputs,
	branches: Record<string, string>,
	skipped: Set<string>,
): boolean => {
	if (skipped.has(edge.source)) return false;
	if (!(edge.source in outputs)) return false;
	const branch = branches[edge.source];
	if (branch && edge.sourceHandle) return edge.sourceHandle === branch;
	return true;
};
