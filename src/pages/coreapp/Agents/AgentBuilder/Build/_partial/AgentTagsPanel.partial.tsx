import { useState } from 'react';
import { Tag, Plus, X, Loader2, Check } from 'lucide-react';
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

	const { data: agent } = useAgent(ws, agentId ?? '');
	const { data: workspaceTags } = useTags(ws);
	const syncMutation = useSyncAgentTags(ws, agentId ?? '');
	const createMutation = useCreateTag(ws);

	if (!agentId) return null;

	const attached = agent?.tags ?? [];
	// Ids arrive as numbers from Laravel but are typed string — compare as strings.
	const attachedIds = attached.map((tag) => String(tag.id));
	const available = (workspaceTags ?? []).filter(
		(tag) => !attachedIds.includes(String(tag.id)),
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
		<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
						<Tag size={14} />
					</div>
					<div className='flex flex-col'>
						<h3 className='text-sm font-black text-zinc-900 dark:text-white'>Tags</h3>
						<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
							How this agent is grouped and filtered.
						</span>
					</div>
				</div>
				<button
					onClick={() => setIsPickerOpen((v) => !v)}
					className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Add</span>
				</button>
			</div>

			{/* Attached */}
			{attached.length === 0 ? (
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No tags yet.
				</p>
			) : (
				<div className='flex flex-wrap gap-1.5'>
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
								onClick={() => sync(attachedIds.filter((id) => id !== String(tag.id)))}
								disabled={syncMutation.isPending}
								title='Remove tag'
								className='text-zinc-400 hover:text-rose-500 disabled:opacity-50'>
								<X size={10} />
							</button>
						</span>
					))}
				</div>
			)}

			{/* Picker */}
			{isPickerOpen && (
				<div className='space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					{available.length === 0 ? (
						<p className='text-[10px] font-semibold text-zinc-400'>
							Every workspace tag is already attached.
						</p>
					) : (
						<div className='flex flex-wrap gap-1.5'>
							{available.map((tag) => (
								<button
									key={tag.id}
									onClick={() => sync([...attachedIds, String(tag.id)])}
									disabled={syncMutation.isPending}
									className='flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-black text-zinc-600 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
									{tag.color && (
										<span
											className='h-1.5 w-1.5 shrink-0 rounded-full'
											style={{ backgroundColor: tag.color }}
										/>
									)}
									{tag.name}
									<Check size={10} className='text-zinc-300' />
								</button>
							))}
						</div>
					)}

					{/* New tag */}
					<div className='flex items-center gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800'>
						<input
							type='text'
							value={newTagName}
							onChange={(e) => setNewTagName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleCreate();
							}}
							placeholder='Create a new tag'
							className='min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
						/>
						<button
							onClick={handleCreate}
							disabled={createMutation.isPending || !newTagName.trim()}
							className='flex shrink-0 items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
							{createMutation.isPending && <Loader2 size={11} className='animate-spin' />}
							Create
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default AgentTagsPanel;
