import { useState } from 'react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { ChevronDown, X } from 'lucide-react';
import type { TNodeField } from '../../../_types/node.type';
import AccountSelect from './AccountSelect.partial';
import DynamicSelect from './DynamicSelect.partial';
import ExpressionInput from './ExpressionInput.partial';

export const inputClass =
	'w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20';

const compactInputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-xs outline-none transition focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

type FieldInputProps = {
	field: TNodeField;
	value: unknown;
	onChange: (value: unknown) => void;
	compact?: boolean;
	nodeId?: string;
};

/**
 * Resource picker. Without a provider-side picker (Drive, Sheets…) wired up, the
 * user pastes a resource id or link instead — same value, no fake browser.
 */
const PickerFieldInput = ({ field, value, onChange, compact }: FieldInputProps) => {
	const [entering, setEntering] = useState(false);
	const cls = compact ? compactInputClass : inputClass;
	const current = String(value ?? '');

	if (current && !entering) {
		return (
			<div className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900'>
				<span className='flex-1 truncate text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
					{current}
				</span>
				<button
					type='button'
					aria-label={`Change ${field.label}`}
					onClick={() => setEntering(true)}
					className='text-primary-600 dark:text-primary-400 text-[10px] font-bold hover:underline'>
					Change
				</button>
				<button
					type='button'
					aria-label={`Clear ${field.label}`}
					onClick={() => onChange('')}
					className='text-zinc-400 hover:text-rose-500'>
					<X size={12} />
				</button>
			</div>
		);
	}

	if (entering) {
		return (
			<input
				autoFocus
				value={current}
				onChange={(event) => onChange(event.target.value)}
				onBlur={() => setEntering(false)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === 'Escape') setEntering(false);
				}}
				placeholder={field.placeholder ?? 'Paste a link or id…'}
				aria-label={field.label}
				className={cls}
			/>
		);
	}

	return (
		<button
			type='button'
			onClick={() => setEntering(true)}
			className='flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
			{field.pickerLabel ?? `Pick ${field.label}`}
		</button>
	);
};

const toJsonText = (value: unknown) =>
	value === undefined || value === null || typeof value === 'string'
		? String(value ?? '')
		: JSON.stringify(value, null, 2);

/**
 * An object/array field (e.g. request headers) edited as JSON text. Valid
 * JSON is handed back parsed, so the config keeps its real shape; anything
 * else is handed back as typed (e.g. a whole `{{variable}}`) and the server
 * says if it won't take it. The text is kept locally so a parse doesn't
 * reformat it mid-edit.
 */
const JsonFieldInput = ({ field, value, onChange, compact, nodeId }: FieldInputProps) => {
	const cls = compact ? compactInputClass : inputClass;
	const [text, setText] = useState(() => toJsonText(value));
	const [lastEmitted, setLastEmitted] = useState(() => toJsonText(value));

	// A change from outside (the assistant, an undo) replaces the text.
	const incoming = toJsonText(value);
	if (incoming !== lastEmitted) {
		setLastEmitted(incoming);
		setText(incoming);
	}

	const handleChange = (next: unknown) => {
		const raw = String(next ?? '');
		setText(raw);
		let parsed: unknown = raw;
		try {
			const candidate: unknown = JSON.parse(raw);
			if (candidate !== null && typeof candidate === 'object') parsed = candidate;
		} catch {
			/* not JSON (yet) — keep the text */
		}
		setLastEmitted(toJsonText(parsed));
		onChange(parsed);
	};

	if (nodeId) {
		return (
			<ExpressionInput
				field={field}
				value={text}
				onChange={handleChange}
				compact={compact}
				nodeId={nodeId}
				className={cls}
			/>
		);
	}

	return (
		<textarea
			rows={field.rows ?? (compact ? 2 : 4)}
			value={text}
			onChange={(event) => handleChange(event.target.value)}
			placeholder={field.placeholder}
			aria-label={field.label}
			className={`${cls} font-mono`}
		/>
	);
};

