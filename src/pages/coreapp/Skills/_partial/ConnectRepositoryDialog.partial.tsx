import { useEffect, useState } from 'react';
import {
	ArrowLeft,
	ChevronDown,
	FolderGit2,
	GitBranch,
	Loader2,
	Lock,
	Globe,
	Puzzle,
	Search,
	SearchX,
} from 'lucide-react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { ApiError, notify } from '@/api/core';
import { useCreateSkillSource, usePreviewSkillSource } from '@/api/modules/agent-skills';
import { useKnowledgeSourceApps, useKnowledgeSourceOptions } from '@/api/modules/knowledge-base';
import type { TPreviewSkillSourceDto, TSkillSourcePreview } from '@/types/agent-skill.type';

interface IConnectRepositoryDialogProps {
	ws: string;
	isOpen: boolean;
	onClose: () => void;
}

/** No account: read anonymously, which only reaches public repositories. */
const PUBLIC_ONLY = '';
const SEARCH_DEBOUNCE_MS = 300;

/** Text that already names a repository: `owner/name` or a GitHub link. */
const looksLikeRepository = (text: string) =>
	/github\.com[/:]/i.test(text) || /^[\w.-]+\/[\w.-]+$/.test(text.trim());

const errorText = (error: unknown) =>
	ApiError.is(error)
		? (Object.values(error.fields ?? {})[0]?.[0] ?? error.message)
		: 'Could not read the repository. Try again.';

const inputClass =
	'block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-500';

/**
 * Two steps: pick a repository — paste any GitHub link or click one of the
 * account's repositories — then see the skills it holds and import them.
 * Branch and folder are optional, under Advanced.
 */
