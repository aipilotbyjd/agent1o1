import type { TCanvasNodeData, TNodeDefinition, TNodePort, TPortType } from '../_types/node.type';

export const getNodeOutput = (data: TCanvasNodeData): unknown => {
	if (data.pinned) return data.pinnedOutput;
	if (data.testStatus === 'success') return data.testOutput;
	return data.outputPreview;
};

const valueType = (value: unknown): TPortType => {
	if (Array.isArray(value)) return 'list';
	if (value === null || value === undefined) return 'any';
	if (typeof value === 'object') return 'json';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'string';
};

/** Declared ports keep their identities; results supply fields missing from the catalog. */
export const getOutputPorts = (
	definition: TNodeDefinition | undefined,
	data: TCanvasNodeData,
): TNodePort[] => {
	const ports = [...(definition?.outputs ?? [])];
	for (const port of data.outputPortsSnapshot ?? []) {
		if (!ports.some((existing) => existing.id === port.id)) ports.push(port);
	}
	const sample = getNodeOutput(data);
	if (sample !== null && typeof sample === 'object' && !Array.isArray(sample)) {
		for (const [key, value] of Object.entries(sample)) {
			if (!ports.some((port) => (port.path ?? port.name) === key)) {
				ports.push({
					id: ports.some((port) => port.id === key) ? `field:${key}` : key,
					name: key,
					path: key,
					type: valueType(value),
				});
			}
		}
	}
	return ports.length ? ports : [{ id: 'out', name: 'output', path: '', type: 'any' }];
};
