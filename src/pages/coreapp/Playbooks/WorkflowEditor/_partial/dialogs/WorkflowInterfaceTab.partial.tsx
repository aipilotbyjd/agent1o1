import { useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Loader2, Play, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { notify } from '@/api/core';
import {
	useSubmitWorkflowInterface,
	useUpdateWorkflowInterface,
	useWorkflowInterface,
} from '@/api/modules/workflows';
import type {
	TWorkflowInterface,
	TWorkflowInterfaceField,
	TWorkflowInterfaceFieldType,
} from '@/types/workflow-extras.type';
import paths from '@/Routes/paths';

const FIELD_TYPES: { value: TWorkflowInterfaceFieldType; label: string }[] = [
	{ value: 'string', label: 'Short text' },
	{ value: 'text', label: 'Long text' },
	{ value: 'number', label: 'Number' },
	{ value: 'boolean', label: 'Yes / No' },
	{ value: 'select', label: 'Dropdown' },
	{ value: 'json', label: 'JSON' },
];

// Mirrors `UpdateWorkflowInterfaceRequest`: keys become top-level run input keys.
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/** Editable row — select options are edited as one comma-separated string. */
type TDraftField = TWorkflowInterfaceField & { optionsText: string };

const toDraft = (field: TWorkflowInterfaceField): TDraftField => ({
	...field,
	optionsText: (field.options ?? []).map((option) => option.value).join(', '),
});

const fromDraft = ({ optionsText, ...field }: TDraftField): TWorkflowInterfaceField => ({
	key: field.key.trim(),
	label: field.label?.trim() || null,
	type: field.type,
	required: Boolean(field.required),
	help: field.help?.trim() || null,
	default: field.default === '' ? null : (field.default ?? null),
	options:
		field.type === 'select'
			? optionsText
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean)
					.map((value) => ({ value }))
			: [],
});

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';

/** Coerce a form value to what the field's backend rule expects. */
const coerce = (field: TWorkflowInterfaceField, raw: unknown): unknown => {
	if (raw === '' || raw === undefined) return undefined;
	if (field.type === 'number') return Number(raw);
	if (field.type === 'json' && typeof raw === 'string') return JSON.parse(raw);
	return raw;
};

/**
 * The workflow's "front door": the input fields a run expects. Declared
 * fields are authored here; with none declared, the backend derives them
 * from the `{{ input.* }}` references in the graph.
 */
const initialValues = (iface: TWorkflowInterface): Record<string, unknown> =>
	Object.fromEntries(
		iface.fields.map((field) => [
			field.key,
			field.type === 'json' && field.default != null
				? JSON.stringify(field.default)
				: (field.default ?? (field.type === 'boolean' ? false : '')),
		]),
	);

const WorkflowInterfaceTab = ({ workspaceId, workflowId }: { workspaceId: string; workflowId: string }) => {
	const { data: iface, isLoading, dataUpdatedAt } = useWorkflowInterface(workspaceId, workflowId);

	if (isLoading || !iface) {
		return (
			<div className='flex justify-center py-12 text-xs font-semibold text-zinc-500'>
				<Loader2 size={16} className='text-primary-600 mr-2 animate-spin' />
				Loading run form...
			</div>
		);
	}

	// Remount on every server version so the local draft starts from it.
	return <InterfaceEditor key={dataUpdatedAt} iface={iface} workspaceId={workspaceId} workflowId={workflowId} />;
};

