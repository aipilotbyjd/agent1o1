import { X } from 'lucide-react';
import { useAssistantMemories, useDeleteAssistantMemory } from '@/api/modules/assistant';

/** What the assistant has remembered about its owner — and a way to make it forget. */
const MemoriesPanelPartial = ({ workspaceId }: { workspaceId: string }) => {
	const { data: memories = [], isLoading } = useAssistantMemories(workspaceId);
	const forget = useDeleteAssistantMemory(workspaceId);

	return (
		<div className='flex flex-col gap-2'>
			<p className='px-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
				What I know about you
			</p>
			{isLoading ? null : memories.length === 0 ? (
				<p className='px-2 text-xs text-zinc-500'>
					{"Nothing yet. Tell me about yourself and I'll remember."}
				</p>
			) : (
				<ul className='flex flex-col gap-1'>
					{memories.map((memory) => (
						<li
							key={memory.id}
							className='group flex items-start gap-2 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'>
							<span className='min-w-0 flex-1'>
								<span className='font-semibold'>
									{memory.key.replace(/_/g, ' ')}:
								</span>{' '}
								{memory.value}
							</span>
							<button
								type='button'
								onClick={() => forget.mutate(memory.id)}
								aria-label='Forget this'
								title='Forget this'
								className='text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100'>
								<X className='h-3.5 w-3.5' />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default MemoriesPanelPartial;
