import { useState } from 'react';
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
						Labels
					</span>
					<span className='mt-1 text-xs text-zinc-500'>
						{
							'Describe each label the way you\'d explain it to a new assistant. Mail moves out of your inbox only when every label it gets says "Move out".'
						}
					</span>
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
									aria-label='Label colour'
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
									aria-label='Label name'
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
									<option value='keep'>Keep in inbox</option>
									<option value='move_out'>Move out</option>
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
									On
								</label>
								{!label.builtin && (
									<button
										type='button'
										onClick={() => remove.mutate(label.id)}
										aria-label='Delete'
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
								aria-label='Label definition'
								className='rounded-lg border border-zinc-200 bg-transparent p-2 text-xs dark:border-white/10'
							/>
						</div>
					))}

					<div className='flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-white/15'>
						<input
							aria-label='New label name'
							value={draft.name}
							onChange={(event) => setDraft({ ...draft, name: event.target.value })}
							placeholder='New label name'
							className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'
						/>
						<textarea
							aria-label='When should this label be applied?'
							rows={2}
							value={draft.definition}
							onChange={(event) =>
								setDraft({ ...draft, definition: event.target.value })
							}
							placeholder='When should this label be applied?'
							className='rounded-lg border border-zinc-200 bg-transparent p-2 text-xs dark:border-white/10'
						/>
						<button
							type='button'
							onClick={add}
							disabled={
								!draft.name.trim() || !draft.definition.trim() || create.isPending
							}
							className='bg-assistant self-end rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-40'>
							Add label
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default InboxLabelsModalPartial;
