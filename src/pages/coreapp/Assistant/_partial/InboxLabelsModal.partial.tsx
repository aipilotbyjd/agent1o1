import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import {
	useCreateInboxLabel,
	useDeleteInboxLabel,
	useUpdateInboxLabel,
} from '@/api/modules/assistant';
import type { TInboxLabel } from '@/types/assistant.type';

interface IInboxLabelsModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
	labels: TInboxLabel[];
}

/**
 * The owner's labels, in their own words. Mail leaves the inbox only when
 * every label it gets is set to "Move out" — one "Keep" label keeps it.
 */
const InboxLabelsModalPartial = ({
	workspaceId,
	isOpen,
	onClose,
	labels,
}: IInboxLabelsModalProps) => {
	const { t } = useTranslation();
	const create = useCreateInboxLabel(workspaceId);
	const update = useUpdateInboxLabel(workspaceId);
	const remove = useDeleteInboxLabel(workspaceId);
	const [draft, setDraft] = useState({ name: '', definition: '' });

	const add = () =>
		create.mutate(
			{ name: draft.name.trim(), definition: draft.definition.trim(), group: 'keep' },
			{ onSuccess: () => setDraft({ name: '', definition: '' }) },
		);

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex flex-col'>
					<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
						{t('assistant.manageLabels')}
					</span>
					<span className='mt-1 text-xs text-zinc-500'>{t('assistant.labelsHint')}</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='flex max-h-[65vh] flex-col gap-3 overflow-y-auto pt-2 text-sm'>
					{labels.map((label) => (
						<div
							key={label.id}
							className='flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-white/10'>
							<div className='flex items-center gap-2'>
								<input
									type='color'
									value={label.color ?? '#6b7280'}
									onChange={(event) =>
										update.mutate({
											id: label.id,
											payload: { color: event.target.value },
										})
									}
									aria-label={t('assistant.labelColor')}
									className='h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0'
								/>
								<input
									defaultValue={label.name}
									onBlur={(event) =>
										event.target.value.trim() &&
										event.target.value !== label.name &&
										update.mutate({
											id: label.id,
											payload: { name: event.target.value.trim() },
										})
									}
									aria-label={t('assistant.labelName')}
									className='min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 font-semibold hover:border-zinc-200 focus:border-zinc-300 focus:ring-0 dark:hover:border-white/10'
								/>
								<select
									value={label.group}
									onChange={(event) =>
										update.mutate({
											id: label.id,
											payload: {
												group: event.target.value as TInboxLabel['group'],
											},
										})
									}
									className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 text-xs dark:border-white/10'>
									<option value='keep'>{t('assistant.labelGroups.keep')}</option>
									<option value='move_out'>
										{t('assistant.labelGroups.move_out')}
									</option>
								</select>
								<label className='flex items-center gap-1 text-xs text-zinc-500'>
									<input
										type='checkbox'
										checked={label.enabled}
										onChange={(event) =>
											update.mutate({
												id: label.id,
												payload: { enabled: event.target.checked },
											})
										}
									/>
									{t('assistant.labelOn')}
								</label>
								{!label.builtin && (
									<button
										type='button'
										onClick={() => remove.mutate(label.id)}
										aria-label={t('assistant.delete')}
										className='text-zinc-400 hover:text-red-500'>
										<Trash2 className='h-4 w-4' />
									</button>
								)}
							</div>
							<textarea
								rows={2}
								defaultValue={label.definition}
								onBlur={(event) =>
									event.target.value.trim() &&
									event.target.value !== label.definition &&
									update.mutate({
										id: label.id,
										payload: { definition: event.target.value.trim() },
									})
								}
								aria-label={t('assistant.labelDefinition')}
								className='rounded-lg border border-zinc-200 bg-transparent p-2 text-xs dark:border-white/10'
							/>
						</div>
					))}

					<div className='flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-white/15'>
						<input
							value={draft.name}
							onChange={(event) => setDraft({ ...draft, name: event.target.value })}
							placeholder={t('assistant.newLabelName')}
							className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'
						/>
						<textarea
							rows={2}
							value={draft.definition}
							onChange={(event) =>
								setDraft({ ...draft, definition: event.target.value })
							}
							placeholder={t('assistant.newLabelDefinition')}
							className='rounded-lg border border-zinc-200 bg-transparent p-2 text-xs dark:border-white/10'
						/>
						<button
							type='button'
							onClick={add}
							disabled={
								!draft.name.trim() || !draft.definition.trim() || create.isPending
							}
							className='bg-assistant self-end rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-40'>
							{t('assistant.addLabel')}
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default InboxLabelsModalPartial;
