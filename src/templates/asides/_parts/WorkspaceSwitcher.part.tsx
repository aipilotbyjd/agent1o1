import { useState } from 'react';
import classNames from 'classnames';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import Skeleton from '@/components/ui/Skeleton';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import { useCreateWorkspace } from '@/api/modules/workspaces';
import { useCurrentWorkspace } from '@/context/workspaceContext';
import useAsideStatus from '@/hooks/useAsideStatus';
import getFirstLetterUtil from '@/utils/getFirstLetter.util';

// ============================================================
// Workspace Switcher
// ------------------------------------------------------------
// Which workspace the whole app is reading. It sits at the top of
// the aside rather than in the user menu because it scopes every
// screen below it — the user menu scopes only the account.
//
// Switching writes through `POST /user/switch-workspace`, which
// the backend persists, so the choice survives a reload and other
// devices agree with this one. Query keys are `[resource, ws, …]`,
// so the previous workspace's data stays cached instead of being
// mixed into the new one.
// ============================================================

const WorkspaceSwitcherPart = () => {
	const { asideStatus } = useAsideStatus();
	const { workspace, workspaces, workspaceId, isLoading, isSwitching, switchWorkspace } =
		useCurrentWorkspace();
	const createWorkspace = useCreateWorkspace();

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [name, setName] = useState('');

	const onCreate = async () => {
		if (!name.trim()) return;
		const created = await createWorkspace.mutateAsync({ name: name.trim() });
		// A workspace you just made is the one you meant to be in.
		await switchWorkspace(created.id);
		setName('');
		setIsCreateOpen(false);
	};

	if (isLoading && !workspace) return <Skeleton className='mb-4 h-11 w-full' />;
	if (!workspaceId) return null;

	const label = workspace?.name ?? 'Workspace';

	return (
		<>
			<Dropdown>
				<DropdownToggle hasIcon={false}>
					<button
						type='button'
						aria-label='Switch workspace'
						className={classNames(
							'mb-4 flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-500/25 px-2 transition-colors hover:border-zinc-500/50',
							{ 'justify-center': !asideStatus },
						)}>
						<span className='flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-500/15 text-xs font-semibold text-primary-500'>
							{getFirstLetterUtil(label)}
						</span>
						{asideStatus && (
							<>
								<span className='grow truncate text-start text-sm font-medium'>
									{label}
								</span>
								{isSwitching ? (
									<Spinner className='size-4' />
								) : (
									<Icon icon='ArrowDown01' className='shrink-0 text-zinc-500' />
								)}
							</>
						)}
					</button>
				</DropdownToggle>
				<DropdownMenu className='min-w-56'>
					{workspaces.map((item) => (
						<DropdownItem
							key={item.id}
							isActive={item.id === workspaceId}
							onClick={() => void switchWorkspace(item.id)}>
							<span className='flex items-center gap-2'>
								<span className='flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-500/15 text-[10px] font-semibold'>
									{getFirstLetterUtil(item.name)}
								</span>
								<span className='truncate'>{item.name}</span>
							</span>
						</DropdownItem>
					))}
					<DropdownItem onClick={() => setIsCreateOpen(true)}>
						<span className='flex items-center gap-2'>
							<Icon icon='PlusSignCircle' />
							New workspace
						</span>
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>

			<Modal isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} rounded='rounded-2xl'>
				<ModalHeader>New workspace</ModalHeader>
				<ModalBody>
					<Label htmlFor='workspace-name'>Name</Label>
					<Input
						id='workspace-name'
						name='workspace-name'
						value={name}
						placeholder='e.g. Growth team'
						onChange={(event) => setName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') void onCreate();
						}}
					/>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' color='zinc' onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button
							variant='solid'
							isLoading={createWorkspace.isPending}
							isDisable={!name.trim() || createWorkspace.isPending}
							onClick={() => void onCreate()}>
							Create
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default WorkspaceSwitcherPart;
