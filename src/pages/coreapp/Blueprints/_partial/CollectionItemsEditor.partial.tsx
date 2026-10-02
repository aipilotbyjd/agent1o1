import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Cpu, Loader2, Plus, Trash2, Workflow } from 'lucide-react';
import {
	useAddTemplateCollectionItem,
	useAgentTemplates,
	useRemoveTemplateCollectionItem,
	useReorderTemplateCollectionItems,
	useWorkflowTemplates,
} from '@/api/modules/templates';
import type { TTemplatableType, TTemplateCollection } from '@/types/template.type';

/**
 * The "Included Assets" list of a collection, editable in place: add any
 * workflow or agent template the workspace can see, remove one, or move it
 * up/down. Positions are rewritten 0..n on every move, so a list that came
 * back with gaps or duplicates (items added with an explicit position) is
 * normalised the first time it is reordered.
 */
const CollectionItemsEditor = ({ ws, collection }: { ws: string; collection: TTemplateCollection }) => {
	const items = useMemo(
		() => (collection.items ?? []).slice().sort((a, b) => a.position - b.position),
		[collection.items],
	);

	const { data: workflowTemplates } = useWorkflowTemplates(ws);
	const { data: agentTemplates } = useAgentTemplates(ws);
	const addItem = useAddTemplateCollectionItem(ws, collection.id);
	const removeItem = useRemoveTemplateCollectionItem(ws, collection.id);
	const reorderItems = useReorderTemplateCollectionItems(ws, collection.id);

	const [pick, setPick] = useState('');
	const [removingId, setRemovingId] = useState<string | null>(null);

	const inCollection = useMemo(
		() => new Set(items.map((i) => `${i.templatable_type}:${i.templatable_id}`)),
		[items],
	);
	const available = useMemo(
		() => ({
			workflows: (workflowTemplates ?? []).filter((t) => !inCollection.has(`workflow_template:${t.id}`)),
			agents: (agentTemplates ?? []).filter((t) => !inCollection.has(`agent_template:${t.id}`)),
		}),
		[workflowTemplates, agentTemplates, inCollection],
	);

	const handleAdd = () => {
		if (!pick) return;
		const [type, id] = pick.split(':') as [TTemplatableType, string];
		addItem.mutate(
			{ templatable_type: type, templatable_id: id },
			{ onSuccess: () => setPick('') },
		);
	};

	const move = (index: number, delta: -1 | 1) => {
		const next = items.slice();
		const target = index + delta;
		if (target < 0 || target >= next.length) return;
		[next[index], next[target]] = [next[target], next[index]];
		reorderItems.mutate({ items: next.map((item, position) => ({ id: item.id, position })) });
	};

	const handleRemove = (itemId: string) => {
		setRemovingId(itemId);
		removeItem.mutate(itemId, { onSettled: () => setRemovingId(null) });
	};

	return (
		<div>
			<h3 className='mb-3 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
				Included Assets ({items.length})
			</h3>

			<div className='flex flex-col gap-3'>
				{items.length === 0 && (
					<p className='rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-xs font-semibold text-zinc-400 dark:border-zinc-800'>
						Nothing in this collection yet. Add a template below.
					</p>
				)}
				{items.map((item, idx) => {
					const isAgent = item.templatable_type === 'agent_template';
					const asset = item.templatable;
					const name = asset?.name || (isAgent ? 'Agent' : 'Workflow');
					const color = asset?.color || (isAgent ? '#3B82F6' : '#10B981');
					const desc = asset ? asset.description || '' : 'This template was deleted.';

					return (
						<div
							key={item.id}
							className='group flex gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'>
							<div
								style={{ backgroundColor: `${color}15` }}
								className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-800'>
								{isAgent ? (
									<Cpu className='h-5 w-5' style={{ color }} />
								) : (
									<Workflow className='h-5 w-5' style={{ color }} />
								)}
							</div>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2.5'>
									<h4 className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>{name}</h4>
									<span className='rounded border border-zinc-200/40 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase dark:border-zinc-800 dark:bg-zinc-950'>
										{isAgent ? 'agent' : 'workflow'}
									</span>
								</div>
								<p className='mt-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400'>{desc}</p>
							</div>
							<div className='flex shrink-0 items-start gap-0.5'>
								<button
									type='button'
									aria-label={`Move ${name} up`}
									title='Move up'
									disabled={idx === 0 || reorderItems.isPending}
									onClick={() => move(idx, -1)}
									className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
									<ArrowUp size={13} />
								</button>
								<button
									type='button'
									aria-label={`Move ${name} down`}
									title='Move down'
									disabled={idx === items.length - 1 || reorderItems.isPending}
									onClick={() => move(idx, 1)}
									className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
									<ArrowDown size={13} />
								</button>
								<button
									type='button'
									aria-label={`Remove ${name} from collection`}
									title='Remove from collection'
									disabled={removingId === item.id}
									onClick={() => handleRemove(item.id)}
									className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 dark:hover:bg-rose-950/20'>
									{removingId === item.id ? (
										<Loader2 size={13} className='animate-spin' />
									) : (
										<Trash2 size={13} />
									)}
								</button>
							</div>
						</div>
					);
				})}
			</div>

			<div className='mt-3 flex gap-2'>
				<select
					aria-label='Template to add'
					value={pick}
					onChange={(e) => setPick(e.target.value)}
					className='h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none focus:ring-1 focus:ring-primary-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'>
					<option value=''>Add a template…</option>
					{available.workflows.length > 0 && (
						<optgroup label='Workflow templates'>
							{available.workflows.map((t) => (
								<option key={t.id} value={`workflow_template:${t.id}`}>
									{t.name}
								</option>
							))}
						</optgroup>
					)}
					{available.agents.length > 0 && (
						<optgroup label='Agent templates'>
							{available.agents.map((t) => (
								<option key={t.id} value={`agent_template:${t.id}`}>
									{t.name}
								</option>
							))}
						</optgroup>
					)}
				</select>
				<button
					type='button'
					onClick={handleAdd}
					disabled={!pick || addItem.isPending}
					className='flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 text-xs font-black text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50'>
					{addItem.isPending ? <Loader2 size={12} className='animate-spin' /> : <Plus size={12} />}
					Add
				</button>
			</div>
		</div>
	);
};

export default CollectionItemsEditor;
