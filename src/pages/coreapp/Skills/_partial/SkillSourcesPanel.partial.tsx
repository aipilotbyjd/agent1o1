import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	AlertCircle,
	ExternalLink,
	FolderGit2,
	GitBranch,
	Loader2,
	RefreshCw,
	Unplug,
	Settings2,
} from 'lucide-react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { notify } from '@/api/core';
import {
	agentSkillKeys,
	isSkillSourceSyncing,
	useDisconnectSkillSource,
	useSkillSources,
	useSyncSkillSource,
} from '@/api/modules/agent-skills';
import type { TSkillSource } from '@/types/agent-skill.type';
import { SkillSyncSettingsDialog, SkillConflictsDialog } from './SkillSyncDialogs.partial';
import { ForkSkillSourceDialog, SkillUpstreamDialog } from './SkillPublishingDialogs.partial';
import relativeTime from '@/utils/relativeTime.util';

interface ISkillSourcesPanelProps {
	ws: string;
}

/** The GitHub repositories this workspace's skills are synced from. */
const SkillSourcesPanel = ({ ws }: ISkillSourcesPanelProps) => {
	const { data: sources } = useSkillSources(ws);
	const syncMutation = useSyncSkillSource(ws);
	const [forkId, setForkId] = useState<string | null>(null);
	const [upstreamId, setUpstreamId] = useState<string | null>(null);
	const forkSource = sources?.find((s) => s.id === forkId);
	const upstreamSource = sources?.find((s) => s.id === upstreamId);
	const [settingsId, setSettingsId] = useState<string | null>(null);
	const [conflictsId, setConflictsId] = useState<string | null>(null);
	const settingsSource = sources?.find((s) => s.id === settingsId);
	const conflictSource = sources?.find((s) => s.id === conflictsId);
	const [disconnecting, setDisconnecting] = useState<TSkillSource | null>(null);
	const qc = useQueryClient();

	// Scheduled syncs may finish between polls; compare their completed state too.
	const sourceRevision = JSON.stringify(
		(sources ?? []).map((source) => [
			source.id,
			source.status,
			source.last_commit_sha,
			source.last_synced_at,
			source.two_way,
		]),
	);
	const previousRevision = useRef(sourceRevision);
	useEffect(() => {
		if (sourceRevision !== previousRevision.current) {
			qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) });
		}
		previousRevision.current = sourceRevision;
	}, [sourceRevision, qc, ws]);

	if (!sources?.length) return null;

	return (
		<div className='mb-8 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900'>
			<div className='mb-3 flex items-center gap-1.5'>
				<FolderGit2 size={14} className='text-primary-500' />
				<h2 className='text-xs font-black text-zinc-700 dark:text-zinc-300'>
					GitHub repositories
				</h2>
			</div>
			<div className='space-y-2'>
				{sources.map((source) => (
					<SourceRow
						key={source.id}
						source={source}
						isSyncRequested={
							syncMutation.isPending && syncMutation.variables === source.id
						}
						onSync={() =>
							syncMutation.mutate(source.id, {
								onSuccess: () => notify.success(`Syncing ${source.repo}…`),
							})
						}
						onDisconnect={() => setDisconnecting(source)}
						onSettings={() => setSettingsId(source.id)}
						onConflicts={() => setConflictsId(source.id)}
						onFork={() => setForkId(source.id)}
						onUpstream={() => setUpstreamId(source.id)}
					/>
				))}
			</div>

			{settingsSource && (
				<SkillSyncSettingsDialog
					key={settingsSource.id}
					ws={ws}
					source={settingsSource}
					onClose={() => setSettingsId(null)}
				/>
			)}
			{conflictSource && (
				<SkillConflictsDialog
					key={conflictSource.id}
					ws={ws}
					source={conflictSource}
					onClose={() => setConflictsId(null)}
				/>
			)}
			{forkSource && (
				<ForkSkillSourceDialog
					key={forkSource.id}
					ws={ws}
					source={forkSource}
					onClose={() => setForkId(null)}
				/>
			)}
			{upstreamSource && (
				<SkillUpstreamDialog
					key={upstreamSource.id}
					ws={ws}
					source={upstreamSource}
					onClose={() => setUpstreamId(null)}
				/>
			)}
			<DisconnectDialog
				ws={ws}
				source={disconnecting}
				onClose={() => setDisconnecting(null)}
			/>
		</div>
	);
};

const STATUS_STYLES: Record<TSkillSource['status'], string> = {
	forking:
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400',
	cannot_publish:
		'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-400',
	conflict:
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400',
	pending:
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400',
	syncing:
		'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400',
	ready: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-400',
	failed: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-400',
};

const STATUS_LABELS: Record<TSkillSource['status'], string> = {
	forking: 'Preparing fork',
	cannot_publish: 'Cannot publish',
	conflict: 'Needs review',
	pending: 'Queued',
	syncing: 'Syncing',
	ready: 'Synced',
	failed: 'Sync failed',
};