type TKvRow = { key: string; value: string };

/** `{a: 1}` → rows, keeping a trailing empty row to type into. */
const objectToRows = (value: unknown): TKvRow[] => {
	const rows =
		value && typeof value === 'object' && !Array.isArray(value)
			? Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
					key,
					value: typeof item === 'string' ? item : JSON.stringify(item),
				}))
			: [];
	return rows.length ? rows : [{ key: '', value: '' }];
};

/** Rows → `{key: value}`; rows without a key are dropped. */
const rowsToObject = (rows: TKvRow[]) =>
	Object.fromEntries(
		rows.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
	);

/**
 * Key/value rows stored as a plain object (request headers, a transform's
 * output mapping, a sub-workflow's input). Rows live locally so a half-typed
 * row without a key doesn't vanish on the next render.
 */
const KeyValueObjectInput = ({ field, value, onChange, compact }: FieldInputProps) => {
	const cls = compact ? compactInputClass : inputClass;
	const [rows, setRows] = useState<TKvRow[]>(() => objectToRows(value));
	// Compared against the stored value as-is, so a non-string value (`{a: 1}`)
	// doesn't read as an outside change on every render.
	const [lastEmitted, setLastEmitted] = useState(() => JSON.stringify(value ?? {}));

	const incoming = JSON.stringify(value ?? {});
	if (incoming !== lastEmitted) {
		setLastEmitted(incoming);
		setRows(objectToRows(value));
	}

	const update = (next: TKvRow[]) => {
		setRows(next);
		const object = rowsToObject(next);
		setLastEmitted(JSON.stringify(object));
		onChange(object);
	};

	return (
		<div className='space-y-1.5'>
			{rows.map((row, index) => (
				<div key={index} className='flex items-center gap-1.5'>
					<input
						type='text'
						placeholder='Key'
						value={row.key}
						onChange={(event) =>
							update(
								rows.map((item, i) =>
									i === index ? { ...item, key: event.target.value } : item,
								),
							)
						}
						className={cls}
						aria-label={`${field.label} key ${index + 1}`}
					/>
					<input
						type='text'
						placeholder='Value'
						value={row.value}
						onChange={(event) =>
							update(
								rows.map((item, i) =>
									i === index ? { ...item, value: event.target.value } : item,
								),
							)
						}
						className={cls}
						aria-label={`${field.label} value ${index + 1}`}
					/>
					<button
						type='button'
						aria-label={`Remove ${field.label} row ${index + 1}`}
						onClick={() =>
							update(
								rows.length > 1
									? rows.filter((_, i) => i !== index)
									: [{ key: '', value: '' }],
							)
						}
						className='shrink-0 text-zinc-400 hover:text-rose-500'>
						<X size={12} />
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => setRows([...rows, { key: '', value: '' }])}
				className='text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'>
				+ Add row
			</button>
		</div>
	);
};

/** A list of strings (e.g. a spreadsheet row's cell values), one input per item. */
const StringListInput = ({ field, value, onChange, compact, nodeId }: FieldInputProps) => {
	const cls = compact ? compactInputClass : inputClass;
	const items =
		Array.isArray(value) && value.length ? value.map((item) => String(item ?? '')) : [''];

	const update = (next: string[]) => onChange(next);

	return (
		<div className='space-y-1.5'>
			{items.map((item, index) => (
				<div key={index} className='flex items-center gap-1.5'>
					{nodeId ? (
						<div className='min-w-0 flex-1'>
							<ExpressionInput
								nodeId={nodeId}
								field={{
									...field,
									kind: 'text',
									label: `${field.label} ${index + 1}`,
								}}
								value={item}
								onChange={(next) =>
									update(
										items.map((current, i) =>
											i === index ? String(next ?? '') : current,
										),
									)
								}
								compact={compact}
								className={cls}
							/>
						</div>
					) : (
						<input
							type='text'
							value={item}
							placeholder={
								field.placeholder ? `${field.placeholder} ${index + 1}` : undefined
							}
							onChange={(event) =>
								update(
									items.map((current, i) =>
										i === index ? event.target.value : current,
									),
								)
							}
							className={cls}
							aria-label={`${field.label} ${index + 1}`}
						/>
					)}
					<button
						type='button'
						aria-label={`Remove ${field.label} ${index + 1}`}
						onClick={() =>
							update(items.length > 1 ? items.filter((_, i) => i !== index) : [])
						}
						className='shrink-0 text-zinc-400 hover:text-rose-500'>
						<X size={12} />
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => update([...items, ''])}
				className='text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'>
				+ Add
			</button>
		</div>
	);
};

const FieldInput = ({ field, value, onChange, compact, nodeId }: FieldInputProps) => {
	const { state } = useWorkflowEditor();
	const dynamic = state.nodes
		.find((node) => node.id === nodeId)
		?.data.dynamicInputKeys?.includes(field.key);
	const cls = compact ? compactInputClass : inputClass;

	if (
		nodeId &&
		field.kind !== 'credential' &&
		(dynamic || (typeof value === 'string' && value.includes('{{')))
	) {
		return (
			<ExpressionInput
				field={{
					...field,
					kind: 'text',
					placeholder: 'Connect an output or insert a variable…',
				}}
				value={typeof value === 'object' && value !== null ? JSON.stringify(value) : value}
				onChange={(next) => {
					const text = String(next ?? '');
					if (!text.includes('{{')) {
						if (field.kind === 'number' && text.trim() && Number.isFinite(Number(text)))
							return onChange(Number(text));
						if (field.kind === 'toggle' && ['true', 'false'].includes(text))
							return onChange(text === 'true');
						if (
							field.json ||
							['list', 'multiselect', 'kv'].includes(field.kind) ||
							field.dynamic?.valueType === 'array'
						) {
							try {
								return onChange(JSON.parse(text));
							} catch {
								/* Keep an unfinished expression editable. */
							}
						}
					}
					onChange(text);
				}}
				compact={compact}
				nodeId={nodeId}
				className={cls}
			/>
		);
	}

	if (field.kind === 'dynamic' && field.dynamic) {
		return (
			<DynamicSelect
				field={field}
				value={value}
				onChange={onChange}
				compact={compact}
				nodeId={nodeId}
				className={cls}
			/>
		);
	}

	if (field.kind === 'list') {
		return (
			<StringListInput
				field={field}
				value={value}
				onChange={onChange}
				compact={compact}
				nodeId={nodeId}
			/>
		);
	}

	if (field.kind === 'kv' && field.kvObject) {
		return (
			<KeyValueObjectInput
				field={field}
				value={value}
				onChange={onChange}
				compact={compact}
			/>
		);
	}

	if (field.json) {
		return (
			<JsonFieldInput
				field={field}
				value={value}
				onChange={onChange}
				compact={compact}
				nodeId={nodeId}
			/>
		);
	}

	if (field.kind === 'picker') {
		return (
			<PickerFieldInput field={field} value={value} onChange={onChange} compact={compact} />
		);
	}

	// Every text-like field gets the expression editor so upstream values can be
	// dropped in as {{variables}} (Gumloop-style), with autocomplete + live preview.
	if (nodeId && (field.kind === 'text' || field.kind === 'longtext' || field.kind === 'code')) {
		return (
			<ExpressionInput
				field={field}
				value={value}
				onChange={onChange}
				compact={compact}
				nodeId={nodeId}
				className={cls}
			/>
		);
	}

	if (field.kind === 'toggle') {
		const active = Boolean(value);
		return (
			<button
				type='button'
				role='switch'
				aria-checked={active}
				onClick={() => onChange(!active)}
				aria-label={field.label}
				className={`${compact ? 'h-5 w-9' : 'h-7 w-12'} rounded-full border p-1 transition ${active ? 'border-emerald-400 bg-emerald-500' : 'border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800'}`}>
				<span
					className={`block rounded-full bg-white transition ${compact ? 'h-3 w-3' : 'h-4 w-4'} ${active ? (compact ? 'translate-x-4' : 'translate-x-5') : ''}`}
				/>
			</button>
		);
	}

	if (field.kind === 'credential') {
		return (
			<AccountSelect
				connectorKey={field.credentialType}
				value={value ? String(value) : undefined}
				onChange={onChange}
			/>
		);
	}

	if (field.kind === 'select' || field.kind === 'model') {
		const select = (
			<select
				value={String(value ?? '')}
				onChange={(event) => onChange(event.target.value)}
				aria-label={field.label}
				className={`${cls} ${compact ? 'cursor-pointer appearance-none bg-none pr-7' : ''}`}>
				<option value=''>Select…</option>
				{field.options?.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		);

		if (!compact) return select;

		return (
			<div className='relative'>
				{select}
				<ChevronDown
					size={12}
					className='pointer-events-none absolute inset-y-0 right-2 my-auto h-3 w-3 text-zinc-400'
				/>
			</div>
		);
	}

	if (field.kind === 'multiselect') {
		const selectedValues = Array.isArray(value) ? value : [];
		return (
			<select
				multiple
				size={4}
				value={selectedValues}
				onChange={(event) =>
					onChange(Array.from(event.target.selectedOptions).map((opt) => opt.value))
				}
				aria-label={field.label}
				className={`${cls} h-auto`}>
				{field.options?.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		);
	}

	if (field.kind === 'number') {
		return (
			<input
				type='number'
				value={value === undefined || value === null || value === '' ? '' : Number(value)}
				min={field.min}
				max={field.max}
				placeholder={field.placeholder}
				// Cleared → unset, so the node falls back to its own default.
				onChange={(event) =>
					onChange(event.target.value === '' ? undefined : Number(event.target.value))
				}
				aria-label={field.label}
				className={cls}
			/>
		);
	}

	if (field.kind === 'longtext' || field.kind === 'code') {
		return (
			<textarea
				rows={field.rows ?? (compact ? 2 : 4)}
				value={String(value ?? '')}
				onChange={(event) => onChange(event.target.value)}
				placeholder={field.placeholder}
				aria-label={field.label}
				className={`${cls} font-mono`}
			/>
		);
	}

	if (field.kind === 'kv') {
		const kvPairs = Array.isArray(value) ? value : [{ key: '', value: '' }];
		return (
			<div className='space-y-2'>
				{kvPairs.map((pair, index) => (
					<div key={index} className='grid grid-cols-2 gap-2'>
						<input
							type='text'
							placeholder='Key'
							value={pair.key || ''}
							onChange={(e) =>
								onChange(
									kvPairs.map((p, i) =>
										i === index ? { ...p, key: e.target.value } : p,
									),
								)
							}
							className={cls}
							aria-label={`${field.label} key ${index + 1}`}
						/>
						<input
							type='text'
							placeholder='Value'
							value={pair.value || ''}
							onChange={(e) =>
								onChange(
									kvPairs.map((p, i) =>
										i === index ? { ...p, value: e.target.value } : p,
									),
								)
							}
							className={cls}
							aria-label={`${field.label} value ${index + 1}`}
						/>
					</div>
				))}
				<button
					type='button'
					onClick={() => onChange([...kvPairs, { key: '', value: '' }])}
					className='text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'>
					+ Add row
				</button>
			</div>
		);
	}

	return (
		<input
			value={String(value ?? '')}
			onChange={(event) => onChange(event.target.value)}
			placeholder={field.placeholder}
			aria-label={field.label}
			className={cls}
		/>
	);
};

export default FieldInput;
