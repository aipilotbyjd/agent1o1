import { useState } from 'react';
import { AlertTriangle, ArrowRight, Trash2, X as CloseIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConnectorCredentialUsage } from '@/api/modules/connectors';
import type { TConnectorCredential } from '@/types/connector.type';
import type { IConnectedApp } from '../_types/apps.type';
import { describeUsage } from '../_helper/credentialHealth.helper';

/**
 * Mirrors `ConnectorCredentialReassigner::ensureCompatible()`: another usable
 * account for the same app, and a shared account only hands over to another
 * shared one.
 */
const replacementCandidates = (app: IConnectedApp, credential: TConnectorCredential) =>
	app.credentials.filter(
		(candidate) =>
			candidate.id !== credential.id &&
			!candidate.is_expired &&
			(credential.scope === 'personal' || candidate.scope === 'team'),
	);

interface IDisconnectDialogProps {
	workspaceId: string;
	app: IConnectedApp;
	credential: TConnectorCredential;
	isDeleting: boolean;
	onCancel: () => void;
	onConfirm: (replaceWith?: string) => void;
}

const DisconnectDialog = ({
	workspaceId,
	app,
	credential,
	isDeleting,
	onCancel,
	onConfirm,
}: IDisconnectDialogProps) => {
	const { data: usage, isLoading } = useConnectorCredentialUsage(workspaceId, credential.id);
	const candidates = replacementCandidates(app, credential);
	const [replaceWith, setReplaceWith] = useState<string>(
		() => (candidates.find((candidate) => candidate.is_default) ?? candidates[0])?.id ?? '',
	);
	const isUsed = Boolean(usage && usage.total > 0);
	const canMove = isUsed && candidates.length > 0;

	return (
		<div
			role='presentation'
			onClick={(event) => {
				if (event.target === event.currentTarget && !isDeleting) onCancel();
			}}
			className='fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 font-sans backdrop-blur-xs dark:bg-black/70'>
			<motion.div
				role='alertdialog'
				aria-modal='true'
				aria-labelledby='disconnect-dialog-title'
				initial={{ opacity: 0, scale: 0.96, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 10 }}
				className='relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<button
					aria-label='Cancel'
					disabled={isDeleting}
					onClick={onCancel}
					className='absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='flex items-center gap-3 pr-8'>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'>
						<Trash2 className='h-4.5 w-4.5' />
					</div>
					<div className='min-w-0'>
						<h2
							id='disconnect-dialog-title'
							className='truncate text-base font-black text-slate-900 dark:text-white'>
							Disconnect {credential.name}?
						</h2>
						{credential.account_label && (
							<p className='truncate text-[11px] font-semibold text-slate-500 dark:text-zinc-400'>
								{credential.account_label}
							</p>
						)}
					</div>
				</div>

				<div className='mt-5 text-xs font-semibold text-slate-600 dark:text-zinc-300'>
					{isLoading ? (
						<div className='h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-zinc-800' />
					) : !isUsed ? (
						<p>Nothing uses this account right now. This can&apos;t be undone.</p>
					) : canMove ? (
						<>
							<p>
								It&apos;s used by {describeUsage(usage!)}. Move them to another{' '}
								{app.name} account so they keep working:
							</p>
							<div className='mt-3 space-y-2'>
								{candidates.map((candidate) => (
									<label
										key={candidate.id}
										className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${replaceWith === candidate.id ? 'border-primary-500/60 bg-primary-50/50 dark:bg-primary-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900'}`}>
										<input
											type='radio'
											name='replace-with'
											value={candidate.id}
											aria-label={`Move to ${candidate.name}`}
											checked={replaceWith === candidate.id}
											onChange={() => setReplaceWith(candidate.id)}
											className='accent-primary-500 h-4 w-4'
										/>
										<span className='min-w-0'>
											<span className='block truncate font-extrabold text-slate-900 dark:text-white'>
												{candidate.name}
												{candidate.is_default && (
													<span className='text-primary-700 dark:text-primary-400 ml-1.5 text-[10px] font-bold'>
														Default
													</span>
												)}
											</span>
											<span className='block truncate text-[10px] text-slate-400 dark:text-zinc-500'>
												{candidate.account_label ??
													(candidate.scope === 'team'
														? 'Shared with workspace'
														: 'Private')}
											</span>
										</span>
									</label>
								))}
								<label
									className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${replaceWith === '' ? 'border-red-300 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900'}`}>
									<input
										type='radio'
										name='replace-with'
										value=''
										aria-label="Don't move them"
										checked={replaceWith === ''}
										onChange={() => setReplaceWith('')}
										className='h-4 w-4 accent-red-500'
									/>
									<span className='font-bold text-slate-700 dark:text-zinc-300'>
										Don&apos;t move them. They&apos;ll stop working.
									</span>
								</label>
							</div>
						</>
					) : (
						<div className='flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'>
							<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
							<p>
								It&apos;s used by {describeUsage(usage!)}, and there&apos;s no other{' '}
								{credential.scope === 'team' ? 'shared ' : ''}
								{app.name} account to move them to. They&apos;ll stop working until
								you connect one.
							</p>
						</div>
					)}
				</div>

				<div className='mt-6 flex items-center justify-end gap-2'>
					<button
						type='button'
						disabled={isDeleting}
						onClick={onCancel}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 px-5 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Cancel
					</button>
					<button
						type='button'
						disabled={isDeleting || isLoading}
						onClick={() => onConfirm(canMove && replaceWith ? replaceWith : undefined)}
						className='flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 px-5 text-[11px] font-black text-white shadow-sm transition-all hover:bg-red-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50'>
						{isDeleting ? (
							'Disconnecting...'
						) : canMove && replaceWith ? (
							<>
								Move &amp; disconnect <ArrowRight className='h-3.5 w-3.5' />
							</>
						) : (
							'Disconnect'
						)}
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default DisconnectDialog;
