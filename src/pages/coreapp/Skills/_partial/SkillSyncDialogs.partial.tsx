import { useState } from 'react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { notify } from '@/api/core';
import { useKnowledgeSourceApps } from '@/api/modules/knowledge-base';
import {
	isSkillSourceSyncing,
	useUpdateSkillSource,
	useRepositoryAccess,
	useResolveSkillSource,
	useSyncSkillSource,
} from '@/api/modules/agent-skills';
import type { TSkillSource } from '@/types/agent-skill.type';
import {
	changedConflictFiles,
	conflictFingerprint,
	selectedConflictResolution,
	selectedConflictFiles,
} from '../_helper/skill-sync.helpers';
import type { TConflictChoice } from '../_helper/skill-sync.helpers';

const inputClass =
	'w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const buttonClass =
	'rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-bold text-primary-950 disabled:cursor-not-allowed disabled:opacity-50';

export const SkillSyncSettingsDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	source: TSkillSource;
	onClose: () => void;
}) => {
	const [twoWay, setTwoWay] = useState(source.two_way);
	const [credentialId, setCredentialId] = useState(source.credential_id ?? '');
	const [branch, setBranch] = useState(source.branch ?? '');
	const { data: apps, isLoading, isError } = useKnowledgeSourceApps(ws, true);
	const accounts = apps?.find((app) => app.type === 'github')?.accounts ?? [];
	const update = useUpdateSkillSource(ws);
	const check = useRepositoryAccess(ws);
	const verified =
		check.data &&
		check.variables?.repo === source.repo &&
		check.variables.credential_id === credentialId &&
		(check.variables.branch ?? '') === branch.trim()
			? check.data
			: null;
	const unchanged =
		source.two_way &&
		credentialId === source.credential_id &&
		branch.trim() === (source.branch ?? '');
	const canSave =
		!update.isPending &&
		!isSkillSourceSyncing(source) &&
		(!twoWay || (!!credentialId && (unchanged || verified?.can_push)));
	const close = () => {
		if (!update.isPending) onClose();
	};
	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && close()}>Sync settings</ModalHeader>
			<ModalBody>
				<form
					className='flex flex-col gap-4'
					onSubmit={(e) => {
						e.preventDefault();
						if (!canSave) return;
						update.mutate(
							{
								id: source.id,
								body: {
									two_way: twoWay,
									...((
										twoWay && verified?.can_push
											? verified.branch
											: branch.trim()
									)
										? {
												branch:
													twoWay && verified?.can_push
														? verified.branch
														: branch.trim(),
											}
										: {}),
									...(credentialId ? { credential_id: credentialId } : {}),
								},
							},
							{
								onSuccess: () => {
									notify.success('Sync settings saved.');
									onClose();
								},
							},
						);
					}}>
					<p className='text-sm font-semibold break-all'>{source.repo}</p>
					<p className='text-xs text-zinc-500 dark:text-zinc-400'>
						Imported skills receive updates from GitHub. To customize a public
						repository, make an editable copy or fork it. Two-way sync requires
						repository write access for the selected account and branch.
					</p>
					<label className='flex flex-col gap-1.5 text-sm'>
						GitHub account
						<select
							className={inputClass}
							value={credentialId}
							onChange={(e) => setCredentialId(e.target.value)}
							disabled={update.isPending || isLoading}>
							<option value=''>Select an account</option>
							{source.credential_id &&
								!accounts.some((a) => a.id === source.credential_id) && (
									<option value={source.credential_id}>
										{source.account ?? 'Current account'}
									</option>
								)}
							{accounts.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name}
								</option>
							))}
						</select>
					</label>
					<label className='flex flex-col gap-1.5 text-sm'>
						Branch
						<input
							aria-label='Repository default branch'
							className={inputClass}
							value={branch}
							onChange={(e) => setBranch(e.target.value)}
							placeholder='Repository default branch'
							disabled={update.isPending}
						/>
					</label>
					{isError && (
						<p role='alert' className='text-xs text-rose-500'>
							Could not load accounts. Close and retry.
						</p>
					)}
					<button
						type='button'
						className='rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-zinc-700'
						disabled={!credentialId || check.isPending || update.isPending}
						onClick={() =>
							check.mutate({
								repo: source.repo,
								branch: branch.trim() || undefined,
								credential_id: credentialId,
							})
						}>
						{check.isPending ? 'Checking…' : 'Check publishing access'}
					</button>
					{verified && (
						<p role='status' className='text-xs text-zinc-500 dark:text-zinc-400'>
							{verified.can_push
								? `Publishing available on ${verified.branch}. ${verified.private ? 'Private' : 'Public'} repository.`
								: verified.reason}
						</p>
					)}
					{(source.two_way || verified?.can_push) && (
						<label className='flex items-center gap-2 text-sm font-semibold'>
							<input
								type='checkbox'
								checked={twoWay}
								onChange={(e) => setTwoWay(e.target.checked)}
								disabled={update.isPending || (!twoWay && !verified?.can_push)}
							/>
							Enable two-way sync
						</label>
					)}
					{twoWay && (
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							Saved edits and deletions publish to GitHub. Changes on both sides pause
							for review.
						</p>
					)}
					<button type='submit' className={buttonClass} disabled={!canSave}>
						{update.isPending ? 'Saving…' : 'Save settings'}
					</button>
				</form>
			</ModalBody>
		</Modal>
	);
};

