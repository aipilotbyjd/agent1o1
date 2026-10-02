import { useMemo, useState } from 'react';
import { Building2, Lock, Share2, UserPlus, X } from 'lucide-react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { notify } from '@/api/core';
import {
	useAddArtifactShare,
	useRemoveArtifactShare,
	useUpdateArtifactAccess,
} from '@/api/modules/artifacts';
import { useWorkspaceMembers } from '@/api/modules/workspace-members';
import { useCurrentUser } from '@/api/modules/user';
import type { TArtifact, TArtifactGeneralAccess, TArtifactShare } from '@/types/artifact.type';
import type { TWorkspaceRole } from '@/types/workspace.type';

/** Roles the backend grants `artifact.manage` — see `Permission::editorGrants()`. */
const MANAGER_ROLES: TWorkspaceRole[] = ['owner', 'admin', 'editor'];

/**
 * The backend has three levels, but with no anonymous request path
 * `organization` and `anyone` both mean "any workspace member", so only two
 * choices are offered and `anyone` reads as the workspace one.
 */
const ACCESS_OPTIONS: {
	value: TArtifactGeneralAccess;
	label: string;
	hint: string;
	icon: typeof Lock;
}[] = [
	{
		value: 'restricted',
		label: 'Restricted',
		hint: 'Only you, workspace managers and people you add',
		icon: Lock,
	},
	{
		value: 'organization',
		label: 'Everyone in the workspace',
		hint: 'Any member can view and download it',
		icon: Building2,
	},
];

interface IArtifactShareModalProps {
	ws: string;
	artifact: TArtifact | null;
	onClose: () => void;
}

const ArtifactShareModal = ({ ws, artifact, onClose }: IArtifactShareModalProps) => {
	return (
		<Modal isOpen={!!artifact} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-600 dark:text-primary-400'>
						<Share2 size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Sharing
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{artifact?.filename}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{/* Keyed so reopening for another artifact starts from its own state. */}
				{artifact && <ShareBody key={artifact.id} ws={ws} artifact={artifact} />}
			</ModalBody>
		</Modal>
	);
};

