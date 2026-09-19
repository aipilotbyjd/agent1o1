import { useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, RotateCcw, Loader2, User } from 'lucide-react';
import { useAgentVersions, useRestoreAgentVersion } from '@/api/modules/agents';
import type { TAgentVersion } from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
};

/** Snapshot fields worth surfacing as a labelled row; anything else lands in the raw JSON. */
const SNAPSHOT_FIELDS: { key: string; label: string }[] = [
	{ key: 'name', label: 'Name' },
	{ key: 'model', label: 'Model' },
	{ key: 'provider', label: 'Provider' },
	{ key: 'temperature', label: 'Temperature' },
	{ key: 'description', label: 'Description' },
	{ key: 'instructions', label: 'Instructions' },
];

const fmtValue = (value: unknown) => {
	if (value == null || value === '') return '—';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
};

/** Expandable row: version summary + snapshot detail and restore. */
const VersionRow = ({
	ws,
	agentId,
	version,
	isCurrent,
}: {
	ws: string;
	agentId: string;
	version: TAgentVersion;
	isCurrent: boolean;
}) => {
	const [open, setOpen] = useState(false);
	const restoreMutation = useRestoreAgentVersion(ws, agentId);
	const snapshot = version.snapshot ?? {};
	const rows = SNAPSHOT_FIELDS.filter(({ key }) => key in snapshot);

	return (
		<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<button
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center gap-3 p-3 text-left'>
				{open ? (
					<ChevronDown size={13} className='shrink-0 text-zinc-400' />
				) : (
					<ChevronRight size={13} className='shrink-0 text-zinc-400' />
				)}
				<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
					<GitBranch size={13} />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<span className='truncate text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
							v{version.version}
						</span>
						{isCurrent && (
							<span className='shrink-0 rounded-full bg-primary-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-primary-600 dark:text-primary-400'>
								Current
							</span>
						)}
					</div>
					<span className='block text-[9px] font-semibold text-zinc-400 dark:text-zinc-600'>
						{new Date(version.created_at).toLocaleString()}
					</span>
				</div>
				{version.changed_by && (
					<div className='flex shrink-0 items-center gap-1 text-[9px] font-bold text-zinc-400'>
						<User size={9} />
						<span className='max-w-20 truncate'>{version.changed_by}</span>
					</div>
				)}
			</button>

			{open && (
				<div className='space-y-2 border-t border-zinc-100 p-3 dark:border-zinc-800'>
					{rows.length === 0 ? (
						<p className='text-[10px] font-semibold text-zinc-400'>No snapshot recorded.</p>
					) : (
						rows.map(({ key, label }) => (
							<div key={key} className='rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
								<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>
									{label}
								</span>
								<p className='mt-0.5 line-clamp-3 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300'>
									{fmtValue(snapshot[key])}
								</p>
							</div>
						))
					)}

					{!isCurrent && (
						<div className='flex justify-end'>
							<button
								onClick={() => restoreMutation.mutate(version.version)}
								disabled={restoreMutation.isPending}
								className='flex items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
								{restoreMutation.isPending ? (
									<Loader2 size={10} className='animate-spin' />
								) : (
									<RotateCcw size={10} />
								)}
								<span>Restore</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

/**
 * Version history for an agent — every saved change, with a snapshot and restore.
 * Restoring rolls forward: it creates a new version rather than dropping the
 * ones in between. Backed by {agent}/versions — see AgentVersionController.
 */
const AgentVersionsPanel = ({ ws, agentId }: TProps) => {
	const { data, isLoading } = useAgentVersions(ws, agentId ?? '');

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to see version history.
			</p>
		);
	}

	const versions = data ?? [];
	// The backend has no "is current" flag; the highest version number is live.
	const currentVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);

	return (
		<div className='space-y-3'>
			<div>
				<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Versions</h4>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					Every saved change, restorable.
				</p>
			</div>

			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : versions.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No versions recorded yet.
				</p>
			) : (
				<div className='space-y-2'>
					{versions.map((version) => (
						<VersionRow
							key={version.id}
							ws={ws}
							agentId={agentId}
							version={version}
							isCurrent={version.version === currentVersion}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default AgentVersionsPanel;
