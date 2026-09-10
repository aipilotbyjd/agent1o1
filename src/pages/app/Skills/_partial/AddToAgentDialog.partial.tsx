import { useMemo, useState } from 'react';
import { Bot, Search } from 'lucide-react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { useAgents, useAttachAgentSkill } from '@/api/modules/agents';
import type { TAgentSkill } from '@/types/agent.type';

interface AddToAgentDialogProps {
	ws: string;
	skill: TAgentSkill | null;
	onClose: () => void;
}

const AddToAgentDialog = ({ ws, skill, onClose }: AddToAgentDialogProps) => {
	const [search, setSearch] = useState('');
	const { data: agents, isLoading } = useAgents(ws);
	const attachMutation = useAttachAgentSkill(ws);

	const filteredAgents = useMemo(() => {
		if (!agents) return [];
		return agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
	}, [agents, search]);

	const handleAttach = (agentId: string) => {
		if (!skill) return;
		attachMutation.mutate(
			{ agentId, skillId: skill.id },
			{
				onSuccess: () => onClose(),
			},
		);
	};

	return (
		<Modal isOpen={!!skill} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
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
						<Search className='absolute top-2.5 left-3 h-4 w-4 text-slate-400 dark:text-zinc-500' />
						<input
							type='search'
							placeholder='Search agents...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='dark:placeholder:text-zinc-500 block h-9 w-full rounded-xl border border-border-main bg-bg-card pr-3 pl-9 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
						/>
					</div>

					<div className='max-h-72 space-y-1.5 overflow-y-auto'>
						{isLoading && (
							<div className='py-6 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500'>
								Loading agents…
							</div>
						)}
						{!isLoading && filteredAgents.length === 0 && (
							<div className='py-6 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500'>
								No agents found.
							</div>
						)}
						{filteredAgents.map((agent) => (
							<button
								key={agent.id}
								type='button'
								disabled={attachMutation.isPending}
								onClick={() => handleAttach(agent.id)}
								className='flex w-full cursor-pointer items-center justify-between rounded-xl border border-border-main bg-bg-card px-3 py-2.5 text-left transition-colors hover:border-primary-500/40 hover:bg-primary-400/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-main dark:bg-bg-card'>
								<div className='flex items-center gap-2.5'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:text-primary-400'>
										<Bot size={14} />
									</div>
									<div>
										<p className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
											{agent.name}
										</p>
										<p className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											{agent.model}
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
