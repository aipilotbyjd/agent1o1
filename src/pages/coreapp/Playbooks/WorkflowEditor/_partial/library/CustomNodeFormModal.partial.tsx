import { useMemo, useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useNodeCategories } from '@/api/modules/catalog';
import { useConnectors } from '@/api/modules/connectors';
import { useCreateNode, useUpdateNode } from '@/api/modules/nodes';
import type { TCreateCustomNodeDto, TCustomNode } from '@/types/node.type';
import Modal from '../dialogs/Modal.partial';
import NodeIcon from './NodeIcon.partial';
import { tintStyle } from './library.util';

// Names resolve through `Icon`'s pascalcase lookup; all of these are in `huge/used.ts`.
const ICON_CHOICES = [
	'puzzle',
	'zap',
	'code',
	'api',
	'database',
	'globe-02',
	'mail-01',
	'cube',
	'plug-01',
	'rocket',
	'settings-01',
	'wrench-01',
];

const COLOR_CHOICES = [
	'#6B7280',
	'#6366F1',
	'#0EA5E9',
	'#10B981',
	'#F59E0B',
	'#EF4444',
	'#EC4899',
	'#8B5CF6',
	'#14B8A6',
	'#F97316',
];

type TFieldType = 'string' | 'number' | 'boolean' | 'select' | 'json';

type TFieldRow = {
	uid: string;
	key: string;
	keyEdited: boolean;
	label: string;
	type: TFieldType;
	required: boolean;
	description: string;
	options: string;
	// Whatever else the stored property carried, so an edit never drops it.
	extra: Record<string, unknown>;
};

type TSchema = Record<string, unknown> & {
	properties?: Record<string, Record<string, unknown>> | unknown[];
	required?: string[];
};

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
const labelClass = 'text-[10px] font-bold text-zinc-400 uppercase';

const DEFAULT_PORT_SCHEMA = '{\n  "type": "object"\n}';

let uidSeed = 0;
const nextUid = () => `field_${Date.now()}_${uidSeed++}`;

const toKey = (label: string) =>
	label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');

const asSchema = (value: unknown): TSchema =>
	value && typeof value === 'object' && !Array.isArray(value) ? (value as TSchema) : {};

const rowsFromSchema = (value: unknown): TFieldRow[] => {
	const schema = asSchema(value);
	// PHP hands an empty `properties` object back as `[]`.
	const properties = Array.isArray(schema.properties) ? {} : (schema.properties ?? {});
	const required = new Set(schema.required ?? []);

	return Object.entries(properties).map(([key, raw]) => {
		const { type, enum: options, label, description, ...extra } = raw ?? {};
		const list = Array.isArray(options) ? options.map(String) : [];
		const fieldType: TFieldType = list.length
			? 'select'
			: type === 'number' || type === 'integer'
				? 'number'
				: type === 'boolean'
					? 'boolean'
					: type === 'object' || type === 'array'
						? 'json'
						: 'string';

		return {
			uid: nextUid(),
			key,
			keyEdited: true,
			label: typeof label === 'string' ? label : '',
			type: fieldType,
			required: required.has(key),
			description: typeof description === 'string' ? description : '',
			options: list.join(', '),
			// Keep `integer` / `array` exact when the type family didn't change.
			extra: { ...extra, __type: type },
		};
	});
};

const schemaFromRows = (rows: TFieldRow[], original: unknown) => {
	const { properties: _properties, required: _required, ...rest } = asSchema(original);
	const properties: Record<string, Record<string, unknown>> = {};

	rows.forEach((row) => {
		const { __type: storedType, ...extra } = row.extra;
		const type =
			row.type === 'select'
				? 'string'
				: row.type === 'json'
					? storedType === 'array'
						? 'array'
						: 'object'
					: row.type === 'number'
						? storedType === 'integer'
							? 'integer'
							: 'number'
						: row.type;
		const options = row.options
			.split(',')
			.map((option) => option.trim())
			.filter(Boolean);

		properties[row.key] = {
			...extra,
			type,
			...(row.label.trim() ? { label: row.label.trim() } : {}),
			...(row.description.trim() ? { description: row.description.trim() } : {}),
			...(row.type === 'select' ? { enum: options } : {}),
		};
	});

	const required = rows.filter((row) => row.required).map((row) => row.key);

	return { ...rest, type: 'object', properties, ...(required.length ? { required } : {}) };
};

const schemaText = (value: unknown) =>
	value && typeof value === 'object' ? JSON.stringify(value, null, 2) : '';

