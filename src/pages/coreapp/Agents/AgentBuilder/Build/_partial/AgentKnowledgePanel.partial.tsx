import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Library, Plus, Trash2, ExternalLink, FilePlus2, AlertTriangle } from 'lucide-react';
import AgentSideDrawer, { AttachToggle } from './AgentSideDrawer.partial';
import AddKnowledgeDialog from '@/pages/coreapp/Knowledge/_partial/AddKnowledgeDialog.partial';
import { slugify } from '@/pages/welcome/_helper/onboarding.helper';
import {
	useAgentKnowledge,
	useAttachAgentKnowledge,
	useDetachAgentKnowledge,
	useUpdateAgentKnowledgeMode,
} from '@/api/modules/agent-knowledge';
import { useKnowledgeCollections } from '@/api/modules/knowledge-base';
import type { TAgentKnowledgeAttachment, TAgentKnowledgeMode } from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
	/** New knowledge added from here goes into a collection named after the agent. */
	agentName?: string;
};

const MODES: { value: TAgentKnowledgeMode; label: string }[] = [
	{ value: 'search', label: 'Search' },
	{ value: 'always', label: 'Always' },
];

/** Every agent's exported files are indexed as `artifacts:<agentId>`. Its own
 *  are always searchable, so these are internal and not offered here. */
const isArtifactCollection = (collection: string) => collection.startsWith('artifacts:');

const formatCharacters = (count: number) =>
	count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : `${count}`;

const describe = (attachment: TAgentKnowledgeAttachment) => {
	const usage = attachment.mode === 'always' ? 'In every reply' : 'Searched when relevant';
	if (attachment.synced) return `Synced · ${usage}`;
	if (attachment.documents === 0) return `${usage} · Nothing added yet`;
	const documents = `${attachment.documents} ${attachment.documents === 1 ? 'document' : 'documents'}`;
	return `${usage} · ${documents} · ${formatCharacters(attachment.characters)} characters`;
};

/**
 * Everything this agent knows, from the workspace knowledge base. Each
 * attached collection is searched when relevant or included in every reply;
 * synced web pages and apps can only be searched. With nothing attached the
 * backend lets it search every collection in the workspace. See
 * AgentKnowledgeController, SkillInjector and ToolRegistry::knowledgeTools().
 */
