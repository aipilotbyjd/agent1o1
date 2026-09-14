import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useModelCatalog } from '@/api/modules/catalog';
import { useFolders } from '@/api/modules/folders';
import type { TAgent, TCreateAgentDto } from '@/types/agent.type';

// ============================================================
// Agent form
// ------------------------------------------------------------
// Create needs `name` + `instructions`; everything else is
// optional (StoreAgentRequest). The model comes from the shared
// catalog — picking an entry sets `model_catalog_id`, which is
// what the backend prefers over a free-text provider/model pair.
// ============================================================

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500';
const labelClass = 'mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300';

interface IAgentFormModalProps {
	ws: string;
	open: boolean;
	/** Null for create, the agent for edit. */
	target: TAgent | null;
	isPending: boolean;
	onClose: () => void;
	onSubmit: (values: TCreateAgentDto) => void;
}

const AgentFormModal = ({
	ws,
	open,
	target,
	isPending,
	onClose,
	onSubmit,
}: IAgentFormModalProps) => {
	const isEdit = !!target;
	const { data: models } = useModelCatalog();
	const { data: agentFolders = [] } = useFolders(ws, 'agent');

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [instructions, setInstructions] = useState('');
	const [modelCatalogId, setModelCatalogId] = useState('');
	const [temperature, setTemperature] = useState('0.7');
	const [folderId, setFolderId] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (!open) return;
		setName(target?.name ?? '');
		setDescription(target?.description ?? '');
		setInstructions(target?.instructions ?? '');
		setModelCatalogId(target?.model_catalog_id ?? '');
		setTemperature(String(target?.temperature ?? 0.7));
		setFolderId(target?.folder_id ?? '');
		setError('');
	}, [open, target]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return setError('Give the agent a name');
		if (!instructions.trim()) return setError('Instructions tell the agent what its job is');

		const parsedTemp = Number(temperature);
		onSubmit({
			name: name.trim(),
			description: description.trim() || null,
			instructions: instructions.trim(),
			model_catalog_id: modelCatalogId || null,
			temperature: Number.isFinite(parsedTemp) ? parsedTemp : null,
			folder_id: folderId || null,
		});
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} size='sm' isScrollable>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<Bot size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{isEdit ? 'Edit agent' : 'New agent'}
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{isEdit
								? 'Change what this agent is and how it behaves.'
								: 'Name it and tell it what its job is.'}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={handleSubmit} className='grid gap-4 pt-2'>
					<div>
						<label className={labelClass} htmlFor='agent-name'>
							Name
						</label>
						<input
							id='agent-name'
							className={inputClass}
							placeholder='Support Bot'
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setError('');
							}}
						/>
					</div>

					<div>
						<label className={labelClass} htmlFor='agent-description'>
							Description <span className='font-normal text-zinc-400'>(optional)</span>
						</label>
						<input
							id='agent-description'
							className={inputClass}
							placeholder='Answers customer questions from the handbook'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div>
						<label className={labelClass} htmlFor='agent-instructions'>
							Instructions
						</label>
						<textarea
							id='agent-instructions'
							rows={5}
							placeholder='You are a support agent. Answer only from the knowledge base, and say when you do not know.'
							className={`${inputClass} h-auto py-3`}
							value={instructions}
							onChange={(e) => {
								setInstructions(e.target.value);
								setError('');
							}}
						/>
					</div>

					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className={labelClass} htmlFor='agent-model'>
								Model
							</label>
							<select
								id='agent-model'
								className={inputClass}
								value={modelCatalogId}
								onChange={(e) => setModelCatalogId(e.target.value)}>
								<option value=''>Workspace default</option>
								{(models ?? []).map((model) => (
									<option key={model.id} value={model.id}>
										{model.display_name} · {model.brand}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className={labelClass} htmlFor='agent-temperature'>
								Temperature{' '}
								<span className='font-normal text-zinc-400'>(0–1)</span>
							</label>
							<input
								id='agent-temperature'
								type='number'
								min={0}
								max={1}
								step={0.1}
								className={inputClass}
								value={temperature}
								onChange={(e) => setTemperature(e.target.value)}
							/>
						</div>
					</div>

					{agentFolders.length > 0 && (
						<div>
							<label className={labelClass} htmlFor='agent-folder'>
								Folder <span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<select
								id='agent-folder'
								className={inputClass}
								value={folderId}
								onChange={(e) => setFolderId(e.target.value)}>
								<option value=''>No folder</option>
								{agentFolders.map((folder) => (
									<option key={folder.id} value={folder.id}>
										{folder.name}
									</option>
								))}
							</select>
						</div>
					)}

					{error && <p className='text-xs font-semibold text-red-500'>{error}</p>}

					<div className='flex justify-end gap-2.5 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending}
							className='inline-flex h-11 items-center justify-center rounded-xl bg-primary-400 px-5 text-sm font-bold text-primary-950 shadow-sm transition hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'>
							{isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create agent'}
						</button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
};

export default AgentFormModal;
