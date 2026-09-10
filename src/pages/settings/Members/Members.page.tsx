import { useState } from 'react';
import { Trash2, UserPlus, Mail, UserCheck, Shield, User } from 'lucide-react';
import {
	useFetchMembers,
	useUpdateMemberRole,
	useRemoveMember,
	useFetchInvitations,
	useSendInvitation,
	useCancelInvitation,
} from '@/api/modules/workspace-members/workspace-members.hooks';
import { useWorkspaceContext } from '@/context/workspaceContext';

import type { TWorkspaceMember, TWorkspaceRole } from '@/types/workspace.type';
import { notify } from '@/api/core';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

const roleOptions: { value: TWorkspaceRole; label: string; description: string }[] = [
	{ value: 'owner', label: 'Owner', description: 'Full access to all settings and billing.' },
	{ value: 'admin', label: 'Admin', description: 'Can manage members, settings, and workflows.' },
	{ value: 'editor', label: 'Editor', description: 'Can create and edit workflows and agents.' },
	{ value: 'member', label: 'Member', description: 'Can view and run workflows and agents.' },
	{ value: 'viewer', label: 'Viewer', description: 'Read-only access to workflows and runs.' },
];

const getInitials = (name: string) => {
	if (!name) return '?';
	const parts = name.split(' ');
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return parts[0][0].toUpperCase();
};

const getAvatarBg = (id: string) => {
	const bgs = [
		'bg-primary-400 dark:bg-primary-400',
		'bg-primary-400 dark:bg-primary-400',
		'bg-emerald-500 dark:bg-emerald-600',
		'bg-sky-500 dark:bg-sky-600',
		'bg-amber-500 dark:bg-amber-600',
		'bg-primary-400 dark:bg-primary-400',
	];
	const index = parseInt(id, 10) || 0;
	return bgs[index % bgs.length];
};

