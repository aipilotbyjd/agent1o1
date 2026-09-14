import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useConfirm } from '@/context/confirmContext';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/api/modules/tags';
import { useSyncWorkflowTags } from '@/api/modules/workflows';
import { useSyncAgentTags } from '@/api/modules/agents';
import type { TTag } from '@/types/tag.type';

// ============================================================
// Tag picker
// ------------------------------------------------------------
// Tags are one workspace-level resource shared by workflows and
// agents, so this modal does both jobs: manage the workspace's
// tags (create / rename / recolour / delete) and set which of them
// apply to one record, via `PUT {workflow|agent}/{id}/tags`.
// ============================================================

const TAG_COLORS = [
	'#6366F1',
	'#0EA5E9',
	'#10B981',
	'#F59E0B',
	'#EF4444',
	'#EC4899',
	'#8B5CF6',
	'#64748B',
];

const inputClass =
	'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

export interface ITagPickerTarget {
	kind: 'workflow' | 'agent';
	id: string;
	name: string;
	tagIds: string[];
}

interface ITagPickerModalProps {
	ws: string;
	target: ITagPickerTarget | null;
	onClose: () => void;
}

const ColorDots = ({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) => (
	<div className='flex flex-wrap gap-1.5'>
		{TAG_COLORS.map((color) => (
			<button
				key={color}
				type='button'
				aria-label={`Use colour ${color}`}
				onClick={() => onChange(color)}
				style={{ backgroundColor: color }}
				className={`h-6 w-6 cursor-pointer rounded-full transition ${
					value === color ? 'ring-2 ring-primary-400 ring-offset-2' : ''
				}`}
			/>
		))}
	</div>
);

const TagPickerModal = ({ ws, target, onClose }: ITagPickerModalProps) => {
	const { confirm } = useConfirm();
	const { data: tags, isLoading } = useTags(ws);

	const createTag = useCreateTag(ws);
	const updateTag = useUpdateTag(ws);
	const deleteTag = useDeleteTag(ws);

	// Both sync endpoints are per-record, so the right one is picked by kind.
	const syncWorkflowTags = useSyncWorkflowTags(ws, target?.id ?? '');
	const syncAgentTags = useSyncAgentTags(ws, target?.id ?? '');
	const sync = target?.kind === 'agent' ? syncAgentTags : syncWorkflowTags;

	const [selected, setSelected] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [draftName, setDraftName] = useState('');
	const [draftColor, setDraftColor] = useState(TAG_COLORS[0]);
	const [editingId, setEditingId] = useState<string | null>(null);

	useEffect(() => {
		if (!target) return;
		setSelected(target.tagIds);
		setIsCreating(false);
		setEditingId(null);
		setDraftName('');
		setDraftColor(TAG_COLORS[0]);
	}, [target]);

	const toggle = (id: string) =>
		setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	const handleCreate = async () => {
		if (!draftName.trim()) return;
		const created = await createTag.mutateAsync({
			name: draftName.trim(),
			color: draftColor,
		});
		// A tag made from here is almost always meant for this record.
		setSelected((prev) => [...prev, created.id]);
		setIsCreating(false);
		setDraftName('');
	};

	const startEdit = (tag: TTag) => {
		setEditingId(tag.id);
		setDraftName(tag.name);
		setDraftColor(tag.color ?? TAG_COLORS[0]);
		setIsCreating(false);
	};

	const handleUpdate = async () => {
		if (!editingId || !draftName.trim()) return;
		await updateTag.mutateAsync({
			id: editingId,
			body: { name: draftName.trim(), color: draftColor },
		});
		setEditingId(null);
		setDraftName('');
	};

	const handleDelete = async (tag: TTag) => {
		const confirmed = await confirm({
			title: 'Delete Tag',
			message: (
				<>
					Delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{tag.name}&quot;
					</strong>{' '}
					from the whole workspace? It is removed from everything using it.
				</>
			),
		});
		if (!confirmed) return;
		await deleteTag.mutateAsync(tag.id);
		setSelected((prev) => prev.filter((id) => id !== tag.id));
	};

	const handleSave = async () => {
		if (!target) return;
		await sync.mutateAsync({ tag_ids: selected });
		onClose();
	};

	const tagList = tags ?? [];
	const isEditingSomething = isCreating || editingId !== null;

	return (
		<Modal isOpen={!!target} setIsOpen={(open) => !open && onClose()} size='sm' isScrollable>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<TagIcon size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Tags
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{target?.name}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='grid gap-3 pt-2'>
					{isLoading ? (
						<div className='space-y-2'>
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className='h-11 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
								/>
							))}
						</div>
					) : tagList.length === 0 && !isCreating ? (
						<p className='py-6 text-center text-sm font-semibold text-zinc-400 dark:text-zinc-500'>
							No tags in this workspace yet.
						</p>
					) : (
						<div className='grid gap-1.5'>
							{tagList.map((tag) =>
								editingId === tag.id ? (
									<div
										key={tag.id}
										className='grid gap-2.5 rounded-xl border border-primary-400/40 bg-primary-400/5 p-3'>
										<input
											className={inputClass}
											value={draftName}
											onChange={(e) => setDraftName(e.target.value)}
										/>
										<ColorDots value={draftColor} onChange={setDraftColor} />
										<div className='flex justify-end gap-2'>
											<button
												type='button'
												onClick={() => setEditingId(null)}
												className='h-9 cursor-pointer rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-500 dark:border-zinc-700'>
												Cancel
											</button>
											<button
												type='button'
												onClick={handleUpdate}
												disabled={updateTag.isPending}
												className='h-9 cursor-pointer rounded-lg bg-primary-400 px-3 text-xs font-bold text-primary-950 disabled:opacity-60'>
												Save
											</button>
										</div>
									</div>
								) : (
									<div
										key={tag.id}
										className='group flex items-center gap-2.5 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
										<button
											type='button'
											onClick={() => toggle(tag.id)}
											className='flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left'>
											<span
												className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
													selected.includes(tag.id)
														? 'border-primary-500 bg-primary-400 text-primary-950'
														: 'border-zinc-300 dark:border-zinc-600'
												}`}>
												{selected.includes(tag.id) && <Check size={12} />}
											</span>
											<span
												className='h-2.5 w-2.5 shrink-0 rounded-full'
												style={{ backgroundColor: tag.color ?? '#64748B' }}
											/>
											<span className='truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
												{tag.name}
											</span>
										</button>

										<button
											type='button'
											title='Rename tag'
											onClick={() => startEdit(tag)}
											className='cursor-pointer text-zinc-300 transition hover:text-zinc-600 dark:hover:text-zinc-300'>
											<Pencil size={13} />
										</button>
										<button
											type='button'
											title='Delete tag'
											onClick={() => handleDelete(tag)}
											className='cursor-pointer text-zinc-300 transition hover:text-rose-500'>
											<Trash2 size={13} />
										</button>
									</div>
								),
							)}
						</div>
					)}

					{isCreating ? (
						<div className='grid gap-2.5 rounded-xl border border-primary-400/40 bg-primary-400/5 p-3'>
							<input
								autoFocus
								className={inputClass}
								placeholder='Tag name'
								value={draftName}
								onChange={(e) => setDraftName(e.target.value)}
							/>
							<ColorDots value={draftColor} onChange={setDraftColor} />
							<div className='flex justify-end gap-2'>
								<button
									type='button'
									onClick={() => setIsCreating(false)}
									className='h-9 cursor-pointer rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-500 dark:border-zinc-700'>
									<X size={13} />
								</button>
								<button
									type='button'
									onClick={handleCreate}
									disabled={createTag.isPending || !draftName.trim()}
									className='h-9 cursor-pointer rounded-lg bg-primary-400 px-3 text-xs font-bold text-primary-950 disabled:opacity-60'>
									Add tag
								</button>
							</div>
						</div>
					) : (
						<button
							type='button'
							onClick={() => {
								setIsCreating(true);
								setEditingId(null);
								setDraftName('');
							}}
							className='flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 text-xs font-bold text-zinc-500 transition hover:border-primary-400 hover:text-primary-500 dark:border-zinc-700'>
							<Plus size={13} />
							New tag
						</button>
					)}

					<div className='flex justify-end gap-2.5 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							Cancel
						</button>
						<button
							type='button'
							onClick={handleSave}
							disabled={sync.isPending || isEditingSomething}
							className='inline-flex h-11 items-center justify-center rounded-xl bg-primary-400 px-5 text-sm font-bold text-primary-950 shadow-sm transition hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'>
							{sync.isPending ? 'Saving…' : 'Save tags'}
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default TagPickerModal;
