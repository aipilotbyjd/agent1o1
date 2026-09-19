import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal.partial';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TFieldKind, TNodeField } from '../../_types/node.type';

type Props = {
	nodeId: string;
	fields: TNodeField[];
	onClose: () => void;
};

const ConfigureInputsDialog = ({ nodeId, fields, onClose }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const [localFields, setLocalFields] = useState<TNodeField[]>(() => structuredClone(fields));

	const handleAddField = () => {
		setLocalFields((prev) => [
			...prev,
			{
				key: `input_${Date.now()}`,
				label: `Input Parameter ${prev.length + 1}`,
				kind: 'text',
				required: false,
				help: 'Custom workflow input parameter',
			},
		]);
	};

	const handleFieldChange = (index: number, patch: Partial<TNodeField>) =>
		setLocalFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...patch } : field)));

	const handleSave = () => {
		dispatch({ type: 'CONFIGURE_NODE_FIELDS', id: nodeId, fields: localFields });
		onClose();
	};

	return (
		<Modal title='Configure Inputs' onClose={onClose} size='md'>
			<div className='flex flex-col gap-4 text-sm text-zinc-800 dark:text-zinc-200'>
				<div className='text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					Define the inputs that will be passed into this node.
				</div>
				<div className='flex max-h-[350px] flex-col gap-3 overflow-y-auto pr-1'>
					{localFields.map((field, index) => (
						<div
							key={field.key}
							className='flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
							<div className='flex flex-1 flex-col gap-1.5'>
								<label className='text-[10px] font-bold text-zinc-400 uppercase'>
									Parameter Name
								</label>
								<input
									type='text'
									value={field.label}
									onChange={(event) =>
										handleFieldChange(index, { label: event.target.value })
									}
									className='w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
									placeholder='e.g. Email Address'
								/>
							</div>
							<div className='flex w-32 flex-col gap-1.5'>
								<label className='text-[10px] font-bold text-zinc-400 uppercase'>
									Type
								</label>
								<select
									value={field.kind}
									onChange={(event) =>
										handleFieldChange(index, {
											kind: event.target.value as TFieldKind,
										})
									}
									className='w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
									<option value='text'>Text</option>
									<option value='number'>Number</option>
									<option value='toggle'>Boolean</option>
								</select>
							</div>
							<button
								type='button'
								aria-label={`Remove ${field.label}`}
								onClick={() =>
									setLocalFields((prev) => prev.filter((item) => item.key !== field.key))
								}
								className='mt-5 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-rose-500 hover:bg-rose-50 dark:border-zinc-800 dark:hover:bg-rose-950/20'>
								<Trash2 size={14} />
							</button>
						</div>
					))}
					{localFields.length === 0 && (
						<div className='py-6 text-center text-xs text-zinc-400 dark:text-zinc-500'>
							No input parameters defined yet. Click "+ Add Parameter" below.
						</div>
					)}
				</div>
				<div className='border-zinc-150 flex items-center justify-between border-t pt-4 dark:border-zinc-800'>
					<button
						type='button'
						onClick={handleAddField}
						className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 active:scale-97 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						+ Add Parameter
					</button>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'>
							Cancel
						</button>
						<button
							type='button'
							onClick={handleSave}
							className='rounded-lg bg-primary-400 px-5 py-2 text-xs font-bold text-primary-950 shadow-md transition hover:bg-primary-500 active:scale-97'>
							Save Inputs
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ConfigureInputsDialog;
