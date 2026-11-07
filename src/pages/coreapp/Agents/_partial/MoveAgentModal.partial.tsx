import { Check, Folder, FolderInput, Inbox, Loader2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useMoveAgentsToFolder } from '@/api/modules/folders';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { FOLDER_COLORS, type TFlatFolder } from '../_helper/agentFolders.helper';

/**
 * Pick the folder an agent lives in. One click moves it: the backend's
 * `move-agents` takes a list, but a card only ever moves itself.
 */
const MoveAgentModal = ({
	ws,
	agent,
	folders,
	onClose,
}: {
	ws: string;
	/** `null` closes the modal. */
	agent: { id: string; name: string; folderId: string | null } | null;
	folders: TFlatFolder[];
	onClose: () => void;
}) => {
	const moveAgents = useMoveAgentsToFolder(ws);

	const move = (folderId: string | null) => {
		if (!agent) return;
		if (folderId === agent.folderId) {
			onClose();
			return;
		}
		const folderName = folders.find((f) => f.id === folderId)?.label;
		moveAgents.mutate(
			{ agent_ids: [agent.id], folder_id: folderId },
			{
				onSuccess: () => {
					notify.success(
						folderName
							? `Moved "${agent.name}" to "${folderName}".`
							: `Moved "${agent.name}" out of its folder.`,
					);
					onClose();
				},
			},
		);
	};

	const options: { id: string | null; label: string; color?: string | null }[] = [
		{ id: null, label: 'No folder' },
		...folders.map((f) => ({ id: f.id, label: f.label, color: f.color })),
	];

	return (
		<Modal isOpen={!!agent} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<FolderInput size={18} />
					</div>
					<div className='flex min-w-0 flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Move to folder
						</span>
						<span className='mt-1 truncate text-xs font-semibold text-zinc-400'>
							{agent?.name}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-1.5 pt-1 pb-2'>
					{options.map((option) => {
						const isCurrent = (agent?.folderId ?? null) === option.id;
						const Icon = option.id === null ? Inbox : Folder;
						return (
							<button
								key={option.id ?? 'none'}
								type='button'
								disabled={moveAgents.isPending}
								onClick={() => move(option.id)}
								className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition disabled:cursor-wait ${
									isCurrent
										? 'border-primary-400 bg-primary-50/60 text-primary-700 dark:border-primary-500/40 dark:bg-primary-950/20 dark:text-primary-400'
										: 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
								}`}>
								<Icon
									size={15}
									className='shrink-0'
									style={
										option.id === null
											? undefined
											: { color: option.color || FOLDER_COLORS[0] }
									}
								/>
								<span className='min-w-0 flex-1 truncate'>{option.label}</span>
								{isCurrent && <Check size={14} className='shrink-0' />}
								{moveAgents.isPending &&
									moveAgents.variables?.folder_id === option.id && (
										<Loader2 size={14} className='shrink-0 animate-spin' />
									)}
							</button>
						);
					})}
					{folders.length === 0 && (
						<p className='px-1 pt-2 text-xs font-semibold text-zinc-400'>
							No agent folders yet. Use &quot;New folder&quot; above the agent list to
							make one.
						</p>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

export default MoveAgentModal;