const ConnectRepositoryDialog = ({ ws, isOpen, onClose }: IConnectRepositoryDialogProps) => {
	const { data: apps } = useKnowledgeSourceApps(ws, isOpen);
	const accounts = apps?.find((app) => app.type === 'github')?.accounts ?? [];

	const [credentialId, setCredentialId] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [request, setRequest] = useState<TPreviewSkillSourceDto | null>(null);
	const [preview, setPreview] = useState<TSkillSourcePreview | null>(null);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [branch, setBranch] = useState('');
	const [path, setPath] = useState('');
	const [isShared, setIsShared] = useState(true);

	// The member's first account, once the list arrives, unless they chose.
	const selectedCredentialId = credentialId ?? accounts[0]?.id ?? PUBLIC_ONLY;

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	const isPasted = looksLikeRepository(query);
	const { data: repoOptions, isFetching: isSearching } = useKnowledgeSourceOptions(
		ws,
		selectedCredentialId && !preview ? 'github' : null,
		selectedCredentialId || undefined,
		isPasted ? '' : debouncedQuery,
	);

	const previewMutation = usePreviewSkillSource(ws);
	const createMutation = useCreateSkillSource(ws);

	useEffect(() => {
		if (isOpen) return;
		setCredentialId(null);
		setQuery('');
		setRequest(null);
		setPreview(null);
		setShowAdvanced(false);
		setBranch('');
		setPath('');
		setIsShared(true);
		previewMutation.reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const findSkills = (repo: string, overrides: { branch?: string; path?: string } = {}) => {
		if (!repo.trim() || previewMutation.isPending) return;
		const payload: TPreviewSkillSourceDto = {
			repo: repo.trim(),
			branch: overrides.branch?.trim() || null,
			path: overrides.path?.trim() || null,
			credential_id: selectedCredentialId || null,
		};
		previewMutation.mutate(payload, {
			onSuccess: (result) => {
				setRequest(payload);
				setPreview(result);
				setBranch(result.branch);
				setPath(result.path ?? '');
			},
		});
	};

	const backToPicking = () => {
		setPreview(null);
		setRequest(null);
		setShowAdvanced(false);
		previewMutation.reset();
	};

	const handleImport = () => {
		if (!request || !preview?.skills.length || createMutation.isPending) return;
		createMutation.mutate(
			{ ...request, is_shared: isShared },
			{
				onSuccess: () => {
					notify.success(
						`Importing ${preview.skills.length} skill${preview.skills.length === 1 ? '' : 's'} from ${preview.repo}…`,
					);
					onClose();
				},
			},
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<FolderGit2 size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Import skills from GitHub
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							They stay in sync when the repository changes.
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='pt-2 pb-1'>
					{preview ? (
						<PreviewStep
							preview={preview}
							isShared={isShared}
							onToggleShared={setIsShared}
							showAdvanced={showAdvanced}
							onToggleAdvanced={() => setShowAdvanced((open) => !open)}
							branch={branch}
							path={path}
							onBranchChange={setBranch}
							onPathChange={setPath}
							isRescanning={previewMutation.isPending}
							rescanError={
								previewMutation.isError ? errorText(previewMutation.error) : null
							}
							onRescan={() => findSkills(preview.repo, { branch, path })}
							onBack={backToPicking}
							isImporting={createMutation.isPending}
							onImport={handleImport}
						/>
					) : (
						<div className='space-y-3'>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (isPasted) findSkills(query);
								}}
								className='relative'>
								<Search className='absolute top-3 left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500' />
								<input
									autoFocus
									type='text'
									aria-label='GitHub link or repository'
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onPaste={(e) => {
										const pasted = e.clipboardData.getData('text');
										if (looksLikeRepository(pasted)) {
											e.preventDefault();
											setQuery(pasted.trim());
											findSkills(pasted);
										}
									}}
									placeholder={
										selectedCredentialId
											? 'Paste a GitHub link, or search your repositories'
											: 'Paste a GitHub link, e.g. github.com/anthropics/skills'
									}
									className='focus:border-primary-500/80 block h-10 w-full rounded-xl border border-zinc-200 bg-white pr-24 pl-9 text-xs font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500'
								/>
								{isPasted && (
									<button
										type='submit'
										disabled={previewMutation.isPending}
										className='bg-primary-400 text-primary-950 hover:bg-primary-500 absolute top-1.5 right-1.5 flex h-7 cursor-pointer items-center gap-1 rounded-lg px-3 text-[11px] font-black disabled:opacity-50'>
										{previewMutation.isPending && (
											<Loader2 size={11} className='animate-spin' />
										)}
										Find skills
									</button>
								)}
							</form>

							{previewMutation.isError && (
								<p className='rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-400'>
									{errorText(previewMutation.error)}
								</p>
							)}

							{selectedCredentialId ? (
								<div className='max-h-64 space-y-1.5 overflow-y-auto'>
									{isSearching && !repoOptions?.length && (
										<p className='py-6 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											Loading your repositories…
										</p>
									)}
									{!isSearching && repoOptions?.length === 0 && (
										<p className='py-6 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											No repositories match. Paste its link instead.
										</p>
									)}
									{(repoOptions ?? []).map((option) => {
										const isLoading =
											previewMutation.isPending &&
											previewMutation.variables?.repo === option.value;
										return (
											<button
												key={option.value}
												type='button'
												disabled={previewMutation.isPending}
												onClick={() => findSkills(option.value)}
												className='hover:border-primary-500/40 hover:bg-primary-400/5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900'>
												<div className='min-w-0'>
													<p className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>
														{option.label}
													</p>
													{option.hint && (
														<p className='truncate text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
															{option.hint}
														</p>
													)}
												</div>
												{isLoading ? (
													<Loader2
														size={13}
														className='text-primary-500 shrink-0 animate-spin'
													/>
												) : (
													<span className='text-primary-600 dark:text-primary-400 shrink-0 text-[10px] font-black tracking-wider uppercase'>
														Select
													</span>
												)}
											</button>
										);
									})}
								</div>
							) : (
								<p className='rounded-xl border border-dashed border-zinc-200 px-3 py-3 text-[11px] font-semibold text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'>
									Any public repository works. To pick from your own repositories,
									or import private ones, connect GitHub in Apps.
								</p>
							)}

							{accounts.length > 0 && (
								<div className='flex items-center justify-end gap-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
									<label htmlFor='skill-source-account'>Reading as</label>
									<select
										id='skill-source-account'
										value={selectedCredentialId}
										onChange={(e) => setCredentialId(e.target.value)}
										className='h-8 rounded-lg border border-zinc-200 bg-white py-0 pr-7 pl-2 text-[11px] leading-8 font-bold text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
										{accounts.map((account) => (
											<option key={account.id} value={account.id}>
												{account.name}
											</option>
										))}
										<option value={PUBLIC_ONLY}>
											No account (public only)
										</option>
									</select>
								</div>
							)}
						</div>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

const PreviewStep = ({
	preview,
	isShared,
	onToggleShared,
	showAdvanced,
	onToggleAdvanced,
	branch,
	path,
	onBranchChange,
	onPathChange,
	isRescanning,
	rescanError,
	onRescan,
	onBack,
	isImporting,
	onImport,
}: {
	preview: TSkillSourcePreview;
	isShared: boolean;
	onToggleShared: (shared: boolean) => void;
	showAdvanced: boolean;
	onToggleAdvanced: () => void;
	branch: string;
	path: string;
	onBranchChange: (value: string) => void;
	onPathChange: (value: string) => void;
	isRescanning: boolean;
	rescanError: string | null;
	onRescan: () => void;
	onBack: () => void;
	isImporting: boolean;
	onImport: () => void;
}) => {
	const count = preview.skills.length;

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40'>
				<div className='min-w-0'>
					<p className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>
						{preview.repo}
						{preview.path && <span className='text-zinc-400'>/{preview.path}</span>}
					</p>
					<p className='flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
						<GitBranch size={11} /> {preview.branch}
					</p>
				</div>
				<button
					type='button'
					onClick={onBack}
					className='flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ArrowLeft size={12} /> Change
				</button>
			</div>

			{count > 0 ? (
				<div>
					<p className='mb-2 text-xs font-black text-zinc-700 dark:text-zinc-300'>
						Found {count} skill{count === 1 ? '' : 's'}
					</p>
					<div className='max-h-56 space-y-1.5 overflow-y-auto'>
						{preview.skills.map((skill) => (
							<div
								key={skill.path}
								className='flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900'>
								<Puzzle size={13} className='text-primary-500 mt-0.5 shrink-0' />
								<div className='min-w-0'>
									<p className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>
										{skill.name}
									</p>
									<p className='line-clamp-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
										{skill.description || skill.path || 'Repository root'}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className='flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center dark:border-zinc-800'>
					<SearchX size={20} className='text-zinc-300 dark:text-zinc-600' />
					<p className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>
						No skills found here
					</p>
					<p className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
						Each skill needs its own folder with a <code>SKILL.md</code> file. Check the
						branch and folder under Advanced.
					</p>
				</div>
			)}

			<div className='grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800'>
				{[
					{ shared: true, label: 'Shared with workspace', Icon: Globe },
					{ shared: false, label: 'Only me', Icon: Lock },
				].map(({ shared, label, Icon }) => (
					<button
						key={label}
						type='button'
						onClick={() => onToggleShared(shared)}
						className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-colors ${
							isShared === shared
								? 'bg-primary-400/15 text-primary-700 dark:text-primary-400'
								: 'text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
						}`}>
						<Icon size={12} /> {label}
					</button>
				))}
			</div>

			<div>
				<button
					type='button'
					onClick={onToggleAdvanced}
					className='flex cursor-pointer items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ChevronDown
						size={12}
						className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
					/>
					Advanced: branch and folder
				</button>
				{showAdvanced && (
					<div className='mt-2 space-y-2'>
						<div className='grid grid-cols-2 gap-2'>
							<input
								type='text'
								aria-label='Branch'
								value={branch}
								onChange={(e) => onBranchChange(e.target.value)}
								placeholder={`Branch (${preview.branch})`}
								className={inputClass}
							/>
							<input
								type='text'
								aria-label='Folder'
								value={path}
								onChange={(e) => onPathChange(e.target.value)}
								placeholder='Folder (whole repository)'
								className={inputClass}
							/>
						</div>
						<button
							type='button'
							onClick={onRescan}
							disabled={isRescanning}
							className='flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'>
							{isRescanning && <Loader2 size={11} className='animate-spin' />}
							Scan again
						</button>
						{rescanError && (
							<p className='text-[11px] font-semibold text-rose-500'>{rescanError}</p>
						)}
					</div>
				)}
			</div>

			<button
				type='button'
				onClick={onImport}
				disabled={count === 0 || isImporting}
				className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
				{isImporting && <Loader2 size={13} className='animate-spin' />}
				{count > 0 ? `Import ${count} skill${count === 1 ? '' : 's'}` : 'Nothing to import'}
			</button>
		</div>
	);
};

export default ConnectRepositoryDialog;
