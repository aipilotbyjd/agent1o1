import { useState } from 'react';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import AgentSideDrawer, { AttachToggle } from './AgentSideDrawer.partial';
import { useAgent, useSyncAgentTags } from '@/api/modules/agents';
import { useTags, useCreateTag } from '@/api/modules/tags';

type TProps = {
	ws: string;
	agentId?: string;
};

/**
 * Tag editor for an agent. Tags are workspace-level records, so this attaches
 * and detaches existing ones (and can mint a new one); it syncs the whole set
 * at once, which is what {agent}/tags expects.
 */
const AgentTagsPanel = ({ ws, agentId }: TProps) => {
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	const { data: agent } = useAgent(ws, agentId ?? '');
	const { data: workspaceTags } = useTags(ws);
	const syncMutation = useSyncAgentTags(ws, agentId ?? '');
	const createMutation = useCreateTag(ws);

	if (!agentId) return null;

	const attached = agent?.tags ?? [];
	// Ids arrive as numbers from Laravel but are typed string — compare as strings.
	const attachedIds = attached.map((tag) => String(tag.id));
	const query = searchQuery.trim().toLowerCase();
	const matchingTags = (workspaceTags ?? []).filter((tag) =>
		tag.name.toLowerCase().includes(query),
	);

	const sync = (ids: string[]) => syncMutation.mutate({ tag_ids: ids });

	const handleCreate = async () => {
		const name = newTagName.trim();
		if (!name) return;
		const created = await createMutation.mutateAsync({ name });
		sync([...attachedIds, String(created.id)]);
		setNewTagName('');
	};

	return (
		<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
						<Tag size={14} />
					</div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Tags</h4>
				</div>
				<button
					onClick={() => {
						setSearchQuery('');
						setIsPickerOpen(true);
					}}
					className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Tag</span>
				</button>
			</div>

			{/* Attached */}
			{attached.length === 0 && (
				<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					Group and filter this agent on the Agents page.
				</p>
			)}

			{attached.length > 0 && (
				<div className='flex flex-wrap gap-1.5 pl-9'>
					{attached.map((tag) => (
						<span
							key={tag.id}
							className='flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
							{tag.color && (
								<span
									className='h-1.5 w-1.5 shrink-0 rounded-full'
									style={{ backgroundColor: tag.color }}
								/>
							)}
							{tag.name}
							<button
								onClick={() =>
									sync(attachedIds.filter((id) => id !== String(tag.id)))
								}
								disabled={syncMutation.isPending}
								title='Remove tag'
								className='text-zinc-400 hover:text-rose-500 disabled:opacity-50'>
								<X size={10} />
							</button>
						</span>
					))}
				</div>
			)}

			<AgentSideDrawer
				isOpen={isPickerOpen}
				title='Add a tag'
				onClose={() => setIsPickerOpen(false)}
				search={{
					value: searchQuery,
					onChange: setSearchQuery,
					placeholder: `Search ${(workspaceTags ?? []).length} tags`,
				}}
				footer={
					<div className='flex items-center gap-2'>
						<input
							type='text'
							value={newTagName}
							onChange={(e) => setNewTagName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleCreate();
							}}
							placeholder='New tag name'
							className='focus:border-primary-500/50 min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-800 outline-none md:min-h-0 md:text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
						/>
						<button
							onClick={handleCreate}
							disabled={createMutation.isPending || !newTagName.trim()}
							className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-black disabled:opacity-50 md:min-h-0'>
							{createMutation.isPending && (
								<Loader2 size={12} className='animate-spin' />
							)}
							Create & add
						</button>
					</div>
				}>
				<h4 className='pl-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase'>
					Workspace tags
				</h4>
				<div className='space-y-1.5'>
					{matchingTags.map((tag) => {
						const isAttached = attachedIds.includes(String(tag.id));
						return (
							<div
								key={tag.id}
								className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40'>
								<div className='flex min-w-0 items-center gap-3'>
									<div
										className='bg-primary-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs'
										style={
											tag.color ? { backgroundColor: tag.color } : undefined
										}>
										<Tag size={16} />
									</div>
									<span className='truncate text-xs font-black text-zinc-900 dark:text-zinc-100'>
										{tag.name}
									</span>
								</div>
								<AttachToggle
									label={tag.name}
									isAttached={isAttached}
									disabled={syncMutation.isPending}
									onClick={() =>
										sync(
											isAttached
												? attachedIds.filter((id) => id !== String(tag.id))
												: [...attachedIds, String(tag.id)],
										)
									}
								/>
							</div>
						);
					})}
					{matchingTags.length === 0 && (
						<div className='py-8 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500'>
							{query
								? `Nothing matches "${searchQuery}"`
								: 'No tags in this workspace yet. Create one below.'}
						</div>
					)}
				</div>
			</AgentSideDrawer>
		</div>
	);
};

export default AgentTagsPanel;
