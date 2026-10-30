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

export type TCategoryFunction = { slug: string; label: string; order: number };
export type TCategoryVendor = { slug: string; label: string };

export type TNodeCategoryGroup = {
	id: string;
	slug: string;
	label: string;
	description: string;
	icon: string;
	color: string;
	colorHex: string;
	kind: 'core' | 'app';
	/** What an app is used for, primary first; empty for core categories. */
	functions: TCategoryFunction[];
	/** Who makes it, when it belongs to a suite (Google, Zoho...). */
	vendor: TCategoryVendor | null;
	order: number;
	nodesCount: number;
	/** What the library offers: listed nodes only. */
	nodes: TNodeDefinition[];
	/** Every node, including retired ones: what saved workflows resolve against. */
	allNodes: TNodeDefinition[];
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
	'inputs-outputs': 'input',
	'flow-logic': 'flow-control',
	'data-transform': 'data',
};

const normalizeHue = (color?: string) => {
	if (!color) return 'zinc';
	if (color.startsWith('#')) return HEX_TO_HUE[color.toUpperCase()] ?? 'zinc';
	return color;
};

/** A schema `type` may be a union like `['integer', 'null']`: the first non-null wins. */
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
	// An app reader listed under Triggers & Events is still that app's node:
	// its own category keeps its colour, credential and ordinary node card.
	const slug =
		node.trigger_mode && typeof node.category === 'string'
			? node.category
			: (categorySlug ?? parent?.slug);
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
		appSlug: slug ?? (typeof node.category === 'string' ? node.category : undefined),
		nodeKind: node.node_kind === 'trigger' ? 'trigger' : 'action',
		supportsTrigger: Boolean(node.supports_trigger),
		startsAsTrigger: Boolean(node.trigger_mode),
		listed: node.listed !== false,
	};
};

/** Whether the library should offer a definition: retired nodes are hidden. */
export const isListed = (definition: TNodeDefinition) => definition.listed !== false;

export const mapApiCategoryToGroup = (
	apiCategory: INodeCategory | TNodeCategoryWithCount,
): TNodeCategoryGroup => {
	const category = apiCategory as INodeCategory;
	const allNodes = (category.nodes ?? []).map((node) =>
		mapApiNodeToDefinition(node, category.slug, category.color),
	);
	return {
		id: category.id,
		slug: category.slug,
		label: category.name,
		description: category.description ?? '',
		icon: category.icon ?? '',
		color: normalizeHue(category.color),
		colorHex: category.color,
		kind: category.kind === 'app' ? 'app' : 'core',
		functions: category.functions ?? [],
		vendor: category.vendor ?? null,
		order: category.sort_order,
		nodesCount: category.nodes_count ?? category.nodes?.length ?? 0,
		nodes: allNodes.filter(isListed),
		allNodes,
	};
};

export const mapApiCategoriesToGroups = (
	categories: Array<INodeCategory | TNodeCategoryWithCount>,
): TNodeCategoryGroup[] => categories.map(mapApiCategoryToGroup).sort((a, b) => a.order - b.order);

export type TAppSection = {
	id: string;
	label: string;
	order: number;
	apps: TNodeCategoryGroup[];
};

const OTHER_SECTION: TCategoryFunction = {
	slug: 'other',
	label: 'Other apps',
	order: Number.MAX_SAFE_INTEGER,
};

/** App categories filed under each function they are used for, sections in the backend's order and apps in theirs. An app with several functions appears in each. */
export const groupAppsBySection = (apps: TNodeCategoryGroup[]): TAppSection[] => {
	const sections = new Map<string, TAppSection>();

	for (const app of apps) {
		for (const fn of app.functions.length > 0 ? app.functions : [OTHER_SECTION]) {
			const section = sections.get(fn.slug) ?? {
				id: fn.slug,
				label: fn.label,
				order: fn.order,
				apps: [],
			};
			section.apps.push(app);
			sections.set(fn.slug, section);
		}
	}

	return [...sections.values()]
		.map((section) => ({
			...section,
			apps: [...section.apps].sort((a, b) => a.order - b.order),
		}))
		.sort((a, b) => a.order - b.order);
};

/** Makers with two or more apps: a one-app maker has no family worth a filter. */
export const appVendors = (apps: TNodeCategoryGroup[]): TCategoryVendor[] => {
	const counts = new Map<string, { vendor: TCategoryVendor; count: number }>();

	for (const app of apps) {
		if (!app.vendor) continue;
		const entry = counts.get(app.vendor.slug) ?? { vendor: app.vendor, count: 0 };
		entry.count += 1;
		counts.set(app.vendor.slug, entry);
	}

	return [...counts.values()]
		.filter((entry) => entry.count > 1)
		.map((entry) => entry.vendor)
		.sort((a, b) => a.label.localeCompare(b.label));
};

/** Apps whose name, maker or any function matches the words typed, so "marketing" finds Google Analytics. */
export const matchApps = (apps: TNodeCategoryGroup[], query: string): TNodeCategoryGroup[] => {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return [];

	return apps.filter((app) => {
		const haystack = [
			app.label,
			app.slug,
			app.vendor?.label,
			...app.functions.map((fn) => fn.label),
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return words.every((word) => haystack.includes(word));
	});
};

/** Nodes whose name or description contains every word typed. */
export const filterNodes = (nodes: TNodeDefinition[], query: string): TNodeDefinition[] => {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return nodes;

	return nodes.filter((node) => {
		const haystack = `${node.label} ${node.description}`.toLowerCase();
		return words.every((word) => haystack.includes(word));
	});
};

const canStartFlow = (node: TNodeDefinition) =>
	node.nodeKind === 'trigger' || Boolean(node.supportsTrigger);

/** An app's nodes split into the ones that can start a flow (instant triggers and readers) and the ones that only do a job in it. */
export const splitNodesByKind = (nodes: TNodeDefinition[]) => ({
	triggers: nodes.filter(canStartFlow),
	actions: nodes.filter((node) => !canStartFlow(node)),
});

export type TAppNodes = { slug: string; label: string; nodes: TNodeDefinition[] };

/** Nodes from many apps filed under their app, the built-in ones first and then apps by name. */
export const groupNodesByApp = (
	nodes: TNodeDefinition[],
	labelFor: (appSlug: string) => string | undefined,
	builtInSlug = 'triggers-events',
): TAppNodes[] => {
	const apps = new Map<string, TAppNodes>();

	for (const node of nodes) {
		const slug = node.appSlug ?? builtInSlug;
		const app = apps.get(slug) ?? {
			slug,
			label: slug === builtInSlug ? 'Built-in' : (labelFor(slug) ?? slug),
			nodes: [],
		};
		app.nodes.push(node);
		apps.set(slug, app);
	}

	return [...apps.values()].sort((a, b) =>
		a.slug === builtInSlug ? -1 : b.slug === builtInSlug ? 1 : a.label.localeCompare(b.label),
	);
};
