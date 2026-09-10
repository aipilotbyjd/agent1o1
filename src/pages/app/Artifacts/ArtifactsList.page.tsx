import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileDown, HardDrive, Bot, Download, Trash2, History, Eye } from 'lucide-react';
import { OutletContextType } from './_layouts/Artifacts.layout';
import { useConfirm } from '@/context/confirmContext';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useArtifacts, useDeleteArtifact, useDownloadArtifact } from '@/api/modules/artifacts';
import type { TArtifact, TArtifactFilters, TArtifactMimeCategory } from '@/types/artifact.type';
import { ARTIFACT_CATEGORIES, getArtifactIcon, getArtifactColor, formatBytes } from './_helper/artifacts.constants';
import ArtifactVersionsModal from './_partial/ArtifactVersionsModal.partial';

const ArtifactsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.artifacts }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'All' | TArtifactMimeCategory>('All');
	const [historyArtifactId, setHistoryArtifactId] = useState<string | null>(null);

	const filters = useMemo<TArtifactFilters>(() => {
		const f: TArtifactFilters = {};
		if (searchQuery.trim()) f.search = searchQuery.trim();
		if (selectedCategory !== 'All') f.mime_category = selectedCategory;
		return f;
	}, [searchQuery, selectedCategory]);

	const { data: artifacts, isLoading } = useArtifacts(currentWorkspaceId, filters);
	const deleteMutation = useDeleteArtifact(currentWorkspaceId);
	const downloadMutation = useDownloadArtifact(currentWorkspaceId);

	const artifactList = artifacts ?? [];
	const totalSize = artifactList.reduce((acc, a) => acc + a.size, 0);
	const agentCount = new Set(artifactList.map((a) => a.agent.id)).size;

	const handleDelete = async (artifact: TArtifact) => {
		const confirmed = await confirm({
			title: 'Delete Artifact',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{artifact.filename}&quot;
					</strong>
					? All {artifact.versions_count ?? 1} version(s) will be removed. This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteMutation.mutate(artifact.id);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			<div className='pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-primary-400/5 to-primary-400/5 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br from-primary-500/5 to-primary-500/0 blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col space-y-8 p-4 sm:p-6 md:p-8'>
				<div className='flex flex-col justify-between gap-6 md:flex-row md:items-center'>
					<div>
						<h1 className='bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:via-zinc-200 dark:to-white'>
							Artifacts
						</h1>
						<p className='mt-1 text-xs font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
							AGENT-GENERATED FILES
						</p>
						<p className='mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							Reports, images, and files your agents export during conversations — versioned and
							downloadable.
						</p>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<FileDown size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Total Artifacts
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
							{artifactList.length}
						</div>
					</div>

					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<HardDrive size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Storage Used
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
							{formatBytes(totalSize)}
						</div>
					</div>

					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Bot size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Agents That Exported
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>{agentCount}</div>
					</div>
				</div>

				<div className='flex flex-col gap-4'>
					<div className='group relative flex-1'>
						<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500 dark:text-zinc-500' />
						<input
							type='search'
							aria-label='Search artifacts'
							placeholder='Search artifacts by filename...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='dark:placeholder:text-zinc-500 block h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-border-main dark:bg-bg-card dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950/40 dark:focus:ring-primary-500/15'
						/>
					</div>

					<div className='no-scrollbar flex gap-2 overflow-x-auto pb-1'>
						<button
							onClick={() => setSelectedCategory('All')}
							className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
								selectedCategory === 'All'
									? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
									: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:border-border-main dark:bg-bg-card dark:text-zinc-400'
							}`}>
							All
						</button>
						{ARTIFACT_CATEGORIES.map((cat) => (
							<button
								key={cat.value}
								onClick={() => setSelectedCategory(cat.value)}
								className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
									selectedCategory === cat.value
										? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
										: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:border-border-main dark:bg-bg-card dark:text-zinc-400'
								}`}>
								{cat.label}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-border-main bg-bg-card py-16 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
						Loading artifacts…
					</div>
				) : artifactList.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-border-main bg-bg-card py-16 text-center'>
						<FileDown size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>No artifacts yet</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Files your agents export during conversations will show up here.
						</p>
					</div>
				) : (
					<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
						<AnimatePresence mode='popLayout'>
							{artifactList.map((artifact) => {
								const IconComponent = getArtifactIcon(artifact.mime_type);
								const color = getArtifactColor(artifact.mime_type);
								return (
									<motion.article
										key={artifact.id}
										layout
										initial={{ opacity: 0, scale: 0.96, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96, y: 10 }}
										whileHover={{ y: -6, scale: 1.01 }}
										transition={{ type: 'spring', stiffness: 350, damping: 25 }}
										className='group relative flex flex-col justify-between rounded-3xl border border-border-main bg-bg-card p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-primary-500/35 hover:bg-bg-card/80 hover:shadow-xl dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 dark:hover:shadow-none'>
										<div className='flex items-start justify-between gap-4'>
											<div
												className='relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md'
												style={{ backgroundColor: color }}>
												<IconComponent size={20} />
											</div>
											<span className='inline-flex h-7 items-center gap-1 rounded-lg border border-primary-500/20 bg-primary-400/10 px-2.5 text-[10px] font-bold text-primary-600 dark:text-primary-400'>
												v{artifact.version}
											</span>
										</div>

										<div className='mt-5 text-left'>
											<h2 className='truncate text-md font-bold tracking-tight text-slate-900 dark:text-white'>
												{artifact.filename}
											</h2>
											<p className='mt-2 text-xs leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
												{formatBytes(artifact.size)} · {artifact.agent.name}
											</p>
										</div>

										{(artifact.versions_count ?? 1) > 1 && (
											<button
												onClick={() => setHistoryArtifactId(artifact.id)}
												className='mt-3 flex w-fit cursor-pointer items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline dark:text-primary-400'>
												<History size={11} />
												{artifact.versions_count} versions
											</button>
										)}

										<div className='my-4 border-t border-slate-100 dark:border-zinc-800/60' />

										<div className='flex items-center gap-2'>
											{artifact.preview_url && (
												<a
													href={artifact.preview_url}
													target='_blank'
													rel='noreferrer'
													className='dark:text-zinc-300 dark:hover:bg-zinc-955/60 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-card text-[11px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:border-border-main dark:bg-bg-card'>
													<Eye size={12} className='text-slate-500 dark:text-zinc-400' />
													Preview
												</a>
											)}
											<button
												onClick={() =>
													downloadMutation.mutate({
														artifactId: artifact.id,
														filename: artifact.filename,
													})
												}
												title='Download'
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md shadow-primary-500/10 transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95'>
												<Download size={14} />
											</button>
											<button
												onClick={() => handleDelete(artifact)}
												title='Delete artifact'
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 active:scale-95 dark:border-zinc-800 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20'>
												<Trash2 size={12} />
											</button>
										</div>
									</motion.article>
								);
							})}
						</AnimatePresence>
					</div>
				)}
			</div>

			<ArtifactVersionsModal
				ws={currentWorkspaceId}
				artifactId={historyArtifactId}
				onClose={() => setHistoryArtifactId(null)}
			/>
		</Container>
	);
};

export default ArtifactsListPage;
