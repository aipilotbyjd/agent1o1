import type {
	INodeCategory,
	INodeSchema,
	INodeSchemaProperty,
	INodeType,
} from '@/types/nodeType.type';
import type {
	TFieldKind,
	TNodeCategory,
	TNodeDefinition,
	TNodeField,
	TNodePort,
	TPortType,
} from '../_types/node.type';

export type TNodeCategoryGroup = {
	id: string;
	slug: string;
	label: string;
	description: string;
	icon: string;
	color: string;
	colorHex: string;
	kind: 'core' | 'app';
	order: number;
	nodesCount: number;
	connected: boolean;
	nodes: TNodeDefinition[];
};

const HEX_TO_HUE: Record<string, string> = {
	'#F59E0B': 'amber',
	'#8B5CF6': 'violet',
	'#3B82F6': 'sky',
	'#10B981': 'emerald',
	'#EC4899': 'fuchsia',
	'#F97316': 'amber',
	'#6B7280': 'zinc',
	'#0EA5E9': 'sky',
	'#6366F1': 'indigo',
};

const SLUG_TO_CATEGORY: Record<string, TNodeCategory> = {
	'ai-automation': 'ai',
	'triggers-events': 'trigger',
	'flow-logic': 'flow-control',
	'data-transform': 'data',
};

const normalizeHue = (color?: string) => {
	if (!color) return 'zinc';
	if (color.startsWith('#')) return HEX_TO_HUE[color.toUpperCase()] ?? 'zinc';
	return color;
};

const schemaTypeToPortType = (type?: string): TPortType => {
	if (type === 'string') return 'string';
	if (type === 'number' || type === 'integer') return 'number';
	if (type === 'boolean') return 'boolean';
	if (type === 'array') return 'list';
	if (type === 'object') return 'json';
	return 'any';
};

const schemaTypeToFieldKind = (property: INodeSchemaProperty): TFieldKind => {
	if (property.enum?.length) return 'select';
	if (property.type === 'boolean') return 'toggle';
	if (property.type === 'number' || property.type === 'integer') return 'number';
	if (property.type === 'object' || property.type === 'array') return 'code';
	return 'text';
};

const humanize = (value: unknown) => {
	const str = typeof value === 'string' ? value : String(value ?? '');
	return str.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const schemaProperties = (schema?: INodeSchema) => schema?.properties ?? {};

const schemaToFields = (schema?: INodeSchema): TNodeField[] => {
	const required = new Set(schema?.required ?? []);

	return Object.entries(schemaProperties(schema)).map(([key, property]) => ({
		key,
		label: property.label ?? humanize(key),
		kind: schemaTypeToFieldKind(property),
		default: property.default,
		required: required.has(key),
		help: property.description,
		options: property.enum?.map((option) => ({ label: humanize(option), value: option })),
	}));
};

const schemaToPorts = (
	schema: INodeSchema | undefined,
	fallbackName: string,
	fallbackType: TPortType,
): TNodePort[] => {
	const properties = schemaProperties(schema);
	const entries = Object.entries(properties);

	if (!entries.length && schema) {
		return [{ id: fallbackName, name: fallbackName, type: fallbackType }];
	}

	return entries.map(([key, property]) => ({
		id: key,
		name: property.label ?? key,
		type: schemaTypeToPortType(property.type),
		required: schema?.required?.includes(key),
	}));
};

export const mapApiNodeToDefinition = (
	node: INodeType,
	categorySlug?: string,
	categoryColor?: string,
): TNodeDefinition => {
	const parent = typeof node.category === 'object' ? node.category : undefined;
	const slug = categorySlug ?? parent?.slug;
	const color = node.color ?? categoryColor ?? parent?.color;
	const category = SLUG_TO_CATEGORY[slug ?? ''] ?? 'integration';
	const configFields = schemaToFields(node.config_schema ?? node.schema);
	const inputPorts = schemaToPorts(node.input_schema, 'input', 'any');
	const outputPorts = schemaToPorts(node.output_schema, 'output', 'any');
	const fields = node.credential_type
		? [
				{
					key: 'credential_id',
					label: 'Credential',
					kind: 'credential' as const,
					credentialType: node.credential_type,
					required: true,
					help: `Select a ${node.credential_type} credential.`,
				},
				...configFields,
			]
		: configFields;

	return {
		key: node.type,
		category,
		label: node.name,
		description: node.description ?? '',
		icon: node.icon ?? node.name.slice(0, 2).toUpperCase(),
		color: normalizeHue(color),
		colorHex: color,
		inputs: node.node_kind === 'trigger' ? [] : inputPorts,
		outputs: outputPorts,
		fields,
		requiresCredential: Boolean(node.credential_type),
	};
};

export const mapApiCategoryToGroup = (category: INodeCategory): TNodeCategoryGroup => ({
	id: category.id,
	slug: category.slug,
	label: category.name,
	description: category.description ?? '',
	icon: category.icon ?? '',
	color: normalizeHue(category.color),
	colorHex: category.color,
	kind: category.kind === 'app' ? 'app' : 'core',
	order: category.sort_order,
	nodesCount: category.nodes_count ?? category.nodes?.length ?? 0,
	connected: Boolean(category.connected),
	nodes: (category.nodes ?? []).map((node) =>
		mapApiNodeToDefinition(node, category.slug, category.color),
	),
});

export const mapApiCategoriesToGroups = (categories: INodeCategory[]): TNodeCategoryGroup[] =>
	categories.map(mapApiCategoryToGroup).sort((a, b) => a.order - b.order);
