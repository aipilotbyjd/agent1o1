import { FC, useState } from 'react';
import { useAgentVersions, useAgentVersion, useRestoreAgentVersion } from '@/api/modules/agents';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import JsonViewer from '@/components/common/JsonViewer';
import { formatDateTime, formatRelative } from '@/utils/format.util';
import type { TAgentVersion } from '@/types/agent.type';

// ============================================================
// Versions Panel
// ------------------------------------------------------------
// Every saved change to the agent, newest first, with the full
// snapshot behind each one.
//
// Restore is behind a confirmation because it overwrites the live
// agent — and it is itself recorded as a new version, so restoring
// is additive rather than destroying the history you restored past.
// ============================================================

interface IVersionsPanelProps {
	ws: string;
	agentId: string;
}

const VersionsPanelPart: FC<IVersionsPanelProps> = ({ ws, agentId }) => {
	const { data: versions, isLoading } = useAgentVersions(ws, agentId);
	const restoreVersion = useRestoreAgentVersion(ws, agentId);

	const [selected, setSelected] = useState<number | null>(null);
	const [pendingRestore, setPendingRestore] = useState<TAgentVersion | null>(null);

	const { data: version, isLoading: isVersionLoading } = useAgentVersion(
		ws,
		agentId,
		selected ?? 0,
	);

	return (
		<>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12 xl:col-span-5'>
					<Card className='h-full'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>History</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='flex max-h-[70vh] flex-col gap-2 overflow-y-auto'>
							{isLoading && (
								<>
									<Skeleton className='h-14 w-full' />
									<Skeleton className='h-14 w-full' />
								</>
							)}

							{!isLoading && !versions?.length && (
								<EmptyState
									icon='Clock03'
									title='No versions yet'
									description='Saving a change to this agent records a version here.'
								/>
							)}

							{versions?.map((item, index) => (
								<div
									key={item.id}
									className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
										selected === item.version
											? 'bg-zinc-500/15'
											: 'hover:bg-zinc-500/5'
									}`}>
									<button
										type='button'
										className='min-w-0 grow cursor-pointer text-start'
										onClick={() => setSelected(item.version)}>
										<div className='flex items-center gap-2'>
											<span className='font-medium'>v{item.version}</span>
											{index === 0 && (
												<Badge
													color='emerald'
													variant='soft'
													rounded='rounded-full'>
													Current
												</Badge>
											)}
										</div>
										<div className='text-xs text-zinc-500'>
											{formatRelative(item.created_at)} ·{' '}
											{formatDateTime(item.created_at)}
										</div>
									</button>

									{index !== 0 && (
										<Button
											variant='outline'
											color='zinc'
											dimension='sm'
											onClick={() => setPendingRestore(item)}>
											Restore
										</Button>
									)}
								</div>
							))}
						</CardBody>
					</Card>
				</div>

				<div className='col-span-12 xl:col-span-7'>
					<Card className='h-full'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>
									{selected ? `Snapshot — v${selected}` : 'Snapshot'}
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							{!selected && (
								<EmptyState
									icon='Cursor01'
									title='Select a version'
									description='Pick one on the left to see exactly what the agent looked like.'
								/>
							)}
							{!!selected && isVersionLoading && <Skeleton className='h-64 w-full' />}
							{!!selected && !isVersionLoading && (
								<JsonViewer value={version?.snapshot} maxHeight='max-h-[60vh]' />
							)}
						</CardBody>
					</Card>
				</div>
			</div>

			<ConfirmDialog
				isOpen={!!pendingRestore}
				onClose={() => setPendingRestore(null)}
				title={`Restore v${pendingRestore?.version}?`}
				description='The agent is overwritten with this snapshot. The restore is itself recorded as a new version, so nothing in the history is lost.'
				confirmLabel='Restore'
				confirmColor='primary'
				isPending={restoreVersion.isPending}
				onConfirm={() => {
					if (!pendingRestore) return;
					restoreVersion.mutate(pendingRestore.version, {
						onSuccess: () => setPendingRestore(null),
					});
				}}
			/>
		</>
	);
};

export default VersionsPanelPart;
