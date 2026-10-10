import type {
	INodeCategory,
	INodeSchema,
	INodeSchemaProperty,
	INodeType,
} from '@/types/node-type.type';
import type { TNode } from '@/types/node.type';
import type { TNodeCategoryWithCount } from '@/types/catalog.type';
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

/** A schema `type` may be a union like `['integer', 'null']` — the first non-null wins. */
const primaryType = (type?: string | string[]) =>
	Array.isArray(type) ? type.find((candidate) => candidate !== 'null') : type;

const schemaTypeToPortType = (rawType?: string | string[]): TPortType => {
	const type = primaryType(rawType);
	if (type === 'string') return 'string';
	if (type === 'number' || type === 'integer') return 'number';
	if (type === 'boolean') return 'boolean';
	if (type === 'array') return 'list';
	if (type === 'object') return 'json';
	return 'any';
};

const isStringList = (property: INodeSchemaProperty) =>
	primaryType(property.type) === 'array' &&
	(!property.items || primaryType(property.items.type) === 'string');

/**
 * Built-in nodes say how a field should be drawn (`x-widget`, `x-options`);
 * older/custom schemas only carry a JSON type, so that's the fallback.
 */
const schemaTypeToFieldKind = (property: INodeSchemaProperty): TFieldKind => {
	if (property['x-options']) return 'dynamic';

	switch (property['x-widget']) {
		case 'credential':
			return 'credential';
		case 'textarea':
			return 'longtext';
		case 'select':
			return 'select';
		case 'toggle':
			return 'toggle';
		case 'number':
			return 'number';
		case 'key-value':
			return 'kv';
		case 'json':
			return 'code';
		case 'list':
			return isStringList(property) ? 'list' : 'code';
		case 'text':
		case 'emails':
		case 'datetime':
			return 'text';
	}

	const type = primaryType(property.type);
	if (property.enum?.length) return 'select';
	if (type === 'boolean') return 'toggle';
	if (type === 'number' || type === 'integer') return 'number';
	if (type === 'object' || type === 'array') return 'code';
	return 'text';
};

const humanize = (value: unknown) => {
	const str = typeof value === 'string' ? value : String(value ?? '');
	return str.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const schemaProperties = (schema?: INodeSchema) => schema?.properties ?? {};

const dynamicOptions = (property: INodeSchemaProperty): TNodeField['dynamic'] => {
	const options = property['x-options'];
	if (!options) return undefined;
	const type = primaryType(property.type);

	return {
		source: options.source,
		dependsOn: options.depends_on ?? [],
		uses: options.uses ?? [],
		multiple: options.multiple,
		allowCustom: options.allow_custom,
		valueType: type === 'array' ? 'array' : type === 'integer' ? 'integer' : 'string',
	};
};

const schemaToFields = (schema?: INodeSchema): TNodeField[] => {
	const required = new Set(schema?.required ?? []);

	return Object.entries(schemaProperties(schema))
		.filter(([, property]) => !property['x-hidden'])
		.map(([key, property]) => {
			const kind = schemaTypeToFieldKind(property);
			const type = primaryType(property.type);
			const labels = property['x-enum-labels'];

			return {
				key,
				label: property.title ?? property.label ?? humanize(key),
				kind,
				json: (kind === 'code' && (type === 'object' || type === 'array')) || undefined,
				kvObject: kind === 'kv' || undefined,
				credentialType: kind === 'credential' ? property['x-connector'] : undefined,
				dynamic: dynamicOptions(property),
				default: property.default,
				required: required.has(key),
				help: property.description,
				placeholder: property['x-placeholder'],
				advanced: property['x-advanced'] || undefined,
				min: property.minimum,
				max: property.maximum,
				options: property.enum?.map((option) => ({
					label: labels?.[option] ?? humanize(option),
					value: option,
				})),
			};
		});
};

const schemaToPorts = (
	schema: INodeSchema | undefined,
	fallbackName: string,
	fallbackType: TPortType,
): TNodePort[] => {
	const properties = schemaProperties(schema);
	const entries = Object.entries(properties);

	if (!entries.length) {
		return [
			{
				id: fallbackName,
				name: fallbackName,
				path: '',
				type:
					schemaTypeToPortType(schema?.type) === 'any'
						? fallbackType
						: schemaTypeToPortType(schema?.type),
			},
		];
	}

	return entries.map(([key, property]) => ({
		id: key,
		name: property.label ?? key,
		path: key,
		type: schemaTypeToPortType(property.type),
		required: schema?.required?.includes(key),
	}));
};

// The catalog endpoints return `TNode` / `TNodeCategoryWithCount` (nullable
// fields, untyped schemas). Everything below already falls back on null, so
// both shapes are read through the older, richer `INodeType` view.
export const mapApiNodeToDefinition = (
	apiNode: INodeType | TNode,
	categorySlug?: string,
	categoryColor?: string,
): TNodeDefinition => {
	const node = apiNode as INodeType;
	const parent = typeof node.category === 'object' ? node.category : undefined;
	const slug = categorySlug ?? parent?.slug;
	const color = node.color ?? categoryColor ?? parent?.color;
	const category = SLUG_TO_CATEGORY[slug ?? ''] ?? 'integration';
	// Built-in nodes flag `requires_connector` instead of naming a credential
	// type; their category slug is the connector key they resolve against.
	const credentialType =
		node.credential_type ??
		('requires_connector' in apiNode && apiNode.requires_connector
			? apiNode.category
			: undefined);
	const configFields = schemaToFields(node.config_schema ?? node.schema);
	const inputPorts = schemaToPorts(node.input_schema, 'input', 'any');
	const outputPorts = schemaToPorts(node.output_schema, 'output', 'any');
	// Built-in catalog entries omit output_schema. These two built-ins have stable
	// response contracts; successful node results supply any additional fields.
	if (!node.output_schema && node.type === 'ask_ai') {
		outputPorts.push(
			{ id: 'text', name: 'text', path: 'text', type: 'string' },
			{ id: 'usage', name: 'usage', path: 'usage', type: 'json' },
		);
	}
	if (!node.output_schema && node.type === 'gmail_get_message') {
		outputPorts.push(
			{ id: 'id', name: 'id', path: 'id', type: 'string' },
			{ id: 'threadId', name: 'threadId', path: 'threadId', type: 'string' },
			{ id: 'snippet', name: 'snippet', path: 'snippet', type: 'string' },
			{ id: 'payload', name: 'payload', path: 'payload', type: 'json' },
		);
	}
	const fields = credentialType
		? [
				{
					key: 'credential_id',
					label: 'Account',
					kind: 'credential' as const,
					credentialType,
					required: true,
					help: configFields.find((field) => field.key === 'credential_id')?.help,
				},
				...configFields.filter(
					(field) => field.key !== 'credential_id' && field.key !== 'access_token',
				),
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
		requiresCredential: Boolean(credentialType),
	};
};

export const mapApiCategoryToGroup = (
	apiCategory: INodeCategory | TNodeCategoryWithCount,
): TNodeCategoryGroup => {
	const category = apiCategory as INodeCategory;
	return {
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
		nodes: (category.nodes ?? []).map((node) =>
			mapApiNodeToDefinition(node, category.slug, category.color),
		),
	};
};

export const mapApiCategoriesToGroups = (
	categories: Array<INodeCategory | TNodeCategoryWithCount>,
): TNodeCategoryGroup[] => categories.map(mapApiCategoryToGroup).sort((a, b) => a.order - b.order);
