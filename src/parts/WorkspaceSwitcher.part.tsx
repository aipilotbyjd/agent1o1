import { useState } from 'react';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import { useWorkspaceContext } from '@/context/workspaceContext';

const WorkspaceSwitcherPart = () => {
	const { workspaces, activeWorkspaceId, switchWorkspace, createWorkspace, isCreating } =
		useWorkspaceContext();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [name, setName] = useState('');

	const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

	const handleCreate = async () => {
		if (!name.trim()) return;
		await createWorkspace({ name: name.trim() });
		setName('');
		setIsModalOpen(false);
	};

	if (workspaces.length === 0) return null;

	return (
		<>
			<Dropdown className='mb-4'>
				<DropdownToggle>
					<Badge
						variant='soft'
						color='zinc'
						rounded='rounded-full'
						className='w-full cursor-pointer justify-start transition-all duration-300 ease-in-out hover:opacity-75'>
						<Avatar name={activeWorkspace?.name} size='w-8' color='zinc' className='my-1.5' />
						<span className='truncate'>{activeWorkspace?.name ?? 'Select workspace'}</span>
					</Badge>
				</DropdownToggle>
				<DropdownMenu className='max-w-md min-w-xs'>
					<div className='text-zinc-500'>Workspaces ({workspaces.length})</div>
					{workspaces.map((workspace) => (
						<DropdownItem
							key={workspace.id}
							onClick={() => {
								if (workspace.id !== activeWorkspaceId) switchWorkspace(workspace.id);
							}}>
							<div className='w-8'>
								{workspace.id === activeWorkspaceId && <Icon icon='Tick02' />}
							</div>
							<div className='flex flex-col'>
								<div>{workspace.name}</div>
								<div className='text-sm text-zinc-500'>{workspace.slug}</div>
							</div>
							<div className='ms-auto'>
								<Avatar name={workspace.name} rounded='rounded-xl' color='zinc' />
							</div>
						</DropdownItem>
					))}
					<DropdownItem onClick={() => setIsModalOpen(true)}>
						<div className='w-8'>
							<Icon icon='PlusSignCircle' />
						</div>
						<div className='flex flex-col'>
							<div>Add a workspace</div>
						</div>
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>

			<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} rounded='rounded-2xl'>
				<ModalHeader>Create workspace</ModalHeader>
				<ModalBody>
					<Label htmlFor='workspace-name'>Workspace name</Label>
					<Input
						id='workspace-name'
						name='workspace-name'
						placeholder='Acme Inc.'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='solid'
							aria-label='Create workspace'
							disabled={!name.trim() || isCreating}
							onClick={handleCreate}>
							{isCreating ? 'Creating...' : 'Create workspace'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default WorkspaceSwitcherPart;
