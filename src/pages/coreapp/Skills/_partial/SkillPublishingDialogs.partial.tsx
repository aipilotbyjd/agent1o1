import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { ApiError, notify } from '@/api/core';
import { useKnowledgeSourceApps, useKnowledgeSourceOptions } from '@/api/modules/knowledge-base';
import {
	agentSkillKeys,
	isSkillSourceSyncing,
	usePublishAgentSkill,
	useRepositoryAccess,
	useForkSkillSource,
	useForkProgress,
	useCancelSkillFork,
	useSkillUpstream,
	useApplySkillUpstream,
	useSyncSkillSource,
} from '@/api/modules/agent-skills';
import type { TAgentSkill, TSkillSource } from '@/types/agent-skill.type';
import { isValidSkillExportPath } from '../_helper/skill-sync.helpers';

export const syncInputClass =
	'w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
export const syncButtonClass =
	'rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-bold text-primary-950 disabled:cursor-not-allowed disabled:opacity-50';
const errorText = (error: unknown) =>
	ApiError.is(error) ? error.message : 'Could not finish this operation. Please retry.';

export const PublishSkillDialog = ({
	ws,
	skill,
	onClose,
}: {
	ws: string;
	skill: TAgentSkill;
	onClose: () => void;
}) => {
	const { data: apps, isError: accountsError } = useKnowledgeSourceApps(ws, true);
	const accounts = apps?.find((app) => app.type === 'github')?.accounts ?? [];
	const [credential, setCredential] = useState('');
	const credentialId = credential || accounts[0]?.id || '';
	const [repo, setRepo] = useState('');
	const [branch, setBranch] = useState('');
	const [path, setPath] = useState(skill.slug);
	const [keepSynced, setKeepSynced] = useState(false);
	const { data: repositories, isError: repositoriesError } = useKnowledgeSourceOptions(
		ws,
		credentialId ? 'github' : null,
		credentialId || undefined,
		'',
	);
	const check = useRepositoryAccess(ws);
	const publish = usePublishAgentSkill(ws);
	const verified =
		check.data &&
		check.variables?.repo === repo.trim() &&
		(check.variables.branch ?? '') === branch.trim() &&
		check.variables.credential_id === credentialId
			? check.data
			: null;
	const close = () => {
		if (!publish.isPending) onClose();
	};
	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && close()}>Publish to GitHub</ModalHeader>
			<ModalBody>
				<form
					className='flex flex-col gap-4'
					onSubmit={(e) => {
						e.preventDefault();
						if (
							!verified?.can_push ||
							!isValidSkillExportPath(path.trim()) ||
							publish.isPending
						)
							return;
						publish.mutate(
							{
								id: skill.id,
								body: {
									repo: verified.repo,
									branch: verified.branch,
									credential_id: credentialId,
									path: path.trim(),
									keep_synced: keepSynced,
								},
							},
							{
								onSuccess: () => {
									notify.success(
										'Publishing started. Your skill stays saved while GitHub is updated.',
									);
									onClose();
								},
							},
						);
					}}>
					<p className='text-sm font-semibold'>{skill.name}</p>
					<label className='flex flex-col gap-1.5 text-sm'>
						GitHub account
						<select
							className={syncInputClass}
							value={credentialId}
							onChange={(e) => setCredential(e.target.value)}
							disabled={publish.isPending}>
							<option value=''>Select an account</option>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
								</option>
							))}
						</select>
					</label>
					{!accounts.length && (
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							Connect GitHub in Apps to publish skills to your repository.
						</p>
					)}
					{(accountsError || repositoriesError) && (
						<p role='alert' className='text-xs text-rose-500'>
							Could not load GitHub accounts or repositories. Close this dialog and
							retry.
						</p>
					)}
					<label className='flex flex-col gap-1.5 text-sm'>
						Repository
						<input
							className={syncInputClass}
							list='publish-skill-repositories'
							placeholder='your-account/skills or a GitHub link'
							value={repo}
							onChange={(e) => setRepo(e.target.value)}
							disabled={publish.isPending}
							required
						/>
						<datalist id='publish-skill-repositories'>
							{(repositories ?? []).map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</datalist>
					</label>
					<label className='flex flex-col gap-1.5 text-sm'>
						Branch
						<input
							className={syncInputClass}
							placeholder='Repository default branch'
							value={branch}
							onChange={(e) => setBranch(e.target.value)}
							disabled={publish.isPending}
						/>
					</label>
					<button
						type='button'
						className='rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-zinc-700'
						disabled={
							!repo.trim() || !credentialId || check.isPending || publish.isPending
						}
						onClick={() =>
							check.mutate({
								repo: repo.trim(),
								branch: branch.trim() || undefined,
								credential_id: credentialId,
							})
						}>
						{check.isPending ? 'Checking destination…' : 'Check publishing destination'}
					</button>
					{verified && (
						<div
							role='status'
							className='rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700'>
							<p className='font-semibold'>
								{verified.repo} · {verified.branch} ·{' '}
								{verified.private ? 'Private repository' : 'Public repository'}
							</p>
							<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
								{verified.can_push ? 'You can publish here.' : verified.reason}
							</p>
						</div>
					)}
					<label className='flex flex-col gap-1.5 text-sm'>
						Skill folder
						<input
							className={syncInputClass}
							value={path}
							onChange={(e) => setPath(e.target.value)}
							placeholder='skills/my-skill'
							maxLength={200}
							disabled={publish.isPending}
							required
						/>
					</label>
					{path && !isValidSkillExportPath(path.trim()) && (
						<p role='alert' className='text-xs text-rose-500'>
							Use a relative folder without leading slashes or dot segments.
						</p>
					)}
					<p className='text-xs break-all text-zinc-500 dark:text-zinc-400'>
						Instructions, references and scripts will be published to {path.trim()}
						/SKILL.md{verified ? ` in ${verified.repo}` : ''}.
						{verified && !verified.private
							? ' Anyone can read content published to this repository.'
							: ''}
					</p>
					<label className='flex items-start gap-2 text-sm'>
						<input
							type='checkbox'
							checked={keepSynced}
							onChange={(e) => setKeepSynced(e.target.checked)}
							disabled={publish.isPending}
						/>
						<span>
							Keep this skill synced with GitHub
							<span className='mt-1 block text-xs text-zinc-500 dark:text-zinc-400'>
								App edits and deletions will publish automatically; repository edits
								will import. Conflicts pause syncing for review.
							</span>
						</span>
					</label>
					<button
						type='submit'
						className={syncButtonClass}
						disabled={
							!verified?.can_push ||
							!isValidSkillExportPath(path.trim()) ||
							publish.isPending
						}>
						{publish.isPending
							? 'Publishing…'
							: keepSynced
								? 'Publish and keep synced'
								: 'Publish once'}
					</button>
				</form>
			</ModalBody>
		</Modal>
	);
};