const SourceRow = ({
	source,
	isSyncRequested,
	onSync,
	onDisconnect,
	onSettings,
	onConflicts,
	onFork,
	onUpstream,
}: {
	source: TSkillSource;
	isSyncRequested: boolean;
	onSync: () => void;
	onDisconnect: () => void;
	onSettings: () => void;
	onConflicts: () => void;
	onFork: () => void;
	onUpstream: () => void;
}) => {
	const isSyncing = isSkillSourceSyncing(source) || isSyncRequested;
	const syncedAgo = relativeTime(source.last_synced_at);

	return (
		<div className='rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='min-w-0'>
					<a
						href={source.url}
						target='_blank'
						rel='noreferrer'
						className='hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1 text-xs font-bold text-zinc-800 dark:text-zinc-200'>
						{source.repo}
						{source.path ? <span className='text-zinc-400'>/{source.path}</span> : null}
						<ExternalLink size={11} className='shrink-0 text-zinc-400' />
					</a>
					<p className='mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
						<span className='inline-flex items-center gap-1'>
							<GitBranch size={11} />
							{source.branch ?? 'default branch'}
						</span>
						<span>
							{source.skills_count} skill{source.skills_count === 1 ? '' : 's'}
						</span>
						{syncedAgo && <span>checked {syncedAgo}</span>}
						{source.last_commit_sha && (
							<span className='font-mono'>{source.last_commit_sha.slice(0, 7)}</span>
						)}
						<span>{source.account ?? 'public access'}</span>
						<span>{source.two_way ? 'Two-way sync' : 'GitHub → app'}</span>
					</p>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<span
						className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[source.status]}`}>
						{isSkillSourceSyncing(source) && (
							<Loader2 size={10} className='animate-spin' />
						)}
						{source.status === 'ready' && source.pending_changes?.length
							? 'Changes waiting'
							: STATUS_LABELS[source.status]}
					</span>
					<button
						type='button'
						onClick={onSettings}
						disabled={isSyncing}
						aria-label={`Sync settings for ${source.repo}`}
						title='Sync settings'
						className='rounded-lg border border-zinc-200 p-1.5 text-zinc-500 disabled:opacity-50 dark:border-zinc-800'>
						<Settings2 size={12} />
					</button>
					<button
						type='button'
						onClick={onSync}
						disabled={isSyncing}
						title='Sync now'
						aria-label={`Sync ${source.repo} now`}
						className='hover:text-primary-600 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'>
						<RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
					</button>
					<button
						type='button'
						onClick={onDisconnect}
						disabled={isSyncing}
						title='Disconnect'
						aria-label={`Disconnect ${source.repo}`}
						className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-white hover:text-rose-500 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'>
						<Unplug size={12} />
					</button>
				</div>
			</div>
			{(source.status === 'failed' ||
				source.status === 'conflict' ||
				source.status === 'cannot_publish') &&
				source.last_error && (
					<p className='mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-rose-500'>
						<AlertCircle size={12} className='mt-px shrink-0' />
						{source.last_error}
					</p>
				)}
			{!!source.pending_changes?.length && (
				<p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>
					{source.pending_changes.length} local skill change
					{source.pending_changes.length === 1 ? '' : 's'} waiting to publish. Your edits
					are saved.
				</p>
			)}
			{source.publish_once && (
				<p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>
					Publishing once. This skill becomes independent after publishing succeeds.
				</p>
			)}
			<div className='mt-2 flex flex-wrap gap-2'>
				{!source.two_way && (
					<button
						type='button'
						onClick={onFork}
						disabled={isSyncing && !source.fork_request}
						className='rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50 dark:border-zinc-700'>
						{source.fork_request ? 'Continue fork setup' : 'Fork and customize'}
					</button>
				)}
				{source.upstream_repo && (
					<button
						type='button'
						onClick={onUpstream}
						disabled={isSyncing}
						className='rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50 dark:border-zinc-700'>
						Review original updates
					</button>
				)}
			</div>
			{(source.conflicts?.length ?? 0) > 0 && (
				<button
					type='button'
					onClick={onConflicts}
					disabled={isSyncing}
					className='mt-2 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50 dark:border-amber-600 dark:text-amber-400'>
					Review {source.conflicts.length} conflict
					{source.conflicts.length === 1 ? '' : 's'}
				</button>
			)}
		</div>
	);
};

/** Disconnecting asks what happens to the repository's skills. */
const DisconnectDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	source: TSkillSource | null;
	onClose: () => void;
}) => {
	const disconnectMutation = useDisconnectSkillSource(ws);

	const disconnect = (keepSkills: boolean) => {
		if (!source) return;
		disconnectMutation.mutate(
			{ id: source.id, keepSkills },
			{
				onSuccess: () => {
					notify.success(
						keepSkills
							? `Disconnected ${source.repo}. Its skills are now editable here.`
							: `Disconnected ${source.repo} and removed its skills.`,
					);
					onClose();
				},
			},
		);
	};

	return (
		<Modal isOpen={!!source} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex flex-col'>
					<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Disconnect repository
					</span>
					<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
						Stop syncing {source?.repo}. What should happen to its{' '}
						{source?.skills_count} skill
						{source?.skills_count === 1 ? '' : 's'}?
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-2 pt-2 pb-1'>
					<button
						type='button'
						disabled={disconnectMutation.isPending}
						onClick={() => disconnect(true)}
						className='hover:border-primary-500/40 hover:bg-primary-400/5 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900'>
						<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
							Keep the skills
						</p>
						<p className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
							They stay attached to agents and become editable here.
						</p>
					</button>
					<button
						type='button'
						disabled={disconnectMutation.isPending}
						onClick={() => disconnect(false)}
						className='w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left hover:border-rose-500/40 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-rose-950/20'>
						<p className='text-xs font-bold text-rose-500'>Remove the skills</p>
						<p className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
							They're removed from the workspace and from any agent using them.
						</p>
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default SkillSourcesPanel;
