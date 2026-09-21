import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileDown, Download, Trash2, History, Eye, MoreHorizontal } from 'lucide-react';
import { OutletContextType } from './_layouts/Artifacts.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import { useArtifacts, useDeleteArtifact, useDownloadArtifact } from '@/api/modules/artifacts';
import type { TArtifact, TArtifactMimeCategory } from '@/types/artifact.type';
import ListSkeletonPart from '@/parts/ListSkeleton.part';
import { notify } from '@/api/core';
import { ARTIFACT_CATEGORIES, getArtifactIcon, getArtifactColor, formatBytes } from './_helper/artifacts.constants';
import ArtifactVersionsModal from './_partial/ArtifactVersionsModal.partial';

const PER_PAGE = 24;

const ArtifactsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.artifacts }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** The URL is the source of truth for the workspace; the context covers the
	 *  first render, before the route param is available. */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'All' | TArtifactMimeCategory>('All');
	const [page, setPage] = useState(1);
	const [historyArtifactId, setHistoryArtifactId] = useState<string | null>(null);

	// The backend paginates and filters server-side — no client-side filtering
	// needed here (unlike Skills, this endpoint takes real query params).
	const { data, isLoading } = useArtifacts(ws, {
		search: searchQuery.trim() || undefined,
		mime_category: selectedCategory === 'All' ? undefined : selectedCategory,
		page,
		per_page: PER_PAGE,
	});
	const deleteMutation = useDeleteArtifact(ws);
	const downloadMutation = useDownloadArtifact(ws);

	const artifactList = data?.artifacts ?? [];
	const meta = data?.meta;

	const handleFilterChange = (fn: () => void) => {
		fn();
		setPage(1);
	};

	const handleDelete = async (artifact: TArtifact) => {
		const confirmed = await confirm({
			title: 'Delete Artifact',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{artifact.filename}&quot;
					</strong>
					? All {artifact.versions_count ?? 1} version(s) will be removed. This action cannot be
					undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteMutation.mutate(artifact.id, {
			onSuccess: () => notify.success('Artifact deleted.'),
		});
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			<div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
				{/* Header panel */}
				<div className='mb-8 flex items-center justify-between gap-4'>
					<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
						Artifacts
					</h1>
				</div>

				<div className='mb-8 flex flex-col gap-4'>
					<div className='group relative flex-1'>
						<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500 dark:text-zinc-500' />
						<input
							type='search'
							aria-label='Search artifacts'
							placeholder='Search artifacts by filename...'
							value={searchQuery}
							onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
							className='block h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary-500/80 focus:ring-4 focus:ring-primary-500/10 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
						/>
					</div>

					<div className='no-scrollbar flex gap-2 overflow-x-auto pb-1'>
						<button
							onClick={() => handleFilterChange(() => setSelectedCategory('All'))}
							className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
								selectedCategory === 'All'
									? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
									: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:text-zinc-400'
							}`}>
							All
						</button>
						{ARTIFACT_CATEGORIES.map((cat) => (
							<button
								key={cat.value}
								onClick={() => handleFilterChange(() => setSelectedCategory(cat.value))}
								className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
									selectedCategory === cat.value
										? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
										: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:text-zinc-400'
								}`}>
								{cat.label}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						<ListSkeletonPart count={8} />
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
					<>
						<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
							<AnimatePresence mode='popLayout'>
								{artifactList.map((artifact) => (
									<ArtifactCard
										key={artifact.id}
										artifact={artifact}
										onShowVersions={() => setHistoryArtifactId(artifact.id)}
										onDownload={() =>
											downloadMutation.mutate({
												artifactId: artifact.id,
												filename: artifact.filename,
											})
										}
										onDelete={() => handleDelete(artifact)}
									/>
								))}
							</AnimatePresence>
						</div>

						{meta && meta.last_page > 1 && (
							<div className='flex items-center justify-between'>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									Page {meta.current_page} of {meta.last_page} · {meta.total} artifacts
								</span>
								<div className='flex gap-2'>
									<button
										disabled={meta.current_page <= 1}
										onClick={() => setPage((p) => p - 1)}
										className='flex h-8 cursor-pointer items-center justify-center rounded-xl border border-border-main px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300'>
										Previous
									</button>
									<button
										disabled={meta.current_page >= meta.last_page}
										onClick={() => setPage((p) => p + 1)}
										className='flex h-8 cursor-pointer items-center justify-center rounded-xl border border-border-main px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300'>
										Next
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			<ArtifactVersionsModal ws={ws} artifactId={historyArtifactId} onClose={() => setHistoryArtifactId(null)} />
		</Container>
	);
};

const ArtifactCard = ({
	artifact,
	onShowVersions,
	onDownload,
	onDelete,
}: {
	artifact: TArtifact;
	onShowVersions: () => void;
	onDownload: () => void;
	onDelete: () => void;
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const IconComponent = getArtifactIcon(artifact.mime_type);
	const color = getArtifactColor(artifact.mime_type);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			transition={{ type: 'spring', stiffness: 350, damping: 25 }}
			className='group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-primary-400/50 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]'>
			<div className='mb-3.5 flex items-start justify-between'>
				<div className='flex min-w-0 items-center gap-3'>
					<div
						style={{ backgroundColor: `${color}1f` }}
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 transition-transform duration-300 group-hover:scale-105 dark:border-zinc-800/50'>
						<IconComponent className='h-5 w-5' style={{ color }} />
					</div>
					<div className='min-w-0 space-y-0.5'>
						<h4 className='truncate text-[13px] leading-snug font-black text-slate-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400'>
							{artifact.filename}
						</h4>
						<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							{artifact.agent?.name ?? artifact.creator?.name ?? 'Uploaded manually'}
						</span>
					</div>
				</div>
				<div className='relative shrink-0'>
					<button
						onClick={() => setMenuOpen((o) => !o)}
						title='More options'
						className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
						<MoreHorizontal className='h-4 w-4' />
					</button>
					{menuOpen && (
						<div className='absolute top-8 right-0 z-10 w-32 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
							<button
								onClick={() => {
									setMenuOpen(false);
									onDelete();
								}}
								className='flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-left text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'>
								<Trash2 size={12} />
								Delete
							</button>
						</div>
					)}
				</div>
			</div>

			<p className='mb-4 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
				{formatBytes(artifact.size)}
			</p>

			<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
				<span className='inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[9px] font-bold text-primary-700 dark:border-primary-500/20 dark:bg-primary-950/20 dark:text-primary-400'>
					v{artifact.version}
				</span>
				{(artifact.versions_count ?? 1) > 1 && (
					<button
						onClick={onShowVersions}
						className='flex cursor-pointer items-center gap-1 text-[10px] font-bold text-primary-600 hover:underline dark:text-primary-400'>
						<History size={11} />
						{artifact.versions_count} versions
					</button>
				)}
			</div>

			<div className='mt-3 flex items-center gap-2'>
				{artifact.preview_url && (
					<a
						href={artifact.preview_url}
						target='_blank'
						rel='noreferrer'
						className='flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						<Eye size={12} className='text-slate-500 dark:text-zinc-400' />
						Preview
					</a>
				)}
				<button
					onClick={onDownload}
					title='Download'
					className={`flex h-8 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md shadow-primary-500/10 transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95 ${
						artifact.preview_url ? 'w-8' : 'flex-1 gap-1.5 text-[11px] font-bold'
					}`}>
					<Download size={14} />
					{!artifact.preview_url && 'Download'}
				</button>
			</div>
		</motion.div>
	);
};

export default ArtifactsListPage;