export const SkillConflictsDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	source: TSkillSource;
	onClose: () => void;
}) => {
	const [choices, setChoices] = useState<Record<string, TConflictChoice>>({});
	const [applying, setApplying] = useState(false);
	const resolve = useResolveSkillSource(ws);
	const sync = useSyncSkillSource(ws);
	const conflicts = source.conflicts ?? [];
	const ready =
		conflicts.length > 0 &&
		conflicts.every((c) => {
			const resolution = selectedConflictResolution(c, choices[c.path]);
			return (
				!!resolution &&
				(resolution !== 'merged' ||
					!!selectedConflictFiles(c, choices[c.path])?.['SKILL.md'])
			);
		});
	const close = () => {
		if (!applying) onClose();
	};
	const apply = async () => {
		if (!ready || applying) return;
		setApplying(true);
		try {
			for (const conflict of conflicts) {
				const resolution = selectedConflictResolution(conflict, choices[conflict.path]);
				if (resolution)
					await resolve.mutateAsync({
						id: source.id,
						body: {
							path: conflict.path,
							commit_sha: conflict.commit_sha,
							resolution,
							...(resolution === 'merged'
								? { files: selectedConflictFiles(conflict, choices[conflict.path]) }
								: {}),
						},
					});
			}
			const result = await sync.mutateAsync(source.id);
			if (
				result.status === 'conflict' ||
				result.status === 'failed' ||
				result.status === 'cannot_publish'
			) {
				notify.error(result.last_error ?? 'Sync needs another review.');
			} else {
				notify.success(
					result.status === 'ready'
						? 'Conflicts resolved and synced.'
						: 'Choices saved. Syncing repository…',
				);
				onClose();
			}
		} catch {
			/* Mutation errors are shown by the shared API handler. */
		} finally {
			setApplying(false);
		}
	};
	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && close()}>Resolve sync conflicts</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Both the app and GitHub changed these skills. Choose the complete version to
						keep for each skill, then sync.
					</p>
					{!conflicts.length && (
						<p role='status'>
							No conflicts remain. Close this dialog to check the repository status.
						</p>
					)}
					{conflicts.map((conflict) => (
						<section
							key={conflict.path}
							className='min-w-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
							<h3 className='mb-2 text-sm font-bold break-all'>
								{conflict.path || 'Repository root'}
							</h3>
							<div className='flex flex-wrap gap-2'>
								{(['local', 'remote', 'merged'] as const).map((side) => (
									<label
										key={side}
										className='flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700'>
										<input
											type='radio'
											name={`resolution-${conflict.path}`}
											checked={
												selectedConflictResolution(
													conflict,
													choices[conflict.path],
												) === side
											}
											disabled={applying}
											onChange={() =>
												setChoices((prev) => ({
													...prev,
													[conflict.path]: {
														fingerprint: conflictFingerprint(conflict),
														resolution: side,
														files:
															side === 'merged'
																? {
																		...(conflict.merged ??
																			conflict.local ??
																			conflict.remote ??
																			conflict.base ??
																			{}),
																	}
																: undefined,
													},
												}))
											}
										/>
										{side === 'merged'
											? 'Combine versions'
											: `Keep ${side === 'local' ? 'app' : 'GitHub'} version`}
										{side !== 'merged' && conflict[side] === null
											? ' (delete skill)'
											: ''}
									</label>
								))}
							</div>
							{selectedConflictResolution(conflict, choices[conflict.path]) ===
								'merged' && (
								<div className='mt-3 space-y-3'>
									<p className='text-xs text-zinc-500 dark:text-zinc-400'>
										Edit the combined files below. Uncheck a supporting file to
										delete it.
									</p>
									{[
										...new Set([
											...Object.keys(conflict.base ?? {}),
											...Object.keys(conflict.local ?? {}),
											...Object.keys(conflict.remote ?? {}),
											...Object.keys(
												selectedConflictFiles(
													conflict,
													choices[conflict.path],
												) ?? {},
											),
										]),
									]
										.sort()
										.map((file) => {
											const files =
												selectedConflictFiles(
													conflict,
													choices[conflict.path],
												) ?? {};
											const included = Object.prototype.hasOwnProperty.call(
												files,
												file,
											);
											return (
												<div key={file}>
													<label className='flex items-center gap-2 text-xs font-semibold break-all'>
														<input
															type='checkbox'
															checked={included}
															disabled={
																applying || file === 'SKILL.md'
															}
															onChange={(e) => {
																const merged = { ...files };
																if (e.target.checked)
																	merged[file] =
																		conflict.local?.[file] ??
																		conflict.remote?.[file] ??
																		conflict.base?.[file] ??
																		'';
																else delete merged[file];
																setChoices((prev) => ({
																	...prev,
																	[conflict.path]: {
																		fingerprint:
																			conflictFingerprint(
																				conflict,
																			),
																		resolution: 'merged',
																		files: merged,
																	},
																}));
															}}
														/>
														{file}
													</label>
													{included && (
														<textarea
															aria-label={`Combined ${file}`}
															className={`${inputClass} mt-1 min-h-32 font-mono text-xs`}
															value={files[file]}
															disabled={applying}
															onChange={(e) =>
																setChoices((prev) => ({
																	...prev,
																	[conflict.path]: {
																		fingerprint:
																			conflictFingerprint(
																				conflict,
																			),
																		resolution: 'merged',
																		files: {
																			...files,
																			[file]: e.target.value,
																		},
																	},
																}))
															}
														/>
													)}
												</div>
											);
										})}
								</div>
							)}
							{changedConflictFiles(conflict).map((file) => (
								<details
									key={file}
									className='mt-3 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-950'>
									<summary className='cursor-pointer text-xs font-semibold break-all'>
										{file}
									</summary>
									<div className='mt-2 grid min-w-0 gap-3 sm:grid-cols-2'>
										{(['local', 'remote'] as const).map((side) => (
											<div key={side} className='min-w-0'>
												<p className='mb-1 text-xs font-bold'>
													{side === 'local' ? 'App' : 'GitHub'}
												</p>
												<pre className='max-h-64 overflow-auto text-xs break-words whitespace-pre-wrap'>
													{conflict[side]?.[file] ??
														'(File deleted or absent)'}
												</pre>
											</div>
										))}
									</div>
									<details className='mt-2'>
										<summary className='cursor-pointer text-xs text-zinc-500'>
											Last synced version
										</summary>
										<pre className='max-h-48 overflow-auto text-xs break-words whitespace-pre-wrap'>
											{conflict.base?.[file] ?? '(File did not exist)'}
										</pre>
									</details>
								</details>
							))}
						</section>
					))}
					<button
						type='button'
						className={buttonClass}
						onClick={apply}
						disabled={!ready || applying || isSkillSourceSyncing(source)}>
						{applying ? 'Applying choices…' : 'Apply choices and sync'}
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};
