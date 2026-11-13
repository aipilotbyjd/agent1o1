import { getOutputPorts, getNodeOutput } from './outputPorts.helper';
import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';
import type { TNodeDefinition, TNodeField, TNodePort } from '../_types/node.type';

export const dynamicInputId = (key: string) => `parameter:${key}`;
export const canExposeInput = (field: TNodeField) => field.kind !== 'credential';
export const dynamicInputPorts = (
	def: TNodeDefinition | undefined,
	keys: string[] = [],
): TNodePort[] =>
	(def?.fields ?? [])
		.filter((field) => keys.includes(field.key) && canExposeInput(field))
		.map((field) => ({
			id: dynamicInputId(field.key),
			name: field.label,
			required: field.required,
			type:
				field.kind === 'toggle'
					? 'boolean'
					: field.kind === 'number'
						? 'number'
						: ['list', 'multiselect'].includes(field.kind)
							? 'list'
							: field.json || field.kind === 'kv'
								? 'json'
								: 'string',
		}));

// Canvas settings travel with the node config because the graph API has no port metadata.
export const serializeNodeConfig = (node: TCanvasNode, edges: TCanvasEdge[]) => ({
	...node.data.values,
	...(node.data.dynamicInputKeys?.length ||
	node.data.outputPortsSnapshot?.length ||
	getNodeOutput(node.data) !== undefined ||
	edges.some((edge) => edge.target === node.id && edge.targetHandle?.startsWith('parameter:'))
		? {
				__editorInputs: {
					keys: node.data.dynamicInputKeys ?? [],
					outputs: getOutputPorts(
						getNodeDefinition(node.data.defKey, node.data.definition),
						node.data,
					),
					fixedValues: node.data.fixedInputValues ?? {},
					connections: edges
						.filter(
							(edge) =>
								edge.target === node.id &&
								edge.targetHandle?.startsWith('parameter:'),
						)
						.map((edge) => ({
							source: edge.source,
							sourceHandle: edge.sourceHandle,
							targetHandle: edge.targetHandle,
						})),
					// The graph keeps one edge per node pair, so record which sources
					// also have an ordinary connection to restore it alongside the wires.
					flowSources: [
						...new Set(
							edges
								.filter((edge) => edge.target === node.id && !edge.targetHandle)
								.map((edge) => edge.source),
						),
					],
				},
			}
		: {}),
});

export const readNodeConfig = (config: Record<string, unknown>) => {
	const { __editorInputs, ...values } = config;
	const metadata =
		__editorInputs && typeof __editorInputs === 'object'
			? (__editorInputs as Record<string, unknown>)
			: {};
	return {
		values,
		outputPortsSnapshot: Array.isArray(metadata.outputs)
			? metadata.outputs.filter(
					(port) =>
						port &&
						typeof port.id === 'string' &&
						typeof port.name === 'string' &&
						['any', 'string', 'number', 'boolean', 'list', 'file', 'json'].includes(
							port.type,
						),
				)
			: [],
		dynamicInputKeys: Array.isArray(metadata.keys)
			? metadata.keys.filter((key): key is string => typeof key === 'string')
			: [],
		fixedInputValues:
			metadata.fixedValues && typeof metadata.fixedValues === 'object'
				? (metadata.fixedValues as Record<string, unknown>)
				: {},
	};
};

type TStoredConnection = { source: string; sourceHandle?: string; targetHandle: string };

/**
 * Turn the graph's plain edges back into the canvas's wired inputs. The
 * backend keeps a single edge per node pair, so each recorded wire becomes
 * its own edge next to it, and the plain edge stays only where the node also
 * had an ordinary connection from that source. A wire whose edge is no longer
 * in the graph (removed by the assistant, say) is dropped.
 */
export const restoreInputConnections = (
	edges: TCanvasEdge[],
	configs: { key: string; config?: Record<string, unknown> | null }[],
): TCanvasEdge[] => {
	let result = [...edges];
	for (const node of configs) {
		const metadata = node.config?.__editorInputs as
			| { connections?: unknown; flowSources?: unknown }
			| undefined;
		if (!Array.isArray(metadata?.connections)) continue;
		const connections = metadata.connections.filter(
			(connection): connection is TStoredConnection =>
				Boolean(connection) &&
				typeof connection.source === 'string' &&
				typeof connection.targetHandle === 'string' &&
				connection.targetHandle.startsWith('parameter:'),
		);
		const flowSources = Array.isArray(metadata.flowSources)
			? new Set(
					metadata.flowSources.filter((item): item is string => typeof item === 'string'),
				)
			: null;
		const wired = new Set<string>();
		for (const connection of connections) {
			const plain = result.find(
				(edge) =>
					edge.source === connection.source &&
					edge.target === node.key &&
					!edge.targetHandle,
			);
			if (!plain) continue;
			wired.add(connection.source);
			result.push({
				...plain,
				id: `${plain.id}_${connection.targetHandle}`,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
			});
		}
		// Workflows saved before `flowSources` existed had no ordinary edge
		// alongside a wire, so theirs is dropped as before.
		result = result.filter(
			(edge) =>
				edge.target !== node.key ||
				edge.targetHandle ||
				!wired.has(edge.source) ||
				(flowSources?.has(edge.source) ?? false),
		);
	}
	return result;
};
