import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Library, Plus, Trash2, ExternalLink } from 'lucide-react';
import AgentSideDrawer, { AttachToggle } from './AgentSideDrawer.partial';
import {
	useAgentKnowledgeSources,
	useAttachAgentKnowledgeSource,
	useDetachAgentKnowledgeSource,
} from '@/api/modules/agents';
import { useKnowledgeCollections } from '@/api/modules/knowledge-base';

type TProps = {
	ws: string;
	agentId?: string;
};

/** Every agent's exported files are indexed as `artifacts:<agentId>`. Its own
 *  are always searchable, so these are internal and not offered here. */
const isArtifactCollection = (collection: string) => collection.startsWith('artifacts:');

/**
 * Which workspace knowledge-base collections this agent may search. With none
 * attached the backend lets it search every collection in the workspace;
 * attaching one scopes its knowledge tools to just those — see
 * AgentKnowledgeSourceController and ToolRegistry::knowledgeTools().
 */
const AgentKnowledgeSourcesPanel = ({ ws, agentId }: TProps) => {
	const navigate = useNavigate();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const { data: sources } = useAgentKnowledgeSources(ws, agentId ?? '');
	const { data: collections } = useKnowledgeCollections(ws);
	const attachMutation = useAttachAgentKnowledgeSource(ws, agentId ?? '');
	const detachMutation = useDetachAgentKnowledgeSource(ws, agentId ?? '');

	if (!agentId) return null;

	const attached = sources?.attached ?? [];
	const chunkCounts = new Map(
		(collections ?? []).map((row) => [row.collection, row.chunks_count]),
	);
	const available = (sources?.available ?? []).filter(
		(collection) => !isArtifactCollection(collection),
	);
	const query = searchQuery.trim().toLowerCase();
	const matching = available.filter((collection) => collection.toLowerCase().includes(query));
	const isBusy = attachMutation.isPending || detachMutation.isPending;

	const chunksLabel = (collection: string) => {
		const count = chunkCounts.get(collection);
		return count === undefined ? '' : `${count} ${count === 1 ? 'chunk' : 'chunks'}`;
	};

	return (
		<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
						<Library size={14} />
					</div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
						Knowledge Sources
					</h4>
				</div>
				<button
					onClick={() => {
						setSearchQuery('');
						setIsPickerOpen(true);
					}}
					className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Source</span>
				</button>
			</div>

			{attached.length === 0 && (
				<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					{available.length > 0
						? 'Searches every knowledge collection in this workspace. Add a source to limit it to specific ones.'
						: 'Add documents to the workspace knowledge base, then pick what this agent can search.'}
				</p>
			)}

			{attached.length > 0 && (
				<div className='space-y-2 pl-9'>
					{attached.map((collection) => (
						<div
							key={collection}
							className='flex items-center justify-between border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800/80'>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
									<Library size={15} />
								</div>
								<div className='flex min-w-0 flex-col'>
									<span className='truncate text-xs font-black text-zinc-800 dark:text-zinc-200'>
										{collection}
									</span>
									<span className='mt-0.5 truncate text-[10px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
										{chunksLabel(collection) || 'No documents left in this collection'}
									</span>
								</div>
							</div>
							<button
								onClick={() => detachMutation.mutate(collection)}
								disabled={isBusy}
								title='Remove source'
								className='cursor-pointer p-1 text-zinc-400 hover:text-red-500 disabled:opacity-50 dark:hover:text-red-400'>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
			)}

			<AgentSideDrawer
				isOpen={isPickerOpen}
				title='Add a knowledge source'
				onClose={() => setIsPickerOpen(false)}
				search={{
					value: searchQuery,
					onChange: setSearchQuery,
					placeholder: `Search ${available.length} collections`,
				}}
				footer={
					<button
						onClick={() => navigate(`/${ws}/knowledge`)}
						className='flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-xs font-black text-zinc-700 hover:bg-zinc-50 md:min-h-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						<ExternalLink size={12} />
						Manage knowledge base
					</button>
				}>
				<h4 className='pl-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase'>
					Workspace collections
				</h4>
				<div className='space-y-1.5'>
					{matching.map((collection) => {
						const isAttached = attached.includes(collection);
						return (
							<div
								key={collection}
								className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40'>
								<div className='flex min-w-0 items-center gap-3'>
									<div className='bg-primary-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs'>
										<Library size={16} />
									</div>
									<div className='flex min-w-0 flex-col'>
										<span className='truncate text-xs font-black text-zinc-900 dark:text-zinc-100'>
											{collection}
										</span>
										{chunksLabel(collection) && (
											<span className='mt-0.5 truncate text-[9px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
												{chunksLabel(collection)}
											</span>
										)}
									</div>
								</div>
								<AttachToggle
									label={collection}
									isAttached={isAttached}
									disabled={isBusy}
									onClick={() =>
										isAttached
											? detachMutation.mutate(collection)
											: attachMutation.mutate(collection)
									}
								/>
							</div>
						);
					})}
					{matching.length === 0 && (
						<div className='py-8 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500'>
							{query
								? `Nothing matches "${searchQuery}"`
								: 'No knowledge collections in this workspace yet.'}
						</div>
					)}
				</div>
			</AgentSideDrawer>
		</div>
	);
};

export default AgentKnowledgeSourcesPanel;