const MembersPage = () => {
	const {
		activeWorkspaceId: workspaceId,
		activeWorkspace,
		isWorkspacesLoading,
	} = useWorkspaceContext();

	const workspaceName = activeWorkspace?.name ?? 'this workspace';

	// Tabs state
	const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

	// Modals state
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<TWorkspaceMember | null>(null);

	// Invite Form state
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState<TWorkspaceRole>('member');
	const [inviteMessage, setInviteMessage] = useState('');

	// API hooks
	const {
		data: members = [],
		isLoading: isMembersLoading,
		error: membersError,
	} = useFetchMembers(workspaceId);
	const {
		data: invitations = [],
		isLoading: isInvitationsLoading,
		error: invitationsError,
	} = useFetchInvitations(workspaceId);

	const updateRoleMutation = useUpdateMemberRole(workspaceId);
	const removeMemberMutation = useRemoveMember(workspaceId);
	const sendInvitationMutation = useSendInvitation(workspaceId);
	const cancelInvitationMutation = useCancelInvitation(workspaceId);

	const hasWorkspace = Boolean(workspaceId);
	const isResolvingWorkspace = isWorkspacesLoading && !workspaceId;

	// Mutators
	const handleRoleChange = async (user: string | number, newRole: TWorkspaceRole) => {
		if (!hasWorkspace) return;
		try {
			await updateRoleMutation.mutateAsync({ user, body: { role: newRole } });
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleRemoveMember = async () => {
		if (!memberToRemove) return;
		const userId = memberToRemove.user_id || memberToRemove.id;

		if (!hasWorkspace) {
			setMemberToRemove(null);
			return;
		}

		try {
			await removeMemberMutation.mutateAsync(userId);
			setMemberToRemove(null);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleInviteMember = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteEmail) {
			notify.error('Please enter a valid email');
			return;
		}

		if (!hasWorkspace) {
			notify.error('Select a workspace before inviting members');
			return;
		}

		try {
			await sendInvitationMutation.mutateAsync({
				email: inviteEmail,
				role: inviteRole,
				message: inviteMessage || undefined,
			});
			setIsInviteModalOpen(false);
			setInviteEmail('');
			setInviteMessage('');
			setInviteRole('member');
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleCancelInvitation = async (invitationId: string) => {
		if (!hasWorkspace) return;
		try {
			await cancelInvitationMutation.mutateAsync(invitationId);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			{/* Page Header */}
			<div className='mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Members & Access
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Manage access roles, invite teammates, or remove accounts.
					</p>
				</div>
				<div>
					<Button
						variant='solid'
						color='primary'
						icon='UserAdd01'
						onClick={() => setIsInviteModalOpen(true)}
						className='shadow-primary-500/10 h-12 font-bold text-zinc-950 shadow-md'>
						Invite member
					</Button>
				</div>
			</div>

			{/* Tabs & Filter Bar */}
			<div className='mb-6 flex border-b border-zinc-200 dark:border-zinc-700'>
				<button
					type='button'
					onClick={() => setActiveTab('members')}
					className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition-all ${
						activeTab === 'members'
							? 'border-primary-500 text-primary-600 dark:text-primary-400'
							: 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
					}`}>
					<UserCheck size={16} />
					Active Members
					<span
						className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
							activeTab === 'members'
								? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
								: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
						}`}>
						{members.length}
					</span>
				</button>
				<button
					type='button'
					onClick={() => setActiveTab('invitations')}
					className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition-all ${
						activeTab === 'invitations'
							? 'border-primary-500 text-primary-600 dark:text-primary-400'
							: 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
					}`}>
					<Mail size={16} />
					Pending Invitations
					{invitations.length > 0 && (
						<span
							className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
								activeTab === 'invitations'
									? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
									: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
							}`}>
							{invitations.length}
						</span>
					)}
				</button>
			</div>

			{/* Main Tables Content */}
			<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800'>
				{!hasWorkspace && !isResolvingWorkspace ? (
					<div className='flex flex-col items-center justify-center py-16 text-center'>
						<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-700'>
							<Shield size={24} />
						</div>
						<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
							No workspace selected
						</h3>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Select or create a workspace before managing members.
						</p>
					</div>
				) : activeTab === 'members' ? (
					isResolvingWorkspace || isMembersLoading ? (
						<div className='flex flex-col items-center justify-center py-20'>
							<Spinner color='primary' className='size-8' />
							<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
								Loading members for {workspaceName}...
							</p>
						</div>
					) : membersError ? (
						<div className='flex flex-col items-center justify-center py-16 text-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
								<User size={24} />
							</div>
							<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
								Could not load members
							</h3>
							<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
								Please try again after refreshing the workspace.
							</p>
						</div>
					) : members.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-16 text-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-700'>
								<User size={24} />
							</div>
							<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
								No members found
							</h3>
							<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
								Invite teammates to join this workspace.
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<Table className='min-w-full divide-y divide-zinc-200 dark:divide-zinc-800'>
								<THead className='bg-zinc-50 dark:bg-zinc-700/40'>
									<Tr>
										<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
											Teammate
										</Th>
										<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
											Joined
										</Th>
										<Th className='w-[180px] border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
											Access Role
										</Th>
										<Th className='w-[80px] border-0 !bg-transparent text-right text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
											Actions
										</Th>
									</Tr>
								</THead>
								<TBody className='divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800'>
									{members.map((member) => (
										<Tr
											key={member.id || member.user_id}
											className='transition-colors'>
											<Td className='flex items-center gap-3 border-0 py-4'>
												{member.avatar ? (
													<img
														src={member.avatar}
														alt={member.name}
														className='h-10 w-10 shrink-0 rounded-full object-cover'
													/>
												) : (
													<div
														className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner ${getAvatarBg(member.id || member.user_id)}`}>
														{getInitials(member.name)}
													</div>
												)}
												<div className='min-w-0'>
													<div className='truncate text-sm font-bold text-zinc-900 dark:text-white'>
														{member.name}
													</div>
													<div className='truncate text-xs font-medium text-zinc-500 dark:text-zinc-400'>
														{member.email}
													</div>
												</div>
											</Td>
											<Td className='border-0 text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
												{member.joined_at
													? new Date(member.joined_at).toLocaleDateString(
															'en-US',
															{
																year: 'numeric',
																month: 'short',
																day: 'numeric',
															},
														)
													: 'Just now'}
											</Td>
											<Td className='border-0'>
												{member.role === 'owner' ? (
													<div className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-primary-600 dark:text-primary-400'>
														<Shield size={15} />
														Owner
													</div>
												) : (
													<div className='relative w-full max-w-[140px]'>
														<select
															aria-label={`Change role for ${member.name}`}
															value={member.role}
															onChange={(e) =>
																handleRoleChange(
																	member.id || member.user_id,
																	e.target
																		.value as TWorkspaceRole,
																)
															}
															className='h-9 w-full cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-white px-2.5 pr-8 text-xs font-bold text-zinc-800 shadow-xs outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/50 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'>
															{roleOptions
																.filter(
																	(option) =>
																		option.value !== 'owner',
																)
																.map((option) => (
																	<option
																		key={option.value}
																		value={option.value}>
																		{option.label}
																	</option>
																))}
														</select>
														<div className='pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[8px] font-bold text-zinc-400 dark:text-zinc-600'>
															▼
														</div>
													</div>
												)}
											</Td>
											<Td className='border-0 text-right'>
												{member.role !== 'owner' ? (
													<button
														type='button'
														aria-label={`Remove ${member.name}`}
														onClick={() => setMemberToRemove(member)}
														className='rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'>
														<Trash2 size={16} />
													</button>
												) : (
													<span className='inline-block w-8' />
												)}
											</Td>
										</Tr>
									))}
								</TBody>
							</Table>
						</div>
					)
				) : isInvitationsLoading ? (
					<div className='flex flex-col items-center justify-center py-20'>
						<Spinner color='primary' className='size-8' />
						<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							Loading invitations...
						</p>
					</div>
				) : invitationsError ? (
					<div className='flex flex-col items-center justify-center py-16 text-center'>
						<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
							<Mail size={24} />
						</div>
						<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
							Could not load invitations
						</h3>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Please try again after refreshing the workspace.
						</p>
					</div>
				) : invitations.length === 0 ? (
					<div className='flex flex-col items-center justify-center py-16 text-center'>
						<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-700'>
							<Mail size={24} />
						</div>
						<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
							No pending invitations
						</h3>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Send an invitation to invite new team members.
						</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<Table className='min-w-full divide-y divide-zinc-200 dark:divide-zinc-800'>
							<THead className='bg-zinc-50 dark:bg-zinc-700/40'>
								<Tr>
									<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
										Email
									</Th>
									<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
										Role
									</Th>
									<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
										Invited By
									</Th>
									<Th className='border-0 !bg-transparent text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
										Expires
									</Th>
									<Th className='w-[120px] border-0 !bg-transparent text-right text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
										Action
									</Th>
								</Tr>
							</THead>
							<TBody className='divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800'>
								{invitations.map((inv) => (
									<Tr
										key={inv.id}
										className='transition-colors'>
										<Td className='border-0 py-4 text-sm font-bold text-zinc-900 dark:text-white'>
											{inv.email}
										</Td>
										<Td className='border-0'>
											<Badge
												color='violet'
												variant='soft'
												className='rounded-md px-2 py-0.5 text-xs font-bold uppercase'>
												{inv.role}
											</Badge>
										</Td>
										<Td className='border-0 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
											{inv.invited_by}
										</Td>
										<Td className='border-0 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
											{inv.expires_at
												? new Date(inv.expires_at).toLocaleDateString(
														'en-US',
														{
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														},
													)
												: 'In 30 days'}
										</Td>
										<Td className='border-0 text-right'>
											<Button
												variant='outline'
												color='red'
												dimension='sm'
												onClick={() => handleCancelInvitation(inv.id)}
												className='h-8 border-red-500/25 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'>
												Revoke
											</Button>
										</Td>
									</Tr>
								))}
							</TBody>
						</Table>
					</div>
				)}
			</div>

			{/* Invite Modal */}
			<Modal isOpen={isInviteModalOpen} setIsOpen={setIsInviteModalOpen} size='sm'>
				<ModalHeader setIsOpen={setIsInviteModalOpen}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
							<UserPlus size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Invite team member
						</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleInviteMember}>
					<ModalBody>
						<div className='space-y-4 pt-2'>
							<Input
								label='Email address'
								name='email'
								type='email'
								required
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
								placeholder='e.g. teammate@domain.com'
								variant='default'
								dimension='default'
							/>
							<div>
								<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
									Access Role
								</div>
								<Select
									name='role'
									aria-label='Access role'
									value={inviteRole}
									onChange={(e) =>
										setInviteRole(e.target.value as TWorkspaceRole)
									}
									variant='default'
									dimension='default'>
									{roleOptions
										.filter((option) => option.value !== 'owner')
										.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
								</Select>
								<p className='mt-2.5 text-xs leading-relaxed font-medium text-zinc-400 dark:text-zinc-500'>
									{roleOptions.find((o) => o.value === inviteRole)?.description}
								</p>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<Button
								variant='outline'
								color='zinc'
								onClick={() => setIsInviteModalOpen(false)}
								className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='solid'
								color='primary'
								isLoading={sendInvitationMutation.isPending}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								Send invitation
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>

			{/* Remove Confirmation Dialog */}
			<Modal
				isOpen={!!memberToRemove}
				setIsOpen={(open) => !open && setMemberToRemove(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setMemberToRemove(null)}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
							<Trash2 size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Remove member
						</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-base leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
						Are you sure you want to remove{' '}
						<span className='font-bold text-zinc-800 dark:text-zinc-100'>
							{memberToRemove?.name}
						</span>
						? They will immediately lose all access to this workspace and its resources.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={() => setMemberToRemove(null)}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							variant='solid'
							color='red'
							onClick={handleRemoveMember}
							isLoading={removeMemberMutation.isPending}
							className='h-11 font-bold text-white shadow-md shadow-red-500/15'>
							Remove
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default MembersPage;
