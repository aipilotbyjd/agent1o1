import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';
import type { TNodeDefinition } from '../_types/node.type';

const makeDemoNode = (
	id: string,
	def: TNodeDefinition,
	position: { x: number; y: number },
	values: Record<string, unknown>,
	status: TCanvasNode['data']['status'] = 'idle',
	durationMs?: number,
): TCanvasNode => ({
	id,
	type:
		def.category === 'input'
			? 'input'
			: def.category === 'output'
				? 'output'
				: def.category === 'note'
					? 'note'
					: def.category === 'trigger'
						? 'trigger'
						: 'base',
	position,
	data: {
		defKey: def.key,
		label: def.label,
		values,
		status,
		durationMs,
	},
});

export const makeDemoWorkflow = (catalog: Record<string, TNodeDefinition>) => {
	const googleDrive = makeDemoNode(
		'node_google_drive',
		catalog['trigger.google_drive'],
		{ x: 100, y: 300 },
		{ folder: '', use_link: false },
		'idle',
	);
	const googleForms = makeDemoNode(
		'node_google_forms',
		catalog['trigger.google_form_responses'],
		{ x: 480, y: 260 },
		{ form: '', use_link: false },
		'idle',
	);
	const hubspot = makeDemoNode(
		'node_hubspot',
		catalog['trigger.hubspot_list'],
		{ x: 860, y: 150 },
		{ object_type: '', limit: '10 (Leave empty to read all objects)' },
		'idle',
	);
	const airtable = makeDemoNode(
		'node_airtable',
		catalog['trigger.airtable_reader'],
		{ x: 680, y: 550 },
		{ base: '' },
		'idle',
	);

	const edges: TCanvasEdge[] = [
		{
			id: 'edge_drive_forms',
			source: googleDrive.id,
			target: googleForms.id,
			sourceHandle: 'files',
			targetHandle: 'in',
		},
		{
			id: 'edge_forms_hubspot',
			source: googleForms.id,
			target: hubspot.id,
			sourceHandle: 'out',
			targetHandle: 'in',
		},
		{
			id: 'edge_forms_airtable',
			source: googleForms.id,
			target: airtable.id,
			sourceHandle: 'out',
			targetHandle: 'in',
		},
	];

	return {
		nodes: [googleDrive, googleForms, hubspot, airtable],
		edges,
	};
};