const InterfaceEditor = ({
	iface,
	workspaceId,
	workflowId,
}: {
	iface: TWorkflowInterface;
	workspaceId: string;
	workflowId: string;
}) => {
	const updateInterface = useUpdateWorkflowInterface(workspaceId, workflowId);
	const submitInterface = useSubmitWorkflowInterface(workspaceId, workflowId);

	const [fields, setFields] = useState<TDraftField[]>(() => iface.fields.map(toDraft));
	const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(iface));
	const [lastRunId, setLastRunId] = useState<string | null>(null);

	const updateField = (index: number, patch: Partial<TDraftField>) =>
		setFields((current) => current.map((field, i) => (i === index ? { ...field, ...patch } : field)));

	const keyErrors = fields.map((field, index) => {
		const key = field.key.trim();
		if (!key) return 'Key is required';
		if (!KEY_RE.test(key)) return 'Letters, numbers, _ or - only; cannot start with a number';
		if (fields.findIndex((other) => other.key.trim() === key) !== index) return 'Duplicate key';
		return null;
	});
	const hasErrors = keyErrors.some(Boolean);

	const handleSave = () => {
		if (hasErrors) return;
		updateInterface.mutate(
			{ fields: fields.map(fromDraft) },
			{ onSuccess: () => notify.success('Run form saved') },
		);
	};

	const handleReset = () => {
		updateInterface.mutate(
			{ fields: [] },
			{ onSuccess: () => notify.success('Run form now follows the workflow’s inputs') },
		);
	};

	const handleRun = (event: React.FormEvent) => {
		event.preventDefault();
		const input: Record<string, unknown> = {};
		try {
			for (const field of iface.fields) {
				const value = coerce(field, values[field.key]);
				if (value !== undefined) input[field.key] = value;
			}
		} catch {
			notify.error('One of the JSON fields is not valid JSON.');
			return;
		}
		submitInterface.mutate(
			{ input },
			{
				onSuccess: (run) => {
					setLastRunId(String(run.id));
					notify.success('Run started');
				},
			},
		);
	};

	const isDirty =
		JSON.stringify(fields.map(fromDraft)) !== JSON.stringify(iface.fields.map((f) => fromDraft(toDraft(f))));

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>Run Form</h3>
				<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
					The inputs someone fills in to run this workflow. Each field becomes{' '}
					<code className='font-mono'>{'{{ input.<key> }}'}</code> in your nodes.
				</p>
			</div>

			{/* Field editor */}
			<div className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-2'>
						<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>Fields</h4>
						<span
							title={
								iface.source === 'declared'
									? 'Saved from this form'
									: 'Detected from {{ input.* }} references in the workflow'
							}
							className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
								iface.source === 'declared'
									? 'bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
									: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
							}`}>
							{iface.source === 'declared' ? 'Custom' : 'Auto-detected'}
						</span>
					</div>
					{iface.source === 'declared' && (
						<button
							type='button'
							onClick={handleReset}
							disabled={updateInterface.isPending}
							className='flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200'>
							<RotateCcw size={11} />
							Use auto-detected
						</button>
					)}
				</div>

				{fields.length === 0 ? (
					<div className='rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800'>
						This workflow takes no input. Add a field to ask for one.
					</div>
				) : (
					<div className='space-y-2.5'>
						{fields.map((field, index) => (
							<div
								key={index}
								className='space-y-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
								<div className='grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_130px_auto]'>
									<div>
										<input
											aria-label='Field key'
											placeholder='key'
											value={field.key}
											onChange={(e) => updateField(index, { key: e.target.value })}
											className={`${inputClass} font-mono`}
										/>
										{keyErrors[index] && (
											<p className='mt-0.5 text-[10px] text-rose-500'>{keyErrors[index]}</p>
										)}
									</div>
									<input
										aria-label='Field label'
										placeholder='Label'
										value={field.label ?? ''}
										onChange={(e) => updateField(index, { label: e.target.value })}
										className={inputClass}
									/>
									<select
										aria-label='Field type'
										value={field.type}
										onChange={(e) =>
											updateField(index, { type: e.target.value as TWorkflowInterfaceFieldType })
										}
										className={inputClass}>
										{FIELD_TYPES.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
									<button
										type='button'
										title='Remove field'
										aria-label='Remove field'
										onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
										className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30'>
										<Trash2 size={13} />
									</button>
								</div>
								<div className='grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]'>
									<input
										aria-label='Help text'
										placeholder='Help text (optional)'
										value={field.help ?? ''}
										onChange={(e) => updateField(index, { help: e.target.value })}
										className={inputClass}
									/>
									<label className='flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400'>
										<input
											type='checkbox'
											checked={Boolean(field.required)}
											onChange={(e) => updateField(index, { required: e.target.checked })}
										/>
										Required
									</label>
								</div>
								{field.type === 'select' && (
									<input
										aria-label='Dropdown options'
										placeholder='Options, comma separated'
										value={field.optionsText}
										onChange={(e) => updateField(index, { optionsText: e.target.value })}
										className={inputClass}
									/>
								)}
							</div>
						))}
					</div>
				)}

				<div className='flex items-center justify-between gap-2'>
					<button
						type='button'
						onClick={() =>
							setFields((current) => [
								...current,
								{ key: '', label: '', type: 'string', required: false, help: '', optionsText: '' },
							])
						}
						className='flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04]'>
						<Plus size={12} />
						Add field
					</button>
					<button
						type='button'
						onClick={handleSave}
						disabled={!isDirty || hasErrors || updateInterface.isPending}
						className='flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
						{updateInterface.isPending ? <Loader2 size={13} className='animate-spin' /> : <Save size={13} />}
						Save form
					</button>
				</div>
			</div>

			{/* Run from the saved form */}
			<form
				onSubmit={handleRun}
				className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
				<div>
					<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>Run with this form</h4>
					<p className='text-[11px] text-zinc-500'>
						{iface.published
							? 'Runs the published version with the values below.'
							: 'Publish a version first — runs always use the published version.'}
						{isDirty && ' Save the form to use your latest field changes.'}
					</p>
				</div>

				{iface.fields.map((field) => {
					const id = `iface-${field.key}`;
					const value = values[field.key];
					const setValue = (next: unknown) => setValues((current) => ({ ...current, [field.key]: next }));
					return (
						<div key={field.key} className='space-y-1'>
							<label htmlFor={id} className='block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
								{field.label || field.key}
								{field.required && <span className='text-rose-500'> *</span>}
							</label>
							{field.type === 'boolean' ? (
								<input
									id={id}
									type='checkbox'
									checked={Boolean(value)}
									onChange={(e) => setValue(e.target.checked)}
								/>
							) : field.type === 'select' ? (
								<select
									id={id}
									value={String(value ?? '')}
									required={field.required}
									onChange={(e) => setValue(e.target.value)}
									className={inputClass}>
									<option value=''>Select…</option>
									{(field.options ?? []).map((option) => (
										<option key={option.value} value={option.value}>
											{option.label || option.value}
										</option>
									))}
								</select>
							) : field.type === 'text' || field.type === 'json' ? (
								<textarea
									id={id}
									rows={3}
									value={String(value ?? '')}
									required={field.required}
									onChange={(e) => setValue(e.target.value)}
									className={`${inputClass} ${field.type === 'json' ? 'font-mono' : ''}`}
								/>
							) : (
								<input
									id={id}
									type={field.type === 'number' ? 'number' : 'text'}
									value={String(value ?? '')}
									required={field.required}
									onChange={(e) => setValue(e.target.value)}
									className={inputClass}
								/>
							)}
							{field.help && <p className='text-[10px] text-zinc-400'>{field.help}</p>}
						</div>
					);
				})}

				<div className='flex items-center justify-between gap-2'>
					{lastRunId ? (
						<Link
							to={paths.trail(workspaceId, lastRunId)}
							className='text-primary-700 dark:text-primary-400 flex items-center gap-1 text-[11px] font-semibold hover:underline'>
							<ExternalLink size={11} />
							View run in Trail
						</Link>
					) : (
						<span />
					)}
					<button
						type='submit'
						disabled={!iface.published || submitInterface.isPending}
						className='from-primary-400 to-primary-500 text-primary-foreground flex items-center gap-1.5 rounded-lg bg-gradient-to-r px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40'>
						{submitInterface.isPending ? (
							<Loader2 size={13} className='animate-spin' />
						) : (
							<Play size={11} fill='currentColor' />
						)}
						Run
					</button>
				</div>
			</form>
		</div>
	);
};

export default WorkflowInterfaceTab;