const parseSchemaText = (text: string, label: string) => {
	if (!text.trim()) return { value: null };
	try {
		const parsed: unknown = JSON.parse(text);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { error: `${label} must be a JSON object.` };
		}
		return { value: parsed as Record<string, unknown> };
	} catch {
		return { error: `${label} is not valid JSON.` };
	}
};

type Props = {
	workspaceId: string;
	node?: TCustomNode;
	onClose: () => void;
};

const CustomNodeFormModal = ({ workspaceId, node, onClose }: Props) => {
	const isEdit = Boolean(node);
	const { data: categories = [] } = useNodeCategories();
	const { data: connectors = [] } = useConnectors();
	const createNode = useCreateNode(workspaceId);
	const updateNode = useUpdateNode(workspaceId);
	const isSaving = createNode.isPending || updateNode.isPending;

	const [name, setName] = useState(node?.name ?? '');
	const [description, setDescription] = useState(node?.description ?? '');
	// The resource sends the category slug; the API wants its id back.
	const [categorySlug, setCategorySlug] = useState(node?.category ?? 'custom');
	const [credentialType, setCredentialType] = useState(node?.credential_type ?? '');
	const [icon, setIcon] = useState(node?.icon ?? 'puzzle');
	const [color, setColor] = useState(node?.color ?? COLOR_CHOICES[0]);
	const [rows, setRows] = useState<TFieldRow[]>(() => rowsFromSchema(node?.config_schema));
	const [inputSchema, setInputSchema] = useState(
		node ? schemaText(node.input_schema) : DEFAULT_PORT_SCHEMA,
	);
	const [outputSchema, setOutputSchema] = useState(
		node ? schemaText(node.output_schema) : DEFAULT_PORT_SCHEMA,
	);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [error, setError] = useState('');

	const sortedCategories = useMemo(
		() =>
			[...categories].sort(
				(a, b) =>
					Number(a.kind !== 'core') - Number(b.kind !== 'core') ||
					a.sort_order - b.sort_order,
			),
		[categories],
	);

	const updateRow = (uid: string, patch: Partial<TFieldRow>) =>
		setRows((prev) => prev.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));

	const handleAddRow = () =>
		setRows((prev) => [
			...prev,
			{
				uid: nextUid(),
				key: '',
				keyEdited: false,
				label: '',
				type: 'string',
				required: false,
				description: '',
				options: '',
				extra: {},
			},
		]);

	const handleSave = () => {
		if (isSaving) return;
		setError('');

		const trimmedName = name.trim();
		if (!trimmedName) return setError('Give the node a name.');

		const categoryId = categories.find((category) => category.slug === categorySlug)?.id;
		if (!categoryId) return setError('Pick a category.');

		const keys = rows.map((row) => row.key.trim());
		if (keys.some((key) => !key)) return setError('Every config field needs a key.');
		if (keys.some((key) => !/^[a-z_][a-z0-9_]*$/.test(key))) {
			return setError('Field keys use lowercase letters, numbers and underscores only.');
		}
		if (new Set(keys).size !== keys.length) return setError('Field keys must be unique.');
		const emptySelect = rows.find(
			(row) =>
				row.type === 'select' && !row.options.split(',').some((option) => option.trim()),
		);
		if (emptySelect) return setError(`"${emptySelect.key}" needs at least one option.`);

		const input = parseSchemaText(inputSchema, 'Input schema');
		if (input.error) return setError(input.error);
		const output = parseSchemaText(outputSchema, 'Output schema');
		if (output.error) return setError(output.error);

		const payload: TCreateCustomNodeDto = {
			category_id: categoryId,
			name: trimmedName,
			description: description.trim() || null,
			icon: icon || null,
			color: color || null,
			config_schema: schemaFromRows(
				rows.map((row) => ({ ...row, key: row.key.trim() })),
				node?.config_schema,
			),
			input_schema: input.value,
			output_schema: output.value,
			credential_type: credentialType || null,
		};

		if (node) {
			updateNode.mutate({ id: node.id, body: payload }, { onSuccess: onClose });
			return;
		}
		createNode.mutate(payload, {
			onSuccess: (created) => {
				notify.success(`“${created.name}” added to your custom nodes`);
				onClose();
			},
		});
	};

	return (
		<Modal title={isEdit ? 'Edit Custom Node' : 'New Custom Node'} onClose={onClose} size='md'>
			<div className='flex flex-col gap-5 text-sm text-zinc-800 dark:text-zinc-200'>
				<div className='flex items-start gap-4'>
					<span
						className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'
						style={tintStyle(color)}>
						<NodeIcon icon={icon} size={22} />
					</span>
					<div className='flex flex-1 flex-col gap-3'>
						<div className='flex flex-col gap-1.5'>
							<label htmlFor='custom-node-name' className={labelClass}>
								Name
							</label>
							<input
								id='custom-node-name'
								type='text'
								value={name}
								maxLength={255}
								onChange={(event) => setName(event.target.value)}
								className={inputClass}
								placeholder='e.g. Enrich Lead'
							/>
						</div>
						<div className='flex flex-col gap-1.5'>
							<label htmlFor='custom-node-description' className={labelClass}>
								Description
							</label>
							<textarea
								id='custom-node-description'
								value={description}
								rows={2}
								onChange={(event) => setDescription(event.target.value)}
								className={`${inputClass} resize-none`}
								placeholder='What this step does'
							/>
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<div className='flex flex-col gap-1.5'>
						<label htmlFor='custom-node-category' className={labelClass}>
							Category
						</label>
						<select
							id='custom-node-category'
							value={categorySlug}
							onChange={(event) => setCategorySlug(event.target.value)}
							className={inputClass}>
							{sortedCategories.map((category) => (
								<option key={category.id} value={category.slug}>
									{category.name}
								</option>
							))}
						</select>
					</div>
					<div className='flex flex-col gap-1.5'>
						<label htmlFor='custom-node-credential' className={labelClass}>
							Credential
						</label>
						<select
							id='custom-node-credential'
							value={credentialType}
							onChange={(event) => setCredentialType(event.target.value)}
							className={inputClass}>
							<option value=''>None</option>
							{connectors.map((connector) => (
								<option key={connector.id} value={connector.key}>
									{connector.name}
								</option>
							))}
							{credentialType &&
								!connectors.some(
									(connector) => connector.key === credentialType,
								) && <option value={credentialType}>{credentialType}</option>}
						</select>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<div className='flex flex-col gap-1.5'>
						<span className={labelClass}>Icon</span>
						<div className='flex flex-wrap gap-1.5'>
							{ICON_CHOICES.map((choice) => (
								<button
									key={choice}
									type='button'
									aria-label={`Icon ${choice}`}
									aria-pressed={icon === choice}
									onClick={() => setIcon(choice)}
									className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
										icon === choice
											? 'border-primary-400 bg-primary-50 text-primary-600 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
											: 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
									}`}>
									<NodeIcon icon={choice} size={15} />
								</button>
							))}
						</div>
					</div>
					<div className='flex flex-col gap-1.5'>
						<span className={labelClass}>Color</span>
						<div className='flex flex-wrap gap-1.5'>
							{COLOR_CHOICES.map((choice) => (
								<button
									key={choice}
									type='button'
									aria-label={`Color ${choice}`}
									aria-pressed={color === choice}
									onClick={() => setColor(choice)}
									className={`h-8 w-8 rounded-lg border-2 transition ${
										color === choice
											? 'border-zinc-900 dark:border-white'
											: 'border-transparent hover:scale-105'
									}`}
									style={{ backgroundColor: choice }}
								/>
							))}
						</div>
					</div>
				</div>

				<div className='flex flex-col gap-3'>
					<div className='flex items-center justify-between'>
						<div>
							<div className='text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
								Config fields
							</div>
							<div className='text-[11px] text-zinc-400 dark:text-zinc-500'>
								What someone fills in when they drop this node on a canvas.
							</div>
						</div>
						<button
							type='button'
							onClick={handleAddRow}
							className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 active:scale-97 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
							<Plus size={13} />
							Add field
						</button>
					</div>

					{rows.length === 0 && (
						<div className='rounded-lg border border-dashed border-zinc-200 py-5 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'>
							No config fields. The node will have nothing to configure.
						</div>
					)}

					{rows.map((row) => (
						<div
							key={row.uid}
							className='flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
							<div className='flex items-end gap-2.5'>
								<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
									<label htmlFor={`${row.uid}-label`} className={labelClass}>
										Label
									</label>
									<input
										id={`${row.uid}-label`}
										type='text'
										value={row.label}
										onChange={(event) =>
											updateRow(row.uid, {
												label: event.target.value,
												...(row.keyEdited
													? {}
													: { key: toKey(event.target.value) }),
											})
										}
										className={inputClass}
										placeholder='e.g. Email address'
									/>
								</div>
								<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
									<label htmlFor={`${row.uid}-key`} className={labelClass}>
										Key
									</label>
									<input
										id={`${row.uid}-key`}
										type='text'
										value={row.key}
										onChange={(event) =>
											updateRow(row.uid, {
												key: event.target.value,
												keyEdited: true,
											})
										}
										className={`${inputClass} font-mono`}
										placeholder='email_address'
									/>
								</div>
								<div className='flex w-28 shrink-0 flex-col gap-1.5'>
									<label htmlFor={`${row.uid}-type`} className={labelClass}>
										Type
									</label>
									<select
										id={`${row.uid}-type`}
										value={row.type}
										onChange={(event) =>
											updateRow(row.uid, {
												type: event.target.value as TFieldType,
											})
										}
										className={inputClass}>
										<option value='string'>Text</option>
										<option value='number'>Number</option>
										<option value='boolean'>Boolean</option>
										<option value='select'>Select</option>
										<option value='json'>JSON</option>
									</select>
								</div>
								<button
									type='button'
									aria-label={`Remove ${row.label || row.key || 'field'}`}
									onClick={() =>
										setRows((prev) =>
											prev.filter((item) => item.uid !== row.uid),
										)
									}
									className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-rose-500 hover:bg-rose-50 dark:border-zinc-800 dark:hover:bg-rose-950/20'>
									<Trash2 size={14} />
								</button>
							</div>
							<div className='flex flex-col gap-2.5 sm:flex-row sm:items-center'>
								<input
									type='text'
									aria-label='Help text'
									value={row.description}
									onChange={(event) =>
										updateRow(row.uid, { description: event.target.value })
									}
									className={`${inputClass} sm:flex-1`}
									placeholder='Help text (optional)'
								/>
								{row.type === 'select' && (
									<input
										type='text'
										aria-label='Options'
										value={row.options}
										onChange={(event) =>
											updateRow(row.uid, { options: event.target.value })
										}
										className={`${inputClass} sm:flex-1`}
										placeholder='Options, comma separated'
									/>
								)}
								<label className='flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
									<input
										type='checkbox'
										checked={row.required}
										onChange={(event) =>
											updateRow(row.uid, { required: event.target.checked })
										}
										className='accent-primary-500'
									/>
									Required
								</label>
							</div>
						</div>
					))}
				</div>

				<div className='rounded-lg border border-zinc-200 dark:border-zinc-800'>
					<button
						type='button'
						aria-expanded={advancedOpen}
						onClick={() => setAdvancedOpen((open) => !open)}
						className='flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
						Input & output schema
						<ChevronDown
							size={14}
							className={`transition ${advancedOpen ? 'rotate-180' : ''}`}
						/>
					</button>
					{advancedOpen && (
						<div className='grid grid-cols-1 gap-3 border-t border-zinc-200 p-3 sm:grid-cols-2 dark:border-zinc-800'>
							<div className='flex flex-col gap-1.5'>
								<label htmlFor='custom-node-input-schema' className={labelClass}>
									Input schema (JSON)
								</label>
								<textarea
									id='custom-node-input-schema'
									value={inputSchema}
									rows={6}
									spellCheck={false}
									onChange={(event) => setInputSchema(event.target.value)}
									className={`${inputClass} font-mono`}
								/>
							</div>
							<div className='flex flex-col gap-1.5'>
								<label htmlFor='custom-node-output-schema' className={labelClass}>
									Output schema (JSON)
								</label>
								<textarea
									id='custom-node-output-schema'
									value={outputSchema}
									rows={6}
									spellCheck={false}
									onChange={(event) => setOutputSchema(event.target.value)}
									className={`${inputClass} font-mono`}
								/>
							</div>
							<p className='text-[11px] text-zinc-400 sm:col-span-2 dark:text-zinc-500'>
								Each property becomes a port on the canvas. Leave a box empty and
								the node gets no ports on that side.
							</p>
						</div>
					)}
				</div>

				{error && (
					<div className='rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'>
						{error}
					</div>
				)}

				<div className='border-zinc-150 flex items-center justify-end gap-2 border-t pt-4 dark:border-zinc-800'>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'>
						Cancel
					</button>
					<button
						type='button'
						onClick={handleSave}
						disabled={isSaving}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 rounded-lg px-5 py-2 text-xs font-bold shadow-md transition active:scale-97 disabled:cursor-not-allowed disabled:opacity-60'>
						{isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create node'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default CustomNodeFormModal;
