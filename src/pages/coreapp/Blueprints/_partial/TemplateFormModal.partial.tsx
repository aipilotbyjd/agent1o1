import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Cpu, Layers, Workflow } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import {
	useAgentTemplates,
	useCreateAgentTemplate,
	useCreateTemplateCollection,
	useCreateWorkflowTemplate,
	useSaveWorkflowAsTemplate,
	useTemplateCollections,
	useUpdateAgentTemplate,
	useUpdateTemplateCollection,
	useUpdateWorkflowTemplate,
	useWorkflowTemplates,
} from '@/api/modules/templates';
import { useWorkflows } from '@/api/modules/workflows';
import type { TAgentTemplate, TTemplateCollection, TWorkflowTemplate } from '@/types/template.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import { TEMPLATE_COLOR_OPTIONS } from '../_helper/blueprints.constants';

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/25';
const labelClass = 'mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-300';
const optionalClass = 'font-semibold text-zinc-400';
const errorClass = 'mt-1.5 text-xs font-semibold text-red-500';

export type TTemplateFormKind = 'workflow' | 'agent' | 'collection';

export type TTemplateFormTarget =
	| { kind: 'workflow'; item?: TWorkflowTemplate }
	| { kind: 'agent'; item?: TAgentTemplate }
	| { kind: 'collection'; item?: TTemplateCollection };

interface ITemplateFormModalProps {
	ws: string;
	/** `null` closes the modal. `item` present = edit, absent = create. */
	target: TTemplateFormTarget | null;
	onClose: () => void;
}

const KIND_META: Record<TTemplateFormKind, { noun: string; icon: typeof Workflow }> = {
	workflow: { noun: 'workflow template', icon: Workflow },
	agent: { noun: 'agent template', icon: Cpu },
	collection: { noun: 'collection', icon: Layers },
};

/**
 * Create or edit a workflow template, agent template or collection.
 *
 * Edit only covers the catalog fields: the backend's Update*Request rules
 * accept name/description/category/icon/color/visibility and nothing else, so
 * a template's graph or agent config is fixed once created.
 *
 * Create from scratch: a workflow template either snapshots an existing
 * workflow (the save-as-template route) or starts from an empty graph; an
 * agent template needs its instructions (`config.instructions` is required).
 */
const TemplateFormModal = ({ ws, target, onClose }: ITemplateFormModalProps) =>
	target ? (
		// Remounted per target so the fields reseed without an effect.
		<TemplateForm
			key={`${target.kind}:${target.item?.id ?? 'new'}`}
			ws={ws}
			target={target}
			onClose={onClose}
		/>
	) : null;

