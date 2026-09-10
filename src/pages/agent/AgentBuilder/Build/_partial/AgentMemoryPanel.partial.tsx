import { useState } from 'react';
import { Plus, Brain, Trash2, X, Loader2, Users, User } from 'lucide-react';
import {
	useAgentMemories,
	useCreateAgentMemory,
	useDeleteAgentMemory,
	useClearAgentMemories,
} from '@/api/modules/agents';
import type { TAgentMemoryScope } from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
};

const emptyForm = {
	key: '',
	value: '',
	type: 'fact',
	scope: 'agent' as TAgentMemoryScope,
};

/**
 * Manager for an agent's persistent memory — key/value facts recalled across runs.
 * Backed by {agent}/memories — see AgentMemoryController.
 */
const AgentMemoryPanel = ({ ws, agentId }: TProps) => {
	const [scopeFilter, setScopeFilter] = useState<TAgentMemoryScope | undefined>(undefined);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);

	const { data: memories, isLoading } = useAgentMemories(ws, agentId ?? '', scopeFilter);
	const createMutation = useCreateAgentMemory(ws, agentId ?? '');
	const deleteMutation = useDeleteAgentMemory(ws, agentId ?? '');
	const clearMutation = useClearAgentMemories(ws, agentId ?? '');

	const items = memories ?? [];

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to add memory.
			</p>
		);
	}

	const resetForm = () => {
		setForm(emptyForm);
		setIsFormOpen(false);
	};

	const handleSubmit = async () => {
		if (!form.key.trim() || !form.value.trim()) return;
		await createMutation.mutateAsync({
			key: form.key.trim(),
			value: form.value.trim(),
			type: form.type.trim() || 'fact',
			scope: form.scope,
		});
		resetForm();
	};

	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Memory</h4>
					<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						Facts the agent recalls across conversations.
					</p>
				</div>
				<button
					onClick={() => {
						resetForm();
						setIsFormOpen(true);
					}}
					className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Add</span>
				</button>
			</div>

			{/* Scope filter */}
			<div className='flex items-center justify-between'>
				<div className='flex gap-1.5'>
					{([undefined, 'agent', 'user'] as (TAgentMemoryScope | undefined)[]).map((s) => (
						<button
							key={s ?? 'all'}
							type='button'
							onClick={() => setScopeFilter(s)}
							className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
								scopeFilter === s
									? 'bg-primary-400 text-primary-950'
									: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
							}`}>
							{s ?? 'All'}
						</button>
					))}
				</div>
				{items.length > 0 && (
					<button
						onClick={() => clearMutation.mutate(scopeFilter)}
						className='text-[10px] font-bold text-zinc-400 hover:text-rose-500'>
						Clear all
					</button>
				)}
			</div>

			{/* Form */}
			{isFormOpen && (
				<div className='space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='flex items-center justify-between'>
						<span className='text-[11px] font-black text-zinc-700 dark:text-zinc-300'>New memory</span>
						<button onClick={resetForm} className='text-zinc-400 hover:text-zinc-600'>
							<X size={13} />
						</button>
					</div>
					<div className='flex gap-1.5'>
						{(['agent', 'user'] as TAgentMemoryScope[]).map((s) => (
							<button
								key={s}
								type='button'
								onClick={() => setForm((f) => ({ ...f, scope: s }))}
								className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
									form.scope === s
										? 'bg-primary-400 text-primary-950'
										: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
								}`}>
								{s === 'agent' ? <Users size={10} /> : <User size={10} />}
								{s}
							</button>
						))}
					</div>
					<input
						type='text'
						value={form.key}
						onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
						placeholder='Key (e.g. preferred_tone)'
						className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<textarea
						value={form.value}
						onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
						placeholder='Value'
						rows={3}
						className='w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<div className='flex justify-end gap-2'>
						<button
							onClick={resetForm}
							className='rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={createMutation.isPending || !form.key.trim() || !form.value.trim()}
							className='flex items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
							{createMutation.isPending && <Loader2 size={11} className='animate-spin' />}
							Save
						</button>
					</div>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No memories yet.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((memory) => (
						<div
							key={memory.id}
							className='flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
							<div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Brain size={13} />
							</div>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<span className='truncate font-mono text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
										{memory.key}
									</span>
									<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-500 dark:bg-zinc-800'>
										{memory.user_id === null ? 'agent' : 'user'}
									</span>
								</div>
								<p className='mt-0.5 line-clamp-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
									{memory.value}
								</p>
							</div>
							<button
								onClick={() => deleteMutation.mutate(memory.id)}
								title='Delete'
								className='shrink-0 text-zinc-400 hover:text-rose-500'>
								<Trash2 size={12} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AgentMemoryPanel;
