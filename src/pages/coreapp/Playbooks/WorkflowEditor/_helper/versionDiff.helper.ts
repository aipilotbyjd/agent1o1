import type { TBuilderGraph, TBuilderGraphNode } from '@/types/workflow-builder.type';
import { getNodeDefinition } from './nodeCatalog.constants';

/**
 * What changed between two graphs, by node key. Positions are ignored —
 * moving a step around is not a change a person would call an edit — and
 * configs compare by value, so key order from the server doesn't matter.
 */
export type TGraphDiff = {
	added: string[];
	removed: string[];
	changed: string[];
	connectionsChanged: number;
};

export type TNodeChange = 'added' | 'changed';

/**
 * A value as the server stores it, so a round trip isn't mistaken for an
 * edit: Laravel saves `""` as `null`, and PHP returns an empty object as `[]`.
 */
const canonical = (value: unknown): string => {
	if (value === '') return 'null';
	if (Array.isArray(value)) return value.length ? `[${value.map(canonical).join(',')}]` : '{}';
	if (value && typeof value === 'object') {
		return `{${Object.keys(value)
			.filter((key) => (value as Record<string, unknown>)[key] !== undefined)
			.sort()
			.map(
				(key) =>
					`${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
			)
			.join(',')}}`;
	}
	return JSON.stringify(value ?? null);
};

const nodeSignature = (node: TBuilderGraphNode) => `${node.type}|${canonical(node.config ?? {})}`;

const connectionSignatures = (graph: TBuilderGraph) =>
	new Set(graph.edges.map((edge) => `${edge.from}>${edge.to}|${edge.condition ?? ''}`));

export const diffGraphs = (before: TBuilderGraph, after: TBuilderGraph): TGraphDiff => {
	const beforeByKey = new Map(before.nodes.map((node) => [node.key, node]));
	const afterKeys = new Set(after.nodes.map((node) => node.key));

	const added: string[] = [];
	const changed: string[] = [];
	after.nodes.forEach((node) => {
		const previous = beforeByKey.get(node.key);
		if (!previous) added.push(node.key);
		else if (nodeSignature(previous) !== nodeSignature(node)) changed.push(node.key);
	});
	const removed = before.nodes.filter((node) => !afterKeys.has(node.key)).map((node) => node.key);

	const beforeConnections = connectionSignatures(before);
	const afterConnections = connectionSignatures(after);
	const connectionsChanged =
		[...afterConnections].filter((edge) => !beforeConnections.has(edge)).length +
		[...beforeConnections].filter((edge) => !afterConnections.has(edge)).length;

	return { added, removed, changed, connectionsChanged };
};

export const hasDifferences = (diff: TGraphDiff) =>
	diff.added.length + diff.removed.length + diff.changed.length + diff.connectionsChanged > 0;

/** Node key → how it differs, for outlining steps on the canvas. */
export const nodeChangeMap = (diff: TGraphDiff): Map<string, TNodeChange> =>
	new Map<string, TNodeChange>([
		...diff.added.map((key) => [key, 'added'] as const),
		...diff.changed.map((key) => [key, 'changed'] as const),
	]);

/** The name a person knows a step by: its catalog label, falling back to its type. */
export const graphNodeLabel = (graph: TBuilderGraph, key: string) => {
	const node = graph.nodes.find((candidate) => candidate.key === key);
	if (!node) return key;
	return getNodeDefinition(node.type)?.label ?? node.type;
};

const listNames = (names: string[]) => {
	const unique = [...new Set(names)];
	if (unique.length <= 2) return unique.join(' and ');
	return `${unique.slice(0, 2).join(', ')} and ${unique.length - 2} more`;
};

/**
 * A one-line, plain-words summary of a diff — "Added Slack, changed Ask AI" —
 * offered as the note when publishing. `before` names removed steps, `after`
 * names the rest.
 */
export const describeDiff = (diff: TGraphDiff, before: TBuilderGraph, after: TBuilderGraph) => {
	const parts: string[] = [];
	if (diff.added.length) {
		parts.push(`Added ${listNames(diff.added.map((key) => graphNodeLabel(after, key)))}`);
	}
	if (diff.changed.length) {
		parts.push(`updated ${listNames(diff.changed.map((key) => graphNodeLabel(after, key)))}`);
	}
	if (diff.removed.length) {
		parts.push(`removed ${listNames(diff.removed.map((key) => graphNodeLabel(before, key)))}`);
	}
	if (!parts.length && diff.connectionsChanged) parts.push('Rewired connections between steps');
	const sentence = parts.join(', ');
	return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

export const EMPTY_GRAPH: TBuilderGraph = { nodes: [], edges: [] };
