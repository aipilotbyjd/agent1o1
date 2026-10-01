import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Images, Loader2, Search } from 'lucide-react';
import { useAgents } from '@/api/modules/agents';
import { useDownloadLibraryItem, useLibrary } from '@/api/modules/library';
import paths from '@/Routes/paths';
import { useAgentChatStore } from '@/store/agentChat.store';
import type { TLibraryItem, TLibraryItemKind } from '@/types/library.type';
import LibraryViewer from './_partial/LibraryViewer.partial';
import { fileIconFor, fileSolidToneFor, fileTypeLabel } from '@/utils/fileDisplay.util';
import { groupByDate } from './_helper/library.helper';

const TYPE_TABS: { id: TLibraryItemKind | 'all'; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'image', label: 'Images' },
	{ id: 'file', label: 'Files' },
];

const LibraryTile = ({ item, onOpen }: { item: TLibraryItem; onOpen: () => void }) => {
	const Icon = fileIconFor(item.mime_type, item.filename);

	return (
		<button
			type='button'
			onClick={onOpen}
			title={item.filename}
			className='group focus-visible:ring-primary-400 relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-left outline-none focus-visible:ring-2 dark:border-white/10 dark:bg-zinc-900'>
			{item.kind === 'image' && item.view_url ? (
				<img
					src={item.view_url}
					alt={item.filename}
					className='h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]'
				/>
			) : (
				<div className='flex h-full w-full flex-col justify-between p-4'>
					<span
						className={`flex h-11 w-11 items-center justify-center rounded-xl ${fileSolidToneFor(item.mime_type, item.filename)}`}>
						<Icon size={20} />
					</span>
					<div className='min-w-0'>
						<p className='line-clamp-2 text-[13px] font-bold break-words text-zinc-800 dark:text-zinc-100'>
							{item.filename}
						</p>
						<p className='mt-0.5 text-[11px] font-semibold text-zinc-400'>
							{fileTypeLabel(item.mime_type, item.filename)}
						</p>
					</div>
				</div>
			)}

			{item.kind === 'image' && (
				<div className='pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100'>
					<p className='truncate text-xs font-bold text-white'>{item.filename}</p>
					{item.agent && (
						<p className='truncate text-[11px] text-white/70'>{item.agent.name}</p>
					)}
				</div>
			)}
		</button>
	);
};

/**
 * Every file from agent chats in one gallery, as in ChatGPT's library: what
 * members uploaded and what agents made, newest first, grouped by day.
 * Separate from the Artifacts file manager — this is for finding and looking
 * at files, not managing them.
 */
const LibraryPage = () => {
	const navigate = useNavigate();
	const { workspaceId = '' } = useParams<{ workspaceId: string }>();
	const chatAgentId = useAgentChatStore((state) => state.agentId);
	const [type, setType] = useState<TLibraryItemKind | 'all'>('all');
	const [agentId, setAgentId] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const [search, setSearch] = useState('');
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: agents } = useAgents(workspaceId);
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useLibrary(
		workspaceId,
		{
			type: type === 'all' ? undefined : type,
			agent_id: agentId || undefined,
			search: search || undefined,
		},
	);
	const download = useDownloadLibraryItem(workspaceId);

	const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
	const groups = useMemo(() => groupByDate(items), [items]);
	const openItem = openIndex === null ? null : items[openIndex];

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasNextPage) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
			},
			{ rootMargin: '400px' },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const backToChat = () =>
		navigate(
			chatAgentId ? paths.editAgent(workspaceId, chatAgentId) : paths.newAgent(workspaceId),
		);

	return (
		<div className='flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/60 dark:bg-zinc-950'>
			<header className='shrink-0 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-zinc-950/95'>
				<div className='mx-auto flex w-full max-w-6xl items-center gap-3'>
					<button
						type='button'
						onClick={backToChat}
						aria-label='Back to chat'
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						<ArrowLeft size={18} />
					</button>
					<div className='min-w-0 flex-1'>
						<h1 className='truncate text-base font-black text-zinc-950 sm:text-lg dark:text-white'>
							Library
						</h1>
						<p className='truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
							Images and files from your agent chats
						</p>
					</div>
				</div>

				<div className='mx-auto mt-3 flex w-full max-w-6xl flex-wrap items-center gap-2'>
					<div className='flex rounded-xl bg-zinc-100 p-1 dark:bg-white/5'>
						{TYPE_TABS.map((tab) => (
							<button
								key={tab.id}
								type='button'
								onClick={() => setType(tab.id)}
								className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
									type === tab.id
										? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
										: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
								}`}>
								{tab.label}
							</button>
						))}
					</div>

					<select
						value={agentId}
						onChange={(event) => setAgentId(event.target.value)}
						aria-label='Agent'
						className='h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200'>
						<option value=''>All agents</option>
						{(agents ?? []).map((agent) => (
							<option key={agent.id} value={agent.id}>
								{agent.name}
							</option>
						))}
					</select>

					<label className='flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 sm:max-w-xs dark:border-white/10 dark:bg-zinc-900'>
						<Search size={14} className='shrink-0 text-zinc-400' />
						<input
							type='search'
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							placeholder='Search by file name'
							className='min-w-0 flex-1 border-none bg-transparent text-xs font-semibold text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100'
						/>
					</label>
				</div>
			</header>

			<main className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6'>
				<div className='mx-auto w-full max-w-6xl'>
					{isLoading ? (
						<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'>
							{Array.from({ length: 10 }, (_, index) => (
								<div
									key={index}
									className='aspect-square animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-900'
								/>
							))}
						</div>
					) : items.length === 0 ? (
						<div className='flex flex-col items-center py-24 text-center'>
							<div className='bg-primary-400/15 text-primary-600 dark:text-primary-400 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl'>
								<Images size={24} />
							</div>
							<p className='text-sm font-black text-zinc-900 dark:text-white'>
								{search || agentId || type !== 'all'
									? 'Nothing matches'
									: 'Your library is empty'}
							</p>
							<p className='mt-1 max-w-sm text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
								{search || agentId || type !== 'all'
									? 'Try another filter or search.'
									: 'Images and files you send to agents, and the ones they make, show up here.'}
							</p>
						</div>
					) : (
						<div className='space-y-8'>
							{groups.map((group) => (
								<section key={group.label}>
									<h2 className='mb-3 text-xs font-black tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
										{group.label}
									</h2>
									<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'>
										{group.items.map((item) => (
											<LibraryTile
												key={item.id}
												item={item}
												onOpen={() => setOpenIndex(items.indexOf(item))}
											/>
										))}
									</div>
								</section>
							))}
							<div ref={sentinelRef} className='flex justify-center py-4'>
								{isFetchingNextPage && (
									<Loader2 size={18} className='animate-spin text-zinc-400' />
								)}
							</div>
						</div>
					)}
				</div>
			</main>

			{openItem && openIndex !== null && (
				<LibraryViewer
					item={openItem}
					onClose={() => setOpenIndex(null)}
					onPrevious={openIndex > 0 ? () => setOpenIndex(openIndex - 1) : undefined}
					onNext={
						openIndex < items.length - 1 ? () => setOpenIndex(openIndex + 1) : undefined
					}
					onDownload={() => download.mutate(openItem)}
					isDownloading={download.isPending}
					onOpenChat={
						openItem.agent && openItem.chat
							? () =>
									navigate(
										`${paths.editAgent(workspaceId, openItem.agent!.id)}?session=${openItem.chat!.id}`,
									)
							: undefined
					}
				/>
			)}
		</div>
	);
};

export default LibraryPage;
