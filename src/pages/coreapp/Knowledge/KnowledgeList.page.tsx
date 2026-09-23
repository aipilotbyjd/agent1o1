import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, FileText, BookOpen, Trash2, Search as SearchIcon } from 'lucide-react';
import { OutletContextType } from './_layouts/Knowledge.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import { ListSkeletonRows } from '@/parts/ListSkeleton.part';
import { notify } from '@/api/core';
import {
	useKnowledgeChunks,
	useKnowledgeCollections,
	useDeleteKnowledgeChunk,
	useDeleteKnowledgeCollection,
	useSearchKnowledge,
} from '@/api/modules/knowledge-base';
import IngestKnowledgeDialog from './_partial/IngestKnowledgeDialog.partial';

const PER_PAGE = 12;

const KnowledgeListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.knowledge }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;
	const { confirm } = useConfirm();

	const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [view, setView] = useState<'browse' | 'search'>('browse');
	const [isIngestOpen, setIsIngestOpen] = useState(false);

	const { data: collections, isLoading: isLoadingCollections } = useKnowledgeCollections(ws);
	const { data: chunkPage, isLoading: isLoadingChunks } = useKnowledgeChunks(ws, {
		collection: selectedCollection,
		page,
		per_page: PER_PAGE,
	});
	const deleteChunkMutation = useDeleteKnowledgeChunk(ws);
	const deleteCollectionMutation = useDeleteKnowledgeCollection(ws);

	const [searchQuery, setSearchQuery] = useState('');
	const searchMutation = useSearchKnowledge(ws);

	const chunks = chunkPage?.chunks ?? [];
	const meta = chunkPage?.meta;

	const handleSelectCollection = (collection: string | undefined) => {
		setSelectedCollection(collection);
		setPage(1);
	};

	const handleDeleteChunk = async (id: string, source: string | null) => {
		const confirmed = await confirm({
			title: 'Delete chunk',
			message: (
				<>
					Remove{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						{source ? `"${source}"` : 'this chunk'}
					</strong>{' '}
					from the knowledge base? Agents will no longer be able to retrieve it.
				</>
			),
		});
		if (!confirmed) return;
		deleteChunkMutation.mutate(id, {
			onSuccess: () => notify.success('Removed from the knowledge base.'),
		});
	};

	const handleDeleteCollection = async (collection: string) => {
		const confirmed = await confirm({
			title: 'Delete collection',
			message: (
				<>
					Delete every chunk in{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{collection}&quot;
					</strong>
					? This is the way to re-ingest a document - drop the collection, then ingest the
					new revision. This cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteCollectionMutation.mutate(collection, {
			onSuccess: () => {
				if (selectedCollection === collection) handleSelectCollection(undefined);
			},
		});
	};

	const handleSearch = () => {
		if (!searchQuery.trim()) return;
		searchMutation.mutate({
			query: searchQuery.trim(),
			collection: selectedCollection,
		});
	};

	return (
		<Container
			breakpoint={null}
			className='relative max-w-full min-w-0 overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			<div className='mx-auto max-w-7xl min-w-0 px-3 py-6 sm:px-6 sm:py-8 lg:px-8'>
				{/* Header panel */}
				<div className='mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between'>
					<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
						Knowledge Base
					</h1>
					<button
						onClick={() => setIsIngestOpen(true)}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 hover:shadow-primary-500/20 flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition-all hover:shadow-lg active:scale-95 sm:h-10 sm:w-auto dark:shadow-none'>
						<CloudUpload size={14} />
						<span>Ingest</span>
					</button>
				</div>

				{/* Collections + view toggle */}
				<div className='mb-6 flex min-w-0 flex-col gap-4 sm:mb-8'>
					<div className='no-scrollbar flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1'>
						<button
							onClick={() => handleSelectCollection(undefined)}
							className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
								selectedCollection === undefined
									? 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r'
									: 'border border-zinc-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
							}`}>
							All
						</button>
						{(collections ?? []).map((c) => (
							<div
								key={c.collection}
								className={`group flex h-9 shrink-0 items-center gap-1.5 rounded-xl pr-1.5 pl-4 text-xs font-bold transition-all ${
									selectedCollection === c.collection
										? 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r'
										: 'border border-zinc-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
								}`}>
								<button
									onClick={() => handleSelectCollection(c.collection)}
									className='flex items-center gap-1.5'>
									<span className='font-mono'>{c.collection}</span>
									<span className='opacity-60'>{c.chunks_count}</span>
								</button>
								<button
									aria-label={`Delete collection ${c.collection}`}
									onClick={() => handleDeleteCollection(c.collection)}
									className='rounded-lg p-1 opacity-100 transition-opacity hover:bg-black/10 sm:opacity-0 sm:group-hover:opacity-100'>
									<Trash2 size={11} />
								</button>
							</div>
						))}
						{!isLoadingCollections && collections?.length === 0 && (
							<span className='py-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
								No collections yet - ingest a document to create one.
							</span>
						)}
					</div>

					<div className='grid w-full shrink-0 grid-cols-2 gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 sm:flex sm:w-auto sm:self-start dark:border-zinc-800 dark:bg-zinc-900'>
						<button
							onClick={() => setView('browse')}
							className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold transition-all ${
								view === 'browse'
									? 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r'
									: 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40'
							}`}>
							Browse
						</button>
						<button
							onClick={() => setView('search')}
							className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold transition-all ${
								view === 'search'
									? 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r'
									: 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40'
							}`}>
							Test search
						</button>
					</div>
				</div>

				{view === 'search' ? (
					<div className='rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs backdrop-blur-md sm:rounded-3xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900'>
						<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							Runs the exact retrieval an agent&apos;s search-knowledge tool would, so
							you can see what a question would actually surface
							{selectedCollection ? ` in "${selectedCollection}"` : ''}.
						</p>
						<div className='mt-4 flex flex-col gap-2 sm:flex-row'>
							<div className='group relative min-w-0 flex-1'>
								<SearchIcon className='group-focus-within:text-primary-500 absolute top-3.5 left-4 h-4 w-4 text-slate-400 transition-colors duration-200 dark:text-zinc-500' />
									<input
										type='search'
										aria-label='Test knowledge search'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
									placeholder='Ask a question…'
									className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-zinc-200 bg-white pr-4 pl-11 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500'
								/>
							</div>
							<button
								onClick={handleSearch}
								disabled={!searchQuery.trim() || searchMutation.isPending}
								className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/10 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r px-5 text-xs font-black shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'>
								{searchMutation.isPending ? 'Searching…' : 'Search'}
							</button>
						</div>

						{searchMutation.data && (
							<div className='mt-4 flex flex-col gap-2'>
								{searchMutation.data.length === 0 ? (
									<p className='py-6 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500'>
										No matches for that query.
									</p>
								) : (
									searchMutation.data.map((hit, idx) => (
										<div
											key={`${hit.source}-${idx}`}
											className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50'>
											<div className='flex items-center justify-between gap-2'>
												<div className='flex min-w-0 items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200'>
													<FileText
														size={13}
														className='text-primary-500 shrink-0'
													/>
													<span className='truncate'>
														{hit.source ?? 'Untitled'}
													</span>
												</div>
												<span className='shrink-0 rounded-lg border border-zinc-200/50 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
													{hit.score.toFixed(4)}
												</span>
											</div>
											<p className='mt-1.5 line-clamp-3 text-xs leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
												{hit.chunk_text}
											</p>
										</div>
									))
								)}
							</div>
						)}
					</div>
				) : isLoadingChunks ? (
					<ListSkeletonRows count={5} />
				) : chunks.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900'>
						<BookOpen size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
							No documents yet
						</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Ingest text or a file to build the workspace&apos;s knowledge base.
						</p>
					</div>
				) : (
					<>
						<div className='flex flex-col gap-3'>
							<AnimatePresence mode='popLayout'>
								{chunks.map((chunk) => (
									<motion.div
										key={chunk.id}
										layout
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 8 }}
										transition={{ type: 'spring', stiffness: 350, damping: 25 }}
										className='group hover:border-primary-500/35 dark:hover:border-primary-500/35 flex min-w-0 items-start justify-between gap-2.5 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs transition-all duration-300 sm:gap-3 sm:p-4 sm:hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-none'>
										<div className='flex min-w-0 flex-1 items-start gap-3'>
											<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
												<FileText size={15} />
											</div>
											<div className='min-w-0 flex-1'>
												<div className='flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2'>
													<span className='truncate text-sm font-bold text-slate-900 dark:text-white'>
														{chunk.source ?? 'Untitled'}
													</span>
													<span className='inline-flex w-fit max-w-full items-center gap-1 truncate rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
														{chunk.collection}
													</span>
													<span className='hidden text-[10px] font-semibold text-slate-400 sm:inline dark:text-zinc-500'>
														{chunk.dimensions} dims
													</span>
												</div>
												<p className='mt-1.5 line-clamp-3 text-xs leading-relaxed font-semibold text-slate-400 sm:line-clamp-2 dark:text-zinc-500'>
													{chunk.chunk_text}
												</p>
											</div>
										</div>
										<button
											aria-label='Delete chunk'
											onClick={() =>
												handleDeleteChunk(chunk.id, chunk.source)
											}
											className='flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-rose-100 text-rose-500 opacity-100 transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-95 sm:h-8 sm:w-8 sm:border-slate-200 sm:text-slate-400 sm:opacity-0 sm:group-hover:opacity-100 sm:hover:text-rose-500 dark:border-rose-500/20 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20 dark:sm:border-zinc-800'>
											<Trash2 size={12} />
										</button>
									</motion.div>
								))}
							</AnimatePresence>
						</div>

						{meta && meta.last_page > 1 && (
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									Page {meta.current_page} of {meta.last_page} · {meta.total}{' '}
									chunks
								</span>
								<div className='grid grid-cols-2 gap-2 sm:flex'>
									<button
										disabled={meta.current_page <= 1}
										onClick={() => setPage((p) => p - 1)}
										className='flex h-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'>
										Previous
									</button>
									<button
										disabled={meta.current_page >= meta.last_page}
										onClick={() => setPage((p) => p + 1)}
										className='flex h-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 px-3 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'>
										Next
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			<IngestKnowledgeDialog
				ws={ws}
				isOpen={isIngestOpen}
				defaultCollection={selectedCollection}
				onClose={() => setIsIngestOpen(false)}
			/>
		</Container>
	);
};

export default KnowledgeListPage;
