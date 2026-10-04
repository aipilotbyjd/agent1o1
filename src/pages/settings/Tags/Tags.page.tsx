import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/api/modules/tags';
import { useWorkspaceContext } from '@/context/workspace';
import { useConfirm } from '@/context/confirm';
import { ApiError, notify } from '@/api/core';
import type { TTag } from '@/types/tag.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Spinner from '@/components/ui/Spinner';

const TAG_COLORS = [
	'#6366F1',
	'#7C3AED',
	'#EC4899',
	'#EF4444',
	'#F59E0B',
	'#10A37F',
	'#0EA5E9',
	'#64748B',
];

const DEFAULT_TAG_COLOR = '#64748B';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/**
 * Workspace tags — one list shared by workflows and agents. Renaming or
 * recolouring a tag changes it everywhere it is attached; deleting it only
 * detaches it, nothing tagged is removed.
 */
const TagsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { confirm } = useConfirm();
	const { data: tags = [], isLoading, error } = useTags(activeWorkspaceId);
	const createTag = useCreateTag(activeWorkspaceId);
	const updateTag = useUpdateTag(activeWorkspaceId);
	const deleteTag = useDeleteTag(activeWorkspaceId);

	// `null` = closed, `'new'` = create, a tag = edit.
	const [editing, setEditing] = useState<TTag | 'new' | null>(null);
	const [name, setName] = useState('');
	const [color, setColor] = useState(DEFAULT_TAG_COLOR);
	const [nameError, setNameError] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const openCreate = () => {
		setEditing('new');
		setName('');
		setColor(TAG_COLORS[0]);
		setNameError(null);
	};

	const openEdit = (tag: TTag) => {
		setEditing(tag);
		setName(tag.name);
		setColor(tag.color || DEFAULT_TAG_COLOR);
		setNameError(null);
	};

	const closeModal = () => setEditing(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setNameError('Give the tag a name');
			return;
		}
		const duplicate = tags.find(
			(t) =>
				t.name.toLowerCase() === trimmed.toLowerCase() &&
				(editing === 'new' || t.id !== editing?.id),
		);
		if (duplicate) {
			setNameError(`"${duplicate.name}" already exists`);
			return;
		}
		try {
			if (editing === 'new') {
				await createTag.mutateAsync({ name: trimmed, color });
				notify.success(`Tag "${trimmed}" created.`);
			} else if (editing) {
				await updateTag.mutateAsync({ id: editing.id, body: { name: trimmed, color } });
				notify.success(`Tag "${trimmed}" saved.`);
			}
			closeModal();
		} catch (err) {
			// Field errors stay in the dialog; anything else was already toasted.
			setNameError(ApiError.is(err) ? (err.field('name') ?? null) : null);
		}
	};

	const handleDelete = async (tag: TTag) => {
		const uses = (tag.workflow_count ?? 0) + (tag.agent_count ?? 0);
		const confirmed = await confirm({
			title: 'Delete tag',
			message: (
				<>
					Delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{tag.name}&quot;
					</strong>
					?{' '}
					{uses > 0
						? `It will be removed from ${plural(uses, 'item')} that use it. Nothing else is deleted.`
						: 'Nothing uses it yet.'}
				</>
			),
		});
		if (!confirmed) return;
		deleteTag.mutate(tag.id, {
			onSuccess: () => notify.success(`Tag "${tag.name}" deleted.`),
		});
	};

	const query = search.trim().toLowerCase();
	const visibleTags = query ? tags.filter((t) => t.name.toLowerCase().includes(query)) : tags;
	const isSaving = createTag.isPending || updateTag.isPending;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Tags
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Labels for organising workflows and agents. Changes apply everywhere a tag is used.
					</p>
				</div>
				<Button
					variant='solid'
					color='primary'
					icon='Add01'
					onClick={openCreate}
					className='shadow-primary-500/10 h-12 font-bold text-zinc-950 shadow-md'>
					New tag
				</Button>
			</div>

			{tags.length > 6 && (
				<div className='relative mb-5 w-full sm:max-w-sm'>
					<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400' />
					<input
						type='search'
						aria-label='Search tags'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='Search tags'
						className='focus:border-primary-500 focus:ring-primary-500/25 h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-10 text-sm font-medium text-zinc-800 shadow-xs outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
					/>
				</div>
			)}

			{isLoading ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900'>
					<Spinner color='primary' className='size-8' />
					<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Loading tags...
					</p>
				</div>
			) : error ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900'>
					<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
						<Tag size={24} />
					</div>
					<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
						Could not load tags
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Please try again after refreshing.
					</p>
				</div>
			) : tags.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs'>
						<Tag size={22} />
					</div>
					<h3 className='text-lg font-bold text-zinc-900 dark:text-white'>No tags yet</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Create one here, or add tags straight from a workflow or agent.
					</p>
					<button
						type='button'
						onClick={openCreate}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95'>
						<Plus size={14} />
						<span>Create your first tag</span>
					</button>
				</div>
			) : visibleTags.length === 0 ? (
				<p className='rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-800'>
					No tags match &quot;{search}&quot;.
				</p>
			) : (
				<div className='space-y-3'>
					{visibleTags.map((tag) => {
						const tagColor = tag.color || DEFAULT_TAG_COLOR;
						return (
							<div
								key={tag.id}
								className='flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs transition hover:border-zinc-200 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'>
								<div className='flex min-w-0 items-center gap-4'>
									<div
										className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl'
										style={{ backgroundColor: `${tagColor}1f`, color: tagColor }}>
										<Tag size={18} />
									</div>
									<div className='min-w-0'>
										<p className='truncate text-sm font-black text-zinc-900 dark:text-zinc-100'>
											{tag.name}
										</p>
										<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											{plural(tag.workflow_count ?? 0, 'workflow')} ·{' '}
											{plural(tag.agent_count ?? 0, 'agent')}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-2 pl-15 sm:pl-0'>
									<button
										type='button'
										onClick={() => openEdit(tag)}
										className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
										<Pencil size={13} />
										Edit
									</button>
									<button
										type='button'
										aria-label={`Delete ${tag.name}`}
										onClick={() => handleDelete(tag)}
										className='rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<Modal isOpen={editing !== null} setIsOpen={(open) => !open && closeModal()} size='sm'>
				<ModalHeader setIsOpen={closeModal}>
					<div className='flex items-center gap-3'>
						<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
							{editing === 'new' ? <Plus size={18} /> : <Pencil size={16} />}
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{editing === 'new' ? 'New tag' : 'Edit tag'}
						</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleSubmit}>
					<ModalBody>
						<div className='space-y-4 pt-2'>
							<div>
								<Input
									label='Name'
									name='name'
									required
									maxLength={100}
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setNameError(null);
									}}
									placeholder='e.g. Sales'
									variant='default'
									dimension='default'
								/>
								{nameError && (
									<p className='mt-1.5 text-xs font-semibold text-red-500'>{nameError}</p>
								)}
							</div>
							<div>
								<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
									Color
								</div>
								<div className='flex flex-wrap gap-2'>
									{TAG_COLORS.map((swatch) => (
										<button
											key={swatch}
											type='button'
											aria-label={`Color ${swatch}`}
											aria-pressed={color === swatch}
											onClick={() => setColor(swatch)}
											style={{ backgroundColor: swatch }}
											className={`h-8 w-8 cursor-pointer rounded-xl transition-all ${
												color === swatch
													? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900'
													: ''
											}`}
										/>
									))}
								</div>
							</div>
							{editing !== 'new' && editing !== null && (
								<p className='text-xs font-semibold text-zinc-400'>
									Used by {plural(editing.workflow_count ?? 0, 'workflow')} and{' '}
									{plural(editing.agent_count ?? 0, 'agent')}. They all pick up the change.
								</p>
							)}
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<Button
								variant='outline'
								color='zinc'
								onClick={closeModal}
								className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='solid'
								color='primary'
								isLoading={isSaving}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								{editing === 'new' ? 'Create tag' : 'Save'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>
		</div>
	);
};

export default TagsPage;