const ShareBody = ({ ws, artifact }: { ws: string; artifact: TArtifact }) => {
	const { data: me } = useCurrentUser();
	const { data: members } = useWorkspaceMembers(ws);
	const updateAccess = useUpdateArtifactAccess(ws);
	const addShare = useAddArtifactShare(ws);
	const removeShare = useRemoveArtifactShare(ws);

	const [access, setAccess] = useState<TArtifactGeneralAccess>(
		artifact.general_access === 'anyone' ? 'organization' : artifact.general_access,
	);
	// Neither the list nor the detail endpoint returns existing shares — only
	// the add-share response does — so this starts empty and fills as you add.
	const [shares, setShares] = useState<TArtifactShare[]>(artifact.shared_with ?? []);
	const [selectedUserId, setSelectedUserId] = useState('');

	const myId = me ? String(me.id) : '';
	const myRole = members?.find((m) => String(m.user_id) === myId)?.role;
	const canShare =
		String(artifact.creator?.id ?? '') === myId || (!!myRole && MANAGER_ROLES.includes(myRole));

	const candidates = useMemo(() => {
		const taken = new Set(shares.map((s) => String(s.user_id)));
		return (members ?? []).filter(
			(m) => String(m.user_id) !== myId && !taken.has(String(m.user_id)),
		);
	}, [members, shares, myId]);

	const handleAccess = (value: TArtifactGeneralAccess) => {
		if (value === access) return;
		const previous = access;
		setAccess(value);
		updateAccess.mutate(
			{ id: artifact.id, body: { general_access: value } },
			{
				onSuccess: () =>
					notify.success(
						value === 'restricted' ? 'Access restricted.' : 'Shared with the workspace.',
					),
				onError: () => setAccess(previous),
			},
		);
	};

	const handleAdd = () => {
		if (!selectedUserId) return;
		addShare.mutate(
			{ id: artifact.id, body: { user_id: selectedUserId } },
			{
				onSuccess: (updated) => {
					setShares(updated.shared_with ?? []);
					setSelectedUserId('');
					notify.success('Shared.');
				},
			},
		);
	};

	const handleRemove = (userId: string) => {
		removeShare.mutate(
			{ id: artifact.id, userId },
			{
				onSuccess: () => setShares((list) => list.filter((s) => String(s.user_id) !== userId)),
			},
		);
	};

	return (
		<div className='space-y-5 pt-2'>
			{!canShare && (
				<p className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400'>
					Only the person who created this file or a workspace manager can change its sharing.
				</p>
			)}

			<div className='space-y-2'>
				<p className='text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-zinc-400'>
					General access
				</p>
				{ACCESS_OPTIONS.map((option) => {
					const Icon = option.icon;
					const active = access === option.value;
					return (
						<button
							key={option.value}
							type='button'
							disabled={!canShare || updateAccess.isPending}
							onClick={() => handleAccess(option.value)}
							className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed ${
								active
									? 'border-primary-400 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-950/20'
									: 'border-border-main bg-bg-main hover:bg-slate-50 dark:bg-zinc-950/40 dark:hover:bg-zinc-900'
							} ${!canShare && !active ? 'opacity-50' : ''}`}>
							<Icon
								size={15}
								className={active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}
							/>
							<span className='flex flex-col'>
								<span className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
									{option.label}
								</span>
								<span className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
									{option.hint}
								</span>
							</span>
						</button>
					);
				})}
			</div>

			<div className='space-y-2'>
				<p className='text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-zinc-400'>
					People with access
				</p>
				{access !== 'restricted' && (
					<p className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
						Everyone in the workspace can already see this. People you add keep access if you
						switch to Restricted later.
					</p>
				)}
				<div className='flex gap-2'>
					<select
						aria-label='Workspace member'
						value={selectedUserId}
						disabled={!canShare || candidates.length === 0}
						onChange={(e) => setSelectedUserId(e.target.value)}
						className='h-9 min-w-0 flex-1 rounded-xl border border-border-main bg-bg-card px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200'>
						<option value=''>
							{candidates.length === 0 ? 'No other members to add' : 'Choose a member…'}
						</option>
						{candidates.map((m) => (
							<option key={m.user_id} value={String(m.user_id)}>
								{m.user?.name ?? m.user?.email ?? 'Member'}
								{m.user?.email && m.user?.name ? ` (${m.user.email})` : ''}
							</option>
						))}
					</select>
					<button
						type='button'
						disabled={!canShare || !selectedUserId || addShare.isPending}
						onClick={handleAdd}
						className='flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-primary-400 px-3 text-[11px] font-bold text-primary-950 transition-all hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50'>
						<UserPlus size={13} />
						Add
					</button>
				</div>

				{shares.length > 0 && (
					<div className='space-y-1.5'>
						{shares.map((share) => (
							<div
								key={share.user_id}
								className='flex items-center justify-between rounded-xl border border-border-main bg-bg-main px-3 py-2 dark:bg-zinc-950/40'>
								<div className='min-w-0'>
									<p className='truncate text-xs font-bold text-slate-800 dark:text-zinc-200'>
										{share.user?.name ?? 'Member'}
									</p>
									{share.user?.email && (
										<p className='truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											{share.user.email}
										</p>
									)}
								</div>
								<button
									type='button'
									aria-label='Remove access'
									title='Remove access'
									disabled={!canShare || removeShare.isPending}
									onClick={() => handleRemove(String(share.user_id))}
									className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-950/20'>
									<X size={13} />
								</button>
							</div>
						))}
					</div>
				)}
				<p className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
					People shared with earlier aren&apos;t listed here yet.
				</p>
			</div>
		</div>
	);
};

export default ArtifactShareModal;
