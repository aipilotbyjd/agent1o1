import { useState } from 'react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useUpdateKnowledgeSource } from '@/api/modules/knowledge-base';
import type { TKnowledgeSource } from '@/types/knowledge-base.type';
import { KNOWLEDGE_KINDS, hasRequiredSettings } from '../_helper/knowledge.sources';
import KnowledgeSourceSettingsPartial from './KnowledgeSourceSettings.partial';

const inputClass =
	'block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100';

/**
 * Renames a synced source or changes what it reads. Changing what it reads
 * starts it over: its old documents are dropped and it syncs again.
 */
const EditKnowledgeSourceDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	/** `null` closes the dialog. */
	source: TKnowledgeSource | null;
	onClose: () => void;
}) => {
	const update = useUpdateKnowledgeSource(ws);
	const [name, setName] = useState('');
	const [config, setConfig] = useState<Record<string, string>>({});

	const [syncedSource, setSyncedSource] = useState<TKnowledgeSource | null | undefined>(
		undefined,
	);
	if (syncedSource !== source) {
		setSyncedSource(source);
		setName(source?.name ?? '');
		setConfig(source?.config ?? {});
	}

	if (!source) return null;

	const definition = KNOWLEDGE_KINDS[source.type];
	const clean = (values: Record<string, string>) =>
		Object.fromEntries(
			Object.entries(values)
				.map(([key, value]) => [key, value.trim()])
				.filter(([, value]) => value),
		);
	const configChanged = JSON.stringify(clean(config)) !== JSON.stringify(clean(source.config));
	const canSave = !!name.trim() && !!definition && hasRequiredSettings(definition, config);

	const handleSave = () => {
		if (!canSave) return;
		update.mutate(
			{
				id: source.id,
				payload: {
					name: name.trim(),
					...(configChanged ? { config: clean(config) } : {}),
				},
			},
			{ onSuccess: onClose },
		);
	};

	return (
		<Modal isOpen={!!source} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={() => onClose()}>
				<span className='text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					Edit source
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div>
						<label
							htmlFor='editknowledgesourcedialog-name'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Name
						</label>
						<input
							id='editknowledgesourcedialog-name'
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={inputClass}
						/>
					</div>
					<KnowledgeSourceSettingsPartial
						ws={ws}
						type={source.type}
						credentialId={source.credential_id ?? undefined}
						config={config}
						onConfigChange={setConfig}
					/>
					{configChanged && (
						<p className='text-[11px] font-semibold text-amber-600'>
							Changing what this source reads removes its current documents and syncs
							it again.
						</p>
					)}
					<button
						onClick={handleSave}
						disabled={update.isPending || !canSave}
						className='bg-primary-400 text-primary-950 flex h-10 w-full cursor-pointer items-center justify-center rounded-xl text-xs font-black disabled:cursor-not-allowed disabled:opacity-50'>
						{update.isPending ? 'Saving…' : 'Save'}
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default EditKnowledgeSourceDialog;
