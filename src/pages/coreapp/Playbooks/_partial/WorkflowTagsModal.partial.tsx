import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, X, Check, Loader2, Plus } from 'lucide-react';
import { useSyncWorkflowTags } from '@/api/modules/workflows';
import { useTags, useCreateTag } from '@/api/modules/tags';
import type { TTag } from '@/types/tag.type';

type TProps = {
	ws: string;
	workflowId: string;
	workflowTitle: string;
	/** From the workflows list — the only read that carries tags. */
	attached: TTag[];
	onClose: () => void;
};

/**
 * Tag editor for one workflow. Tags are workspace-level records, so this
 * toggles existing ones on and off (and can mint a new one); every change
 * syncs the whole id set at once, which is what {workflow}/tags expects.
 */
const WorkflowTagsModal = ({ ws, workflowId, workflowTitle, attached, onClose }: TProps) => {
	const [newTagName, setNewTagName] = useState('');

	const { data: workspaceTags, isLoading } = useTags(ws);
	const syncMutation = useSyncWorkflowTags(ws, workflowId);
	const createMutation = useCreateTag(ws);

	// Ids arrive as numbers from Laravel but are typed string — compare as strings.
	const attachedIds = attached.map((tag) => String(tag.id));
	const isBusy = syncMutation.isPending || createMutation.isPending;

	const sync = (ids: string[]) => syncMutation.mutate({ tag_ids: ids });

	const toggle = (id: string) =>
		sync(
			attachedIds.includes(id)
				? attachedIds.filter((attachedId) => attachedId !== id)
				: [...attachedIds, id],
		);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		const name = newTagName.trim();
		if (!name) return;
		const created = await createMutation.mutateAsync({ name });
		sync([...attachedIds, String(created.id)]);
		setNewTagName('');
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-md'
			onClick={onClose}>
			<motion.div
				initial={{ scale: 0.95, y: 15 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.95, y: 15 }}
				transition={{ duration: 0.2 }}
				className='relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/95'
				onClick={(e) => e.stopPropagation()}>
				<button
					aria-label='Close tags dialog'
					onClick={onClose}
					className='hover:text-slate-655 dark:text-zinc-550 absolute top-4.5 right-4.5 text-slate-400 transition dark:hover:text-zinc-300'>
					<X size={18} />
				</button>
				<h3 className='flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
					<Tag className='text-primary-600 h-5 w-5' /> Tags
					{syncMutation.isPending && (
						<Loader2 size={14} className='animate-spin text-slate-400' />
					)}
				</h3>
				<p className='mt-1 mb-5 truncate text-xs font-semibold text-slate-500 dark:text-zinc-400'>
					{workflowTitle}
				</p>

				<p className='mb-2.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
					Workspace tags
				</p>
				{isLoading ? (
					<div className='flex items-center gap-2 py-2 text-xs font-semibold text-slate-400'>
						<Loader2 size={13} className='animate-spin' /> Loading tags...
					</div>
				) : (workspaceTags ?? []).length === 0 ? (
					<p className='py-2 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
						No tags in this workspace yet. Create the first one below.
					</p>
				) : (
					<div className='flex flex-wrap gap-1.5'>
						{(workspaceTags ?? []).map((tag) => {
							const isAttached = attachedIds.includes(String(tag.id));
							return (
								<button
									key={tag.id}
									type='button'
									aria-pressed={isAttached}
									onClick={() => toggle(String(tag.id))}
									disabled={isBusy}
									className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
										isAttached
											? 'border-primary-300 bg-primary-100/60 text-primary-800 dark:border-primary-500/30 dark:bg-primary-950/40 dark:text-primary-300'
											: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700'
									}`}>
									{tag.color && (
										<span
											className='h-1.5 w-1.5 shrink-0 rounded-full'
											style={{ backgroundColor: tag.color }}
										/>
									)}
									{tag.name}
									{isAttached && <Check size={11} />}
								</button>
							);
						})}
					</div>
				)}

				<form
					onSubmit={handleCreate}
					className='mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-zinc-800'>
					<input
						aria-label='New tag name'
						type='text'
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						placeholder='Create a new tag'
						className='border-slate-205 bg-slate-55/50 focus:border-primary-500 focus:ring-primary-500/10 h-9.5 min-w-0 flex-1 rounded-xl border px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:bg-white focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
					/>
					<button
						type='submit'
						disabled={isBusy || !newTagName.trim()}
						className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/10 flex h-9.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r px-4 text-xs font-bold shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'>
						{createMutation.isPending ? (
							<Loader2 size={12} className='animate-spin' />
						) : (
							<Plus size={12} />
						)}
						Add
					</button>
				</form>
			</motion.div>
		</motion.div>
	);
};

export default WorkflowTagsModal;
