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

export const restoreInputConnections = (
	edges: TCanvasEdge[],
	configs: { key: string; config?: Record<string, unknown> | null }[],
): TCanvasEdge[] => {
	const result = [...edges];
	for (const node of configs) {
		const metadata = node.config?.__editorInputs as
			| { connections?: { source: string; sourceHandle?: string; targetHandle: string }[] }
			| undefined;
		if (!Array.isArray(metadata?.connections)) continue;
		for (const connection of metadata.connections) {
			if (
				!connection ||
				typeof connection.source !== 'string' ||
				typeof connection.targetHandle !== 'string' ||
				!connection.targetHandle.startsWith('parameter:')
			)
				continue;
			const index = result.findIndex(
				(edge) =>
					edge.source === connection.source &&
					edge.target === node.key &&
					!edge.targetHandle,
			);
			if (index < 0) continue;
			result[index] = {
				...result[index],
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
			};
		}
	}
	return result;
};