export const ForkSkillSourceDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	source: TSkillSource;
	onClose: () => void;
}) => {
	const { data: apps } = useKnowledgeSourceApps(ws, true);
	const accounts = apps?.find((app) => app.type === 'github')?.accounts ?? [];
	const [credential, setCredential] = useState('');
	const credentialId = credential || accounts[0]?.id || '';
	const [existingFork, setExistingFork] = useState('');
	const begin = useForkSkillSource(ws);
	const cancel = useCancelSkillFork(ws);
	const progress = useForkProgress(ws, source.id, !!source.fork_request);
	const sync = useSyncSkillSource(ws);
	const qc = useQueryClient();
	const completed = useRef(false);
	const closeRef = useRef(onClose);
	useLayoutEffect(() => {
		closeRef.current = onClose;
	});
	useEffect(() => {
		if (source.two_way && !source.fork_request && !completed.current) {
			completed.current = true;
			sync.mutate(source.id);
			notify.success(
				`Connected ${source.repo}. Your skills and agent attachments are preserved.`,
			);
			closeRef.current();
			return;
		}
		if (
			progress.isFetching ||
			!source.fork_request ||
			!progress.data ||
			progress.data.fork_request ||
			completed.current
		)
			return;
		completed.current = true;
		qc.invalidateQueries({ queryKey: agentSkillKeys.all(ws) });
		sync.mutate(source.id);
		notify.success(
			`Connected ${progress.data.repo}. Your skills and agent attachments are preserved.`,
		);
		closeRef.current();
	}, [
		source.fork_request,
		source.two_way,
		source.repo,
		progress.data,
		progress.isFetching,
		qc,
		ws,
		source.id,
		sync,
	]);
	const busy = begin.isPending || cancel.isPending;
	const close = () => {
		if (!busy) onClose();
	};
	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && close()}>Fork and customize</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Create your own fork of {source.repo}, then sync your changes there. The
						original repository is untouched. Existing skill IDs and agent attachments
						are kept.
					</p>
					{source.fork_request ? (
						<>
							<p role='status' className='text-sm font-semibold break-all'>
								Preparing {source.fork_request.repo}… Your original connection stays
								active until the fork is ready.
							</p>
							{progress.isError && (
								<p role='alert' className='text-xs text-rose-500'>
									{errorText(progress.error)}
								</p>
							)}
							<button
								type='button'
								className={syncButtonClass}
								onClick={() => progress.refetch()}
								disabled={progress.isFetching || busy}>
								{progress.isFetching
									? 'Checking fork…'
									: 'Check / retry fork setup'}
							</button>
							<button
								type='button'
								className='text-sm font-semibold text-zinc-500'
								onClick={() =>
									cancel.mutate(source.id, {
										onSuccess: () => {
											notify.success(
												'Original connection kept. Any fork already created stays on GitHub.',
											);
											onClose();
										},
									})
								}
								disabled={busy || progress.isFetching}>
								Cancel connection and keep original
							</button>
						</>
					) : (
						<>
							<label className='flex flex-col gap-1.5 text-sm'>
								GitHub account
								<select
									className={syncInputClass}
									value={credentialId}
									onChange={(e) => setCredential(e.target.value)}
									disabled={busy}>
									<option value=''>Select an account</option>
									{accounts.map((account) => (
										<option key={account.id} value={account.id}>
											{account.name}
										</option>
									))}
								</select>
							</label>
							{!accounts.length && (
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>
									Connect GitHub in Apps to create or connect a fork.
								</p>
							)}
							<label className='flex flex-col gap-1.5 text-sm'>
								Existing fork (optional)
								<input
									className={syncInputClass}
									value={existingFork}
									onChange={(e) => setExistingFork(e.target.value)}
									placeholder='your-account/skills'
									disabled={busy}
								/>
							</label>
							<p className='text-xs text-zinc-500 dark:text-zinc-400'>
								Leave this empty to create a fork under the selected account. This
								copies the entire repository and uses the same branch and skill
								folder.
							</p>
							<button
								type='button'
								className={syncButtonClass}
								disabled={!credentialId || busy || isSkillSourceSyncing(source)}
								onClick={() =>
									begin.mutate({
										id: source.id,
										body: {
											credential_id: credentialId,
											...(existingFork.trim()
												? { fork_repo: existingFork.trim() }
												: {}),
										},
									})
								}>
								{begin.isPending
									? 'Preparing fork…'
									: existingFork.trim()
										? 'Connect my fork'
										: 'Create my fork'}
							</button>
						</>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

export const SkillUpstreamDialog = ({
	ws,
	source,
	onClose,
}: {
	ws: string;
	source: TSkillSource;
	onClose: () => void;
}) => {
	const check = useSkillUpstream(ws);
	const apply = useApplySkillUpstream(ws);
	const sync = useSyncSkillSource(ws);
	const requested = useRef(false);
	useEffect(() => {
		if (!requested.current) {
			requested.current = true;
			check.mutate(source.id);
		}
	}, [source.id, check]);
	const preview = check.data;
	const close = () => {
		if (!apply.isPending) onClose();
	};
	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && close()}>
				Updates from the original repository
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Review updates from {source.upstream_repo} before merging them into{' '}
						{source.repo}. This updates the entire fork branch, including files outside
						your skill folder.
					</p>
					{check.isPending && <p role='status'>Checking for updates…</p>}
					{preview && (
						<>
							<p className='text-sm font-semibold'>
								{preview.commits_ahead
									? `${preview.commits_ahead} upstream commit${preview.commits_ahead === 1 ? '' : 's'} available`
									: 'Your fork already includes the original updates.'}
							</p>
							<div className='max-h-96 space-y-2 overflow-auto'>
								{preview.files.map((file) => (
									<details
										key={file.path}
										className='rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
										<summary className='cursor-pointer text-xs font-semibold break-all'>
											{file.status}: {file.path}
										</summary>
										<pre className='mt-2 overflow-auto text-xs break-words whitespace-pre-wrap'>
											{file.patch ??
												'No text preview available. Review this file on GitHub.'}
										</pre>
									</details>
								))}
							</div>
							{preview.files_truncated && (
								<p className='text-xs text-amber-600'>
									GitHub returned a limited file list. Review the complete
									comparison before merging.
								</p>
							)}
							<a
								className='text-primary-600 dark:text-primary-400 text-sm font-semibold'
								href={`https://github.com/${source.repo}/compare/${preview.fork_sha}...${preview.upstream_sha}`}
								target='_blank'
								rel='noreferrer'>
								Open full comparison in GitHub
							</a>
							{!!source.pending_changes?.length && (
								<p className='text-xs text-amber-600'>
									Sync your local edits before applying original updates.
								</p>
							)}
							<button
								type='button'
								className={syncButtonClass}
								disabled={
									!preview.commits_ahead ||
									apply.isPending ||
									isSkillSourceSyncing(source) ||
									!!source.pending_changes?.length ||
									!!source.conflicts?.length
								}
								onClick={() =>
									apply.mutate(
										{
											id: source.id,
											body: {
												fork_sha: preview.fork_sha,
												upstream_sha: preview.upstream_sha,
											},
										},
										{
											onSuccess: () => {
												sync.mutate(source.id);
												notify.success(
													'Original updates merged. Importing into your workspace…',
												);
												onClose();
											},
										},
									)
								}>
								{apply.isPending ? 'Merging…' : 'Merge reviewed updates and sync'}
							</button>
						</>
					)}
					<button
						type='button'
						className='text-sm font-semibold text-zinc-500'
						disabled={check.isPending || apply.isPending}
						onClick={() => check.mutate(source.id)}>
						Check again
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};