const TemplateForm = ({
	ws,
	target,
	onClose,
}: {
	ws: string;
	target: TTemplateFormTarget;
	onClose: () => void;
}) => {
	const { kind } = target;
	const item = target.item;
	const isEdit = !!item;
	const meta = KIND_META[kind];
	const KindIcon = meta.icon;

	const [name, setName] = useState(item?.name ?? '');
	const [description, setDescription] = useState(item?.description ?? '');
	const [category, setCategory] = useState(item?.category ?? '');
	const [color, setColor] = useState(item?.color ?? '');
	// Create-only fields.
	const [sourceWorkflowId, setSourceWorkflowId] = useState('');
	const [instructions, setInstructions] = useState('');
	const [temperature, setTemperature] = useState('');
	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const createWorkflow = useCreateWorkflowTemplate(ws);
	const saveWorkflowAs = useSaveWorkflowAsTemplate(ws);
	const updateWorkflow = useUpdateWorkflowTemplate(ws);
	const createAgent = useCreateAgentTemplate(ws);
	const updateAgent = useUpdateAgentTemplate(ws);
	const createCollection = useCreateTemplateCollection(ws);
	const updateCollection = useUpdateTemplateCollection(ws);
	const isPending = [
		createWorkflow,
		saveWorkflowAs,
		updateWorkflow,
		createAgent,
		updateAgent,
		createCollection,
		updateCollection,
	].some((m) => m.isPending);

	const { data: workflows } = useWorkflows(kind === 'workflow' && !isEdit ? ws : '');

	// Suggest the categories already in use for this kind, so they stay consistent.
	const { data: workflowTemplates } = useWorkflowTemplates(kind === 'workflow' ? ws : '');
	const { data: agentTemplates } = useAgentTemplates(kind === 'agent' ? ws : '');
	const { data: collections } = useTemplateCollections(kind === 'collection' ? ws : '');
	const categories = useMemo(() => {
		const list: { category: string | null }[] =
			(kind === 'workflow'
				? workflowTemplates
				: kind === 'agent'
					? agentTemplates
					: collections) ?? [];
		return Array.from(
			new Set(list.map((t) => t.category).filter((c): c is string => !!c)),
		).sort();
	}, [kind, workflowTemplates, agentTemplates, collections]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		const nextErrors: Record<string, string | null> = {};
		if (!trimmed) nextErrors.name = 'Give it a name';
		if (kind === 'agent' && !isEdit && !instructions.trim())
			nextErrors.instructions = 'An agent template needs instructions';
		const temp = temperature.trim() === '' ? null : Number(temperature);
		if (temp !== null && (Number.isNaN(temp) || temp < 0 || temp > 1))
			nextErrors.temperature = 'Use a number between 0 and 1';
		if (Object.keys(nextErrors).length) {
			setErrors(nextErrors);
			return;
		}

		const fields = {
			name: trimmed,
			description: description.trim() || null,
			category: category.trim() || null,
			color: color || null,
		};

		try {
			if (kind === 'workflow') {
				if (isEdit) await updateWorkflow.mutateAsync({ id: item.id, body: fields });
				else if (sourceWorkflowId)
					await saveWorkflowAs.mutateAsync({
						workflowId: sourceWorkflowId,
						body: fields,
					});
				else
					await createWorkflow.mutateAsync({
						...fields,
						graph: { nodes: [], edges: [] },
					});
			} else if (kind === 'agent') {
				if (isEdit) await updateAgent.mutateAsync({ id: item.id, body: fields });
				else
					await createAgent.mutateAsync({
						...fields,
						config: { instructions: instructions.trim(), temperature: temp },
					});
			} else if (isEdit) {
				await updateCollection.mutateAsync({ id: item.id, body: fields });
			} else {
				await createCollection.mutateAsync(fields);
			}
			notify.success(isEdit ? `Saved "${trimmed}".` : `Created "${trimmed}".`);
			onClose();
		} catch (err) {
			// Field errors stay in the dialog; anything else was already toasted.
			if (ApiError.is(err)) {
				setErrors({
					name: err.field('name') ?? null,
					instructions: err.field('config.instructions') ?? null,
					temperature: err.field('config.temperature') ?? null,
				});
			}
		}
	};

	return (
		<Modal isOpen setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<KindIcon size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{isEdit ? `Edit ${meta.noun}` : `New ${meta.noun}`}
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-4 pt-1'>
						{isEdit && kind !== 'collection' && (
							<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
								{kind === 'workflow'
									? 'The graph is fixed once a template exists. To change it, edit a workflow and save it as a new template.'
									: 'The instructions and model are fixed once a template exists. To change them, edit an agent and save it as a new template.'}
							</p>
						)}

						<div>
							<label htmlFor='tpl-name' className={labelClass}>
								Name
							</label>
							<input
								id='tpl-name'
								aria-label='Name'
								className={inputClass}
								value={name}
								maxLength={255}
								onChange={(e) => {
									setName(e.target.value);
									setErrors((x) => ({ ...x, name: null }));
								}}
							/>
							{errors.name && <p className={errorClass}>{errors.name}</p>}
						</div>

						{kind === 'workflow' && !isEdit && (
							<div>
								<label htmlFor='tpl-source' className={labelClass}>
									Start from
								</label>
								<select
									id='tpl-source'
									className={inputClass}
									value={sourceWorkflowId}
									onChange={(e) => setSourceWorkflowId(e.target.value)}>
									<option value=''>Blank canvas</option>
									{(workflows ?? []).map((w) => (
										<option key={w.id} value={w.id}>
											Copy of "{w.name}"
										</option>
									))}
								</select>
								<p className='mt-1.5 text-xs font-semibold text-zinc-400'>
									{sourceWorkflowId
										? 'Snapshots that workflow’s current graph. Connected credentials are left out.'
										: 'Creates a template with no nodes yet.'}
								</p>
							</div>
						)}

						{kind === 'agent' && !isEdit && (
							<>
								<div>
									<label htmlFor='tpl-instructions' className={labelClass}>
										Instructions
									</label>
									<textarea
										id='tpl-instructions'
										aria-label='Instructions'
										rows={5}
										className={`${inputClass} h-auto resize-y py-2.5`}
										placeholder='What should agents made from this template do?'
										value={instructions}
										onChange={(e) => {
											setInstructions(e.target.value);
											setErrors((x) => ({ ...x, instructions: null }));
										}}
									/>
									{errors.instructions && (
										<p className={errorClass}>{errors.instructions}</p>
									)}
								</div>
								<div>
									<label htmlFor='tpl-temperature' className={labelClass}>
										Temperature{' '}
										<span className={optionalClass}>(optional, 0 to 1)</span>
									</label>
									<input
										id='tpl-temperature'
										aria-label='Temperature'
										type='number'
										min={0}
										max={1}
										step={0.1}
										className={inputClass}
										placeholder='Model default'
										value={temperature}
										onChange={(e) => {
											setTemperature(e.target.value);
											setErrors((x) => ({ ...x, temperature: null }));
										}}
									/>
									{errors.temperature && (
										<p className={errorClass}>{errors.temperature}</p>
									)}
								</div>
							</>
						)}

						<div>
							<label htmlFor='tpl-description' className={labelClass}>
								Description <span className={optionalClass}>(optional)</span>
							</label>
							<textarea
								id='tpl-description'
								aria-label='Description'
								rows={3}
								className={`${inputClass} h-auto resize-none py-2.5`}
								placeholder={
									kind === 'collection'
										? 'What this bundle sets up'
										: 'What it does and when to use it'
								}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						<div>
							<label htmlFor='tpl-category' className={labelClass}>
								Category <span className={optionalClass}>(optional)</span>
							</label>
							<input
								id='tpl-category'
								aria-label='Category'
								className={inputClass}
								list='tpl-category-options'
								placeholder='e.g. Sales, Support, Reporting'
								maxLength={255}
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							/>
							<datalist id='tpl-category-options'>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</datalist>
						</div>

						<div>
							<span className={labelClass}>Color</span>
							<div className='flex flex-wrap gap-2'>
								{TEMPLATE_COLOR_OPTIONS.map((swatch) => (
									<button
										key={swatch}
										type='button'
										aria-label={`Color ${swatch}`}
										aria-pressed={color.toLowerCase() === swatch.toLowerCase()}
										onClick={() => setColor(swatch)}
										style={{ backgroundColor: swatch }}
										className={`h-8 w-8 cursor-pointer rounded-xl transition-all ${
											color.toLowerCase() === swatch.toLowerCase()
												? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900'
												: ''
										}`}
									/>
								))}
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={onClose}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='solid'
							color='primary'
							isLoading={isPending}
							className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
							{isEdit ? 'Save changes' : 'Create'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default TemplateFormModal;
