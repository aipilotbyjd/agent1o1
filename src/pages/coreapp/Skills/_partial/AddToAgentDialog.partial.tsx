import { useMemo, useState } from 'react';
import { Bot, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { useAgents, AgentSkillAttachmentService } from '@/api/modules/agents';
import { agentSkillAttachmentKeys } from '@/api/modules/agents/agents.keys';
import type { TAgentSkill } from '@/types/agent-skill.type';

interface IAddToAgentDialogProps {
	ws: string;
	skill: TAgentSkill | null;
	onClose: () => void;
}

/** Picks the target agent at click time, so this can't be a plain
 *  `useAttachAgentSkill(ws, agentId)` — that hook needs the agent fixed
 *  up front, not chosen per-row from a searchable list. */
const AddToAgentDialog = ({ ws, skill, onClose }: IAddToAgentDialogProps) => {
	const [search, setSearch] = useState('');
	const { data: agents, isLoading } = useAgents(ws);
	const qc = useQueryClient();
	const attachMutation = useMutation({
		mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
			AgentSkillAttachmentService.attach(ws, agentId, skillId),
		meta: { errorMessage: 'Failed to attach skill' },
	});

	const filteredAgents = useMemo(() => {
		if (!agents) return [];
		return agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
	}, [agents, search]);

	const handleAttach = (agentId: string) => {
		if (!skill) return;
		attachMutation.mutate(
			{ agentId, skillId: skill.id },
			{
				onSuccess: () => {
					qc.invalidateQueries({ queryKey: agentSkillAttachmentKeys.list(ws, agentId) });
					onClose();
				},
			},
		);
	};

	return (
		<Modal isOpen={!!skill} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400'>
						<Bot size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Add to Agent
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							Attach &quot;{skill?.name}&quot; to an agent.
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-3 pt-2'>
					<div className='relative'>
						<Search className='absolute top-2.5 left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500' />
						<input
							type='search'
							placeholder='Search agents...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='block h-9 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-xs font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500'
						/>
					</div>

					<div className='max-h-72 space-y-1.5 overflow-y-auto'>
						{isLoading && (
							<div className='py-6 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								Loading agents…
							</div>
						)}
						{!isLoading && filteredAgents.length === 0 && (
							<div className='py-6 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								No agents found.
							</div>
						)}
						{filteredAgents.map((agent) => (
							<button
								key={agent.id}
								type='button'
								disabled={attachMutation.isPending}
								onClick={() => handleAttach(agent.id)}
								className='flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-primary-500/40 hover:bg-primary-400/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900'>
								<div className='flex items-center gap-2.5'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:text-primary-400'>
										<Bot size={14} />
									</div>
									<div>
										<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
											{agent.name}
										</p>
										<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
											{agent.model ?? 'No model set'}
										</p>
									</div>
								</div>
								<span className='text-[10px] font-black tracking-wider text-primary-600 uppercase dark:text-primary-400'>
									Add
								</span>
							</button>
						))}
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default AddToAgentDialog;
