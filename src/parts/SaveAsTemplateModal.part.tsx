import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import {
	useAgentTemplates,
	useSaveAgentAsTemplate,
	useSaveWorkflowAsTemplate,
	useWorkflowTemplates,
} from '@/api/modules/templates';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/25';
const labelClass = 'mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-300';
const errorClass = 'mt-1.5 text-xs font-semibold text-red-500';

interface ISaveAsTemplateModalProps {
	ws: string;
	kind: 'workflow' | 'agent';
	/** The workflow or agent being snapshotted. */
	sourceId: string;
	isOpen: boolean;
	onClose: () => void;
	defaultName: string;
	defaultDescription?: string | null;
	/**
	 * Runs before the snapshot. The backend copies the server-side state, so the
	 * workflow editor passes a graph flush here — otherwise edits still inside
	 * the autosave debounce would be missing from the template.
	 */
	beforeSave?: () => Promise<void>;
}

/**
 * No visibility choice on purpose: the backend only lists `public` templates
 * to other workspaces when they have no workspace at all (global ones), so a
 * template saved from here is only ever visible in this workspace.
 */
const SaveAsTemplateModal = ({
	ws,
	kind,
	sourceId,
	isOpen,
	onClose,
	defaultName,
	defaultDescription,
	beforeSave,
}: ISaveAsTemplateModalProps) => (
	// Remounted per open so the fields reseed from the current name.
	<SaveAsTemplateForm
		key={isOpen ? 'open' : 'closed'}
		ws={ws}
		kind={kind}
		sourceId={sourceId}
		isOpen={isOpen}
		onClose={onClose}
		defaultName={defaultName}
		defaultDescription={defaultDescription}
		beforeSave={beforeSave}
	/>
);

const SaveAsTemplateForm = ({
	ws,
	kind,
	sourceId,
	isOpen,
	onClose,
	defaultName,
	defaultDescription,
	beforeSave,
}: ISaveAsTemplateModalProps) => {
	const [name, setName] = useState(defaultName);
	const [description, setDescription] = useState(defaultDescription ?? '');
	const [category, setCategory] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [flushing, setFlushing] = useState(false);

	const saveWorkflow = useSaveWorkflowAsTemplate(ws);
	const saveAgent = useSaveAgentAsTemplate(ws);
	const isPending = flushing || saveWorkflow.isPending || saveAgent.isPending;

	// Suggest the categories this workspace already uses, so they stay consistent.
	const { data: workflowTemplates } = useWorkflowTemplates(kind === 'workflow' ? ws : '');
	const { data: agentTemplates } = useAgentTemplates(kind === 'agent' ? ws : '');
	const categories = useMemo(() => {
		const list = (kind === 'workflow' ? workflowTemplates : agentTemplates) ?? [];
		return Array.from(
			new Set(list.map((t) => t.category).filter((c): c is string => !!c)),
		).sort();
	}, [kind, workflowTemplates, agentTemplates]);

	const noun = kind === 'workflow' ? 'workflow' : 'agent';

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError('Give the template a name');
			return;
		}
		const body = {
			name: trimmed,
			description: description.trim() || null,
			category: category.trim() || null,
		};
		try {
			if (beforeSave) {
				setFlushing(true);
				try {
					await beforeSave();
				} finally {
					setFlushing(false);
				}
			}
			if (kind === 'workflow') {
				await saveWorkflow.mutateAsync({ workflowId: sourceId, body });
			} else {
				await saveAgent.mutateAsync({ agentId: sourceId, body });
			}
			notify.success(`Saved "${trimmed}" as a template. Find it in Blueprints.`);
			onClose();
		} catch (err) {
			// Field errors stay in the dialog; anything else was already toasted.
			setError(ApiError.is(err) ? (err.field('name') ?? null) : null);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<LayoutTemplate size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Save as template
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-4 pt-1'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							{kind === 'workflow'
								? 'Snapshots the current canvas so anyone in this workspace can start a new workflow from it. Connected credentials are left out.'
								: 'Snapshots this agent’s instructions, model and tools so anyone in this workspace can start a new agent from it.'}
						</p>
						<div>
							<label htmlFor='template-name' className={labelClass}>
								Name
							</label>
							<input
								id='template-name'
								aria-label='Template name'
								className={inputClass}
								value={name}
								maxLength={255}
								onChange={(e) => {
									setName(e.target.value);
									setError(null);
								}}
							/>
							{error && <p className={errorClass}>{error}</p>}
						</div>
						<div>
							<label htmlFor='template-description' className={labelClass}>
								Description <span className='font-semibold text-zinc-400'>(optional)</span>
							</label>
							<textarea
								id='template-description'
								aria-label='Template description'
								rows={3}
								className={`${inputClass} h-auto resize-none py-2.5`}
								placeholder={`What this ${noun} does and when to use it`}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor='template-category' className={labelClass}>
								Category <span className='font-semibold text-zinc-400'>(optional)</span>
							</label>
							<input
								id='template-category'
								aria-label='Template category'
								className={inputClass}
								list='template-category-options'
								placeholder='e.g. Sales, Support, Reporting'
								maxLength={255}
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							/>
							<datalist id='template-category-options'>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</datalist>
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
							Save template
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default SaveAsTemplateModal;
