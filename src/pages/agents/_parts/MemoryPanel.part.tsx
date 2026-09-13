import { FC, useState } from 'react';
import {
	useAgentMemories,
	useCreateAgentMemory,
	useUpdateAgentMemory,
	useDeleteAgentMemory,
} from '@/api/modules/agents';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import DataTable, { TColumn } from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatRelative } from '@/utils/format.util';
import type { TAgentMemory } from '@/types/agent.type';

// ============================================================
// Memory Panel
// ------------------------------------------------------------
// Facts the agent carries between sessions, as plain key/value
// pairs. Editable by hand because the agent writes here itself —
// when it has remembered something wrong, this is where you fix
// it, and a read-only view would leave no way to.
//
// `user_id` scopes a memory to one person; null means it applies
// to everyone talking to this agent. Shown as a badge rather than
// an editable field: which user a memory belongs to is decided by
// where it came from, not by this form.
// ============================================================

interface IMemoryPanelProps {
	ws: string;
	agentId: string;
}

const MemoryPanelPart: FC<IMemoryPanelProps> = ({ ws, agentId }) => {
	const { data: memories, isLoading } = useAgentMemories(ws, agentId);
	const createMemory = useCreateAgentMemory(ws, agentId);
	const updateMemory = useUpdateAgentMemory(ws, agentId);
	const deleteMemory = useDeleteAgentMemory(ws, agentId);

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editing, setEditing] = useState<TAgentMemory | null>(null);
	const [pendingDelete, setPendingDelete] = useState<TAgentMemory | null>(null);
	const [key, setKey] = useState('');
	const [value, setValue] = useState('');

	const openCreate = () => {
		setEditing(null);
		setKey('');
		setValue('');
		setIsFormOpen(true);
	};

	const openEdit = (memory: TAgentMemory) => {
		setEditing(memory);
		setKey(memory.key);
		setValue(memory.value);
		setIsFormOpen(true);
	};

	const isPending = createMemory.isPending || updateMemory.isPending;
	const canSubmit = !!key.trim() && !!value.trim();

	const onSubmit = async () => {
		if (!canSubmit) return;
		const body = { key: key.trim(), value: value.trim() };
		if (editing) await updateMemory.mutateAsync({ id: editing.id, body });
		else await createMemory.mutateAsync(body);
		setIsFormOpen(false);
	};

	const columns: TColumn<TAgentMemory>[] = [
		{
			key: 'key',
			header: 'Key',
			cell: (memory) => (
				<div className='flex items-center gap-2'>
					<span className='font-mono font-medium'>{memory.key}</span>
					{memory.type && (
						<Badge color='zinc' variant='soft' rounded='rounded-full'>
							{memory.type}
						</Badge>
					)}
				</div>
			),
		},
		{
			key: 'value',
			header: 'Value',
			cell: (memory) => <span className='line-clamp-2'>{memory.value}</span>,
		},
		{
			key: 'scope',
			header: 'Scope',
			cell: (memory) => (
				<Badge
					color={memory.user_id ? 'violet' : 'zinc'}
					variant='soft'
					rounded='rounded-full'>
					{memory.user_id ? 'Per-user' : 'Shared'}
				</Badge>
			),
		},
		{
			key: 'updated',
			header: 'Updated',
			className: 'text-zinc-500',
			cell: (memory) => formatRelative(memory.updated_at),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			cell: (memory) => (
				<div className='flex justify-end gap-2'>
					<Button
						variant='outline'
						color='zinc'
						dimension='sm'
						icon='PencilEdit02'
						aria-label={`Edit ${memory.key}`}
						onClick={() => openEdit(memory)}
					/>
					<Button
						variant='outline'
						color='red'
						dimension='sm'
						icon='Delete02'
						aria-label={`Delete ${memory.key}`}
						onClick={() => setPendingDelete(memory)}
					/>
				</div>
			),
		},
	];

	return (
		<>
			<Card>
				<CardBody>
					<div className='mb-4 flex items-center justify-between gap-4'>
						<p className='text-sm text-zinc-500'>
							What this agent remembers between sessions. The agent writes here
							itself — edit an entry to correct it.
						</p>
						<Button
							variant='outline'
							color='zinc'
							dimension='sm'
							icon='PlusSignCircle'
							onClick={openCreate}>
							New memory
						</Button>
					</div>

					<DataTable
						columns={columns}
						rows={memories}
						rowKey={(memory) => memory.id}
						isLoading={isLoading}
						skeletonRows={3}
						empty={
							<EmptyState
								icon='Brain'
								title='Nothing remembered yet'
								description='Facts the agent picks up during conversations show up here.'
								action={
									<Button variant='solid' onClick={openCreate}>
										Add one by hand
									</Button>
								}
							/>
						}
					/>
				</CardBody>
			</Card>

			<Modal isOpen={isFormOpen} setIsOpen={setIsFormOpen} rounded='rounded-2xl' isScrollable>
				<ModalHeader>{editing ? `Edit ${editing.key}` : 'New memory'}</ModalHeader>
				<ModalBody className='flex flex-col gap-4'>
					<div>
						<Label htmlFor='memory-key'>Key</Label>
						<Input
							id='memory-key'
							name='memory-key'
							className='font-mono'
							value={key}
							placeholder='preferred_tone'
							onChange={(event) => setKey(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor='memory-value'>Value</Label>
						<Textarea
							id='memory-value'
							name='memory-value'
							rows={4}
							value={value}
							placeholder='Concise and direct; no filler.'
							onChange={(event) => setValue(event.target.value)}
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='zinc'
							isDisable={isPending}
							onClick={() => setIsFormOpen(false)}>
							Cancel
						</Button>
						<Button
							variant='solid'
							isLoading={isPending}
							isDisable={!canSubmit || isPending}
							onClick={() => void onSubmit()}>
							{editing ? 'Save' : 'Add memory'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Forget “${pendingDelete?.key}”?`}
				description='The agent stops carrying this between sessions. This cannot be undone.'
				confirmLabel='Forget'
				isPending={deleteMemory.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteMemory.mutate(pendingDelete.id, {
						onSuccess: () => setPendingDelete(null),
					});
				}}
			/>
		</>
	);
};

export default MemoryPanelPart;
