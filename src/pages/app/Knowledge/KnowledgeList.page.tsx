import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Boxes, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { OutletContextType } from './_layouts/Knowledge.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirmContext';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import {
	useKnowledgeChunks,
	useKnowledgeCollections,
	useSearchKnowledge,
	useDeleteKnowledgeChunk,
	useDeleteKnowledgeCollection,
} from '@/api/modules/knowledge-base';
import type { TKnowledgeSearchHit } from '@/types/knowledge-base.type';
import IngestKnowledgeModal from './_partial/IngestKnowledgeModal.partial';

// ============================================================
// Knowledge base
// ------------------------------------------------------------
// Workspace-wide vector store: everything ingested here is what an
// agent's knowledge sources can be scoped to. Backed by
// `workspaces/{ws}/knowledge-base` — list, ingest, semantic
// search, and delete by chunk or whole collection.
// ============================================================

const KnowledgeListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.knowledge }]} />);
		return () => setHeaderLeft('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const ws = activeWorkspaceId || fallbackWorkspaceId;

	const [collection, setCollection] = useState<string>('');
	const [query, setQuery] = useState('');
	const [hits, setHits] = useState<TKnowledgeSearchHit[] | null>(null);
	const [isIngestOpen, setIsIngestOpen] = useState(false);

	const { data: collections } = useKnowledgeCollections(ws);
	const { data: chunkPage, isLoading } = useKnowledgeChunks(ws, {
		collection: collection || undefined,
		per_page: 50,
	});
	const search = useSearchKnowledge(ws);
	const deleteChunk = useDeleteKnowledgeChunk(ws);
	const deleteCollection = useDeleteKnowledgeCollection(ws);

	const collectionList = collections ?? [];
	const chunks = chunkPage?.chunks ?? [];
	const totalChunks = collectionList.reduce((sum, c) => sum + c.chunks_count, 0);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) {
			setHits(null);
			return;
		}
		// Semantic search is a POST, so results are held locally rather than
		// living in the query cache.
		const results = await search.mutateAsync({
			query: query.trim(),
			collection: collection || undefined,
			limit: 20,
		});
		setHits(results);
	};

	const handleClearSearch = () => {
		setQuery('');
		setHits(null);
	};

	const handleDeleteChunk = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete chunk',
			message: 'This removes one embedded chunk. It cannot be undone.',
		});
		if (!confirmed) return;
		await deleteChunk.mutateAsync(id);
	};

	const handleDeleteCollection = async (name: string, count: number) => {
		const confirmed = await confirm({
			title: 'Delete Collection',
			confirmText: 'Delete collection',
			message: (
				<>
					Delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{name}&quot;
					</strong>{' '}
					and all {count} chunk{count === 1 ? '' : 's'} in it? This cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		await deleteCollection.mutateAsync(name);
		if (collection === name) setCollection('');
		notify.success(`Deleted collection "${name}".`);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			<div className='mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 md:p-10'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div>
						<h1 className='text-2xl font-black tracking-tight text-slate-950 dark:text-white'>
							Knowledge
						</h1>
						<p className='mt-1 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							The workspace vector store your agents can search.
						</p>
					</div>
					<button
						type='button'
						onClick={() => setIsIngestOpen(true)}
						className='flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-primary-400 px-5 text-xs font-black text-primary-950 shadow-md shadow-primary-500/10 transition-all hover:bg-primary-500 active:scale-95'>
						<Plus size={14} />
						Add Knowledge
					</button>
				</div>

				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					{[
						{ label: 'Collections', value: collectionList.length, icon: Boxes },
						{ label: 'Chunks', value: totalChunks, icon: Layers },
					].map((stat) => {
						const StatIcon = stat.icon;
						return (
							<div
								key={stat.label}
								className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
										<StatIcon size={16} />
									</div>
									<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										{stat.label}
									</span>
								</div>
								<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
									{stat.value}
								</div>
							</div>
						);
					})}
				</div>

				{/* Collection filter */}
				{collectionList.length > 0 && (
					<div className='flex flex-wrap gap-2'>
						<button
							type='button'
							onClick={() => setCollection('')}
							className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold transition ${
								collection === ''
									? 'bg-primary-400 text-primary-950'
									: 'border border-border-main bg-bg-card text-slate-500 dark:text-zinc-400'
							}`}>
							All
						</button>
						{collectionList.map((c) => (
							<span
								key={c.collection}
								className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
									collection === c.collection
										? 'bg-primary-400 text-primary-950'
										: 'border border-border-main bg-bg-card text-slate-500 dark:text-zinc-400'
								}`}>
								<button
									type='button'
									onClick={() => setCollection(c.collection)}
									className='cursor-pointer'>
									{c.collection}{' '}
									<span className='opacity-60'>({c.chunks_count})</span>
								</button>
								<button
									type='button'
									title={`Delete collection ${c.collection}`}
									onClick={() =>
										handleDeleteCollection(c.collection, c.chunks_count)
									}
									className='cursor-pointer opacity-50 transition hover:text-rose-500 hover:opacity-100'>
									<Trash2 size={11} />
								</button>
							</span>
						))}
					</div>
				)}

				{/* Semantic search */}
				<form onSubmit={handleSearch} className='relative'>
					<Search
						size={15}
						className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'
					/>
					<input
						type='search'
						placeholder='Ask the knowledge base a question…'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-28 pl-11 text-sm font-semibold text-slate-900 outline-none focus:border-primary-400 dark:text-zinc-100'
					/>
					<button
						type='submit'
						disabled={search.isPending}
						className='absolute top-1/2 right-2 h-8 -translate-y-1/2 cursor-pointer rounded-xl bg-primary-400 px-4 text-[11px] font-black text-primary-950 disabled:opacity-60'>
						{search.isPending ? 'Searching…' : 'Search'}
					</button>
				</form>

				{/* Results or chunk list */}
				{hits ? (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center justify-between'>
							<p className='text-xs font-bold text-slate-500 dark:text-zinc-400'>
								{hits.length} result{hits.length === 1 ? '' : 's'}
							</p>
							<button
								type='button'
								onClick={handleClearSearch}
								className='cursor-pointer text-xs font-bold text-primary-600 dark:text-primary-400'>
								Clear search
							</button>
						</div>
						{hits.length === 0 ? (
							<div className='rounded-3xl border border-border-main bg-bg-card py-12 text-center text-sm font-semibold text-slate-400'>
								Nothing matched that question.
							</div>
						) : (
							hits.map((hit, i) => (
								<div
									key={`${hit.source}-${i}`}
									className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs'>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='rounded-lg bg-primary-400/10 px-2 py-0.5 text-[10px] font-black text-primary-600 dark:text-primary-400'>
											{(hit.score * 100).toFixed(1)}% match
										</span>
										<span className='text-[11px] font-bold text-slate-500 dark:text-zinc-400'>
											{hit.source ?? 'Untitled'} · {hit.collection}
										</span>
									</div>
									<p className='mt-2.5 text-xs leading-relaxed font-medium text-slate-600 dark:text-zinc-400'>
										{hit.chunk_text}
									</p>
								</div>
							))
						)}
					</div>
				) : isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-border-main bg-bg-card py-16 text-xs font-semibold text-slate-400'>
						Loading knowledge…
					</div>
				) : chunks.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-border-main bg-bg-card py-16 text-center'>
						<BookOpen size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
							Nothing in the knowledge base yet
						</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Add a document and your agents can look it up.
						</p>
					</div>
				) : (
					<div className='overflow-hidden rounded-2xl border border-border-main bg-bg-card'>
						<AnimatePresence initial={false}>
							{chunks.map((chunk, index) => (
								<motion.div
									key={chunk.id}
									layout
									exit={{ opacity: 0, height: 0 }}
									className={`flex items-start justify-between gap-4 px-5 py-4 ${
										index > 0
											? 'border-t border-zinc-100 dark:border-zinc-800'
											: ''
									}`}>
									<div className='min-w-0'>
										<div className='flex flex-wrap items-center gap-2'>
											<span className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
												{chunk.source ?? 'Untitled'}
											</span>
											<span className='rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
												{chunk.collection}
											</span>
											<span className='text-[10px] font-semibold text-slate-400'>
												{chunk.dimensions} dims
											</span>
										</div>
										<p className='mt-1.5 line-clamp-2 text-xs font-medium text-slate-500 dark:text-zinc-400'>
											{chunk.chunk_text}
										</p>
									</div>
									<button
										type='button'
										title='Delete chunk'
										onClick={() => handleDeleteChunk(chunk.id)}
										className='shrink-0 cursor-pointer text-slate-300 transition hover:text-rose-500'>
										<Trash2 size={13} />
									</button>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>

			<IngestKnowledgeModal
				ws={ws}
				open={isIngestOpen}
				collections={collectionList}
				onClose={() => setIsIngestOpen(false)}
			/>
		</Container>
	);
};

export default KnowledgeListPage;
