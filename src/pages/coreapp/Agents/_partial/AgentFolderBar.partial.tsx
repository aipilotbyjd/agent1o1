import { useState } from 'react';
import type { FormEvent } from 'react';
import { Folder, FolderPlus, Inbox, Layers, Pencil, Trash2 } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useCreateFolder, useDeleteFolder, useUpdateFolder } from '@/api/modules/folders';
import { useConfirm } from '@/context/confirm';
import type { TFolder } from '@/types/folder.type';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import { FOLDER_COLORS, type TAgentFolderFilter, type TFlatFolder } from '../_helper/agentFolders.helper';

const chipBase =
	'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all';
const chipActive = 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r';
const chipIdle =
	'border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card border text-slate-600 hover:bg-zinc-50/50 hover:text-slate-800 dark:text-zinc-400';

/**
 * Folder strip above the agent grid: filter by folder, and create, rename or
 * delete agent folders. Agent folders are their own tree (`type: 'agent'`),
 * separate from workflow folders even when the names match.
 */
const AgentFolderBar = ({
	ws,
	folders,
	counts,
	total,
	selected,
	onSelect,
}: {
	ws: string;
	folders: TFlatFolder[];
	/** Agent count per folder id, plus `none` for unfiled. */
	counts: Record<string, number>;
	total: number;
	selected: TAgentFolderFilter;
	onSelect: (filter: TAgentFolderFilter) => void;
}) => {
	const { confirm } = useConfirm();
	const createFolder = useCreateFolder(ws);
	const updateFolder = useUpdateFolder(ws);
	const deleteFolder = useDeleteFolder(ws);

	// `null` = closed, `'new'` = create, a folder = rename.
	const [editing, setEditing] = useState<TFolder | 'new' | null>(null);
	const [name, setName] = useState('');
	const [color, setColor] = useState(FOLDER_COLORS[0]);
	const [nameError, setNameError] = useState<string | null>(null);

	const openCreate = () => {
		setEditing('new');
		setName('');
		setColor(FOLDER_COLORS[0]);
		setNameError(null);
	};

	const openRename = (folder: TFolder) => {
		setEditing(folder);
		setName(folder.name);
		setColor(folder.color || FOLDER_COLORS[0]);
		setNameError(null);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setNameError('Give the folder a name');
			return;
		}
		try {
			if (editing === 'new') {
				const created = await createFolder.mutateAsync({ type: 'agent', name: trimmed, color });
				notify.success(`Folder "${created.name}" created.`);
				onSelect(created.id);
			} else if (editing) {
				await updateFolder.mutateAsync({ id: editing.id, body: { name: trimmed, color } });
			}
			setEditing(null);
		} catch (err) {
			setNameError(ApiError.is(err) ? (err.field('name') ?? null) : null);
		}
	};

	const handleDelete = async (folder: TFolder) => {
		const inside = counts[folder.id] ?? 0;
		const confirmed = await confirm({
			title: 'Delete folder',
			message: (
				<>
					Delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{folder.name}&quot;
					</strong>
					?{' '}
					{inside > 0
						? `The ${inside} agent${inside === 1 ? '' : 's'} inside move out of it, nothing is deleted.`
						: 'It is empty.'}
				</>
			),
		});
		if (!confirmed) return;
		deleteFolder.mutate(folder.id, {
			onSuccess: () => {
				notify.success(`Folder "${folder.name}" deleted.`);
				if (selected === folder.id) onSelect('all');
			},
		});
	};

	return (
		<>
			<div className='no-scrollbar -mt-2 flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1'>
				<button
					type='button'
					onClick={() => onSelect('all')}
					className={`${chipBase} ${selected === 'all' ? chipActive : chipIdle}`}>
					<Layers size={13} />
					All agents
					<span className='opacity-60'>{total}</span>
				</button>
				<button
					type='button'
					onClick={() => onSelect('none')}
					className={`${chipBase} ${selected === 'none' ? chipActive : chipIdle}`}>
					<Inbox size={13} />
					No folder
					<span className='opacity-60'>{counts.none ?? 0}</span>
				</button>
				{folders.map((folder) => {
					const isActive = selected === folder.id;
					return (
						<div
							key={folder.id}
							className={`group ${chipBase} cursor-default pr-1.5 ${isActive ? chipActive : chipIdle}`}>
							<button
								type='button'
								onClick={() => onSelect(folder.id)}
								className='flex cursor-pointer items-center gap-1.5'>
								<Folder
									size={13}
									style={isActive ? undefined : { color: folder.color || FOLDER_COLORS[0] }}
								/>
								<span>{folder.label}</span>
								<span className='opacity-60'>{counts[folder.id] ?? 0}</span>
							</button>
							<button
								type='button'
								aria-label={`Rename folder ${folder.name}`}
								onClick={() => openRename(folder)}
								className='rounded-lg p-1 opacity-100 transition-opacity hover:bg-black/10 sm:opacity-0 sm:group-hover:opacity-100'>
								<Pencil size={11} />
							</button>
							<button
								type='button'
								aria-label={`Delete folder ${folder.name}`}
								onClick={() => handleDelete(folder)}
								className='rounded-lg p-1 opacity-100 transition-opacity hover:bg-black/10 sm:opacity-0 sm:group-hover:opacity-100'>
								<Trash2 size={11} />
							</button>
						</div>
					);
				})}
				<button
					type='button'
					onClick={openCreate}
					className={`${chipBase} border border-dashed border-zinc-300 text-slate-500 hover:border-primary-400 hover:text-primary-600 dark:border-zinc-700 dark:text-zinc-400`}>
					<FolderPlus size={13} />
					New folder
				</button>
			</div>

			<Modal isOpen={editing !== null} setIsOpen={(open) => !open && setEditing(null)} size='sm'>
				<ModalHeader setIsOpen={() => setEditing(null)}>
					<div className='flex items-center gap-3'>
						<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
							<FolderPlus size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{editing === 'new' ? 'New agent folder' : 'Rename folder'}
						</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleSubmit}>
					<ModalBody>
						<div className='space-y-4 pt-2'>
							<div>
								<Input
									label='Name'
									name='folder-name'
									required
									maxLength={255}
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setNameError(null);
									}}
									placeholder='e.g. Support team'
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
									{FOLDER_COLORS.map((swatch) => (
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
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<Button
								variant='outline'
								color='zinc'
								onClick={() => setEditing(null)}
								className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='solid'
								color='primary'
								isLoading={createFolder.isPending || updateFolder.isPending}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								{editing === 'new' ? 'Create folder' : 'Save'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>
		</>
	);
};

export default AgentFolderBar;