const AgentKnowledgePanel = ({ ws, agentId, agentName }: TProps) => {
	const navigate = useNavigate();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const { data: knowledge } = useAgentKnowledge(ws, agentId ?? '');
	const { data: collections } = useKnowledgeCollections(ws);
	const attachMutation = useAttachAgentKnowledge(ws, agentId ?? '');
	const updateModeMutation = useUpdateAgentKnowledgeMode(ws, agentId ?? '');
	const detachMutation = useDetachAgentKnowledge(ws, agentId ?? '');

	if (!agentId) return null;

	const attached = knowledge?.attached ?? [];
	const attachedNames = attached.map((attachment) => attachment.collection);
	const always = knowledge?.always;
	const hasAlways = attached.some((attachment) => attachment.mode === 'always');
	const chunkCounts = new Map(
		(collections ?? [])
			.filter((row) => !row.private)
			.map((row) => [row.collection, row.chunks_count]),
	);
	const available = (knowledge?.available ?? []).filter(
		(collection) => !isArtifactCollection(collection),
	);
	const query = searchQuery.trim().toLowerCase();
	const matching = available.filter((collection) => collection.toLowerCase().includes(query));
	const isBusy =
		attachMutation.isPending || updateModeMutation.isPending || detachMutation.isPending;

	const chunksLabel = (collection: string) => {
		const count = chunkCounts.get(collection);
		return count === undefined ? '' : `${count} ${count === 1 ? 'chunk' : 'chunks'}`;
	};

	const usedPercent = always?.budget ? Math.min(100, (always.used / always.budget) * 100) : 0;

	return (
		<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex items-center justify-between gap-2'>
				<div className='flex items-center gap-2'>
					<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
						<Library size={14} />
					</div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Knowledge</h4>
				</div>
				<div className='flex items-center gap-1.5'>
					<button
						onClick={() => setIsAddOpen(true)}
						className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						<FilePlus2 size={10} />
						<span>New</span>
					</button>
					<button
						onClick={() => {
							setSearchQuery('');
							setIsPickerOpen(true);
						}}
						className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
						<Plus size={10} />
						<span>Attach</span>
					</button>
				</div>
			</div>

			{attached.length === 0 && (
				<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					{available.length > 0
						? 'Searches all shared knowledge in this workspace. Attach collections to limit it, or to include them in every reply.'
						: 'Add what this agent should know. Search looks it up when relevant; Always puts it in every reply.'}
				</p>
			)}

			{attached.length > 0 && (
				<div className='space-y-2 pl-9'>
					{attached.map((attachment) => (
						<div
							key={attachment.collection}
							className='flex items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800/80'>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
									<Library size={15} />
								</div>
								<div className='flex min-w-0 flex-col'>
									<span className='truncate text-xs font-black text-zinc-800 dark:text-zinc-200'>
										{attachment.collection}
									</span>
									<span className='mt-0.5 truncate text-[10px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
										{describe(attachment)}
									</span>
								</div>
							</div>
							<div className='flex shrink-0 items-center gap-1.5'>
								<div
									role='radiogroup'
									aria-label={`How ${attachment.collection} is used`}
									title={
										attachment.synced
											? 'Synced web pages and apps can only be searched.'
											: undefined
									}
									className='flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800'>
									{MODES.map((mode) => (
										<button
											key={mode.value}
											type='button'
											role='radio'
											aria-checked={attachment.mode === mode.value}
											disabled={
												isBusy ||
												(attachment.synced && mode.value === 'always')
											}
											onClick={() =>
												attachment.mode !== mode.value &&
												updateModeMutation.mutate({
													collection: attachment.collection,
													mode: mode.value,
												})
											}
											className={`min-h-7 cursor-pointer rounded-md px-2 text-[10.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
												attachment.mode === mode.value
													? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white'
													: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
											}`}>
											{mode.label}
										</button>
									))}
								</div>
								<button
									onClick={() => detachMutation.mutate(attachment.collection)}
									disabled={isBusy}
									title='Detach'
									aria-label={`Detach ${attachment.collection}`}
									className='cursor-pointer p-1 text-zinc-400 hover:text-red-500 disabled:opacity-50 dark:hover:text-red-400'>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{hasAlways && always && (
				<div className='space-y-1.5 pl-9'>
					<div className='flex items-center justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						<span>Included in every reply</span>
						<span>
							{formatCharacters(always.used)} of {formatCharacters(always.budget)}{' '}
							characters
						</span>
					</div>
					<div className='h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800'>
						<div
							className={`h-full rounded-full ${always.skipped.length > 0 ? 'bg-amber-500' : 'bg-primary-500'}`}
							style={{ width: `${usedPercent}%` }}
						/>
					</div>
					{always.skipped.length > 0 && (
						<p className='flex items-start gap-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400'>
							<AlertTriangle size={11} className='mt-px shrink-0' />
							<span>
								{always.skipped.length === 1
									? "1 document doesn't fit and is left out"
									: `${always.skipped.length} documents don't fit and are left out`}
								:{' '}
								{always.skipped
									.map((document) => document.source ?? document.collection)
									.join(', ')}
								. Switch a collection to Search to make room.
							</span>
						</p>
					)}
				</div>
			)}

			<AgentSideDrawer
				isOpen={isPickerOpen}
				title='Attach knowledge'
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
						const isAttached = attachedNames.includes(collection);
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
											: attachMutation.mutate({ collection })
									}
								/>
							</div>
						);
					})}
					{matching.length === 0 && (
						<div className='py-8 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500'>
							{query
								? `Nothing matches "${searchQuery}"`
								: 'No shared knowledge in this workspace yet.'}
						</div>
					)}
				</div>
			</AgentSideDrawer>

			<AddKnowledgeDialog
				ws={ws}
				isOpen={isAddOpen}
				defaultCollection={slugify(agentName ?? '') || undefined}
				sharedOnly
				onAdded={({ collection, synced }) =>
					attachMutation.mutate({
						collection,
						// Keeps how an already attached collection is used. New text and
						// files are included in every reply; synced content is searched.
						mode: attachedNames.includes(collection)
							? undefined
							: synced
								? 'search'
								: 'always',
					})
				}
				onClose={() => setIsAddOpen(false)}
			/>
		</div>
	);
};

export default AgentKnowledgePanel;
