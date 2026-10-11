import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppWindow, GitMerge, Loader2, Search } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useWorkflows } from '@/api/modules/workflows';
import { useCreateWorkflowPage } from '@/api/modules/workflow-pages';
import paths from '@/Routes/paths';

type Props = {
	ws: string;
	isOpen: boolean;
	onClose: () => void;
	/** Opened from a workflow: that workflow is picked already. */
	workflowId?: string;
};

/**
 * Picks the workflow a new page runs. The server lays the page out from the
 * workflow's inputs and outputs, then the builder opens on it.
 */
const CreatePageModal = ({ ws, isOpen, onClose, workflowId }: Props) => {
	const navigate = useNavigate();
	const { data: workflows, isLoading } = useWorkflows(ws);
	const create = useCreateWorkflowPage(ws);
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<string | null>(workflowId ?? null);
	const [name, setName] = useState('');

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return (workflows ?? []).filter((workflow) => !q || workflow.name.toLowerCase().includes(q));
	}, [workflows, query]);

	const submit = () => {
		if (!selected) return;
		create.mutate(
			{ workflow_id: selected, name: name.trim() || undefined },
			{ onSuccess: (page) => navigate(paths.editPage(ws, page.id)) },
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex size-9 items-center justify-center rounded-xl'>
						<AppWindow size={16} />
					</div>
					<div>
						<p className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>New page</p>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							A form and a result, so anyone can use a workflow without opening it.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div>
						<p className='mb-2 text-xs font-bold text-zinc-700 dark:text-zinc-300'>Which workflow does it run?</p>
						<div className='relative mb-2'>
							<Search size={14} className='absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400' />
							<input
								type='search'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder='Search workflows…'
								aria-label='Search workflows'
								className='focus:border-primary-500 h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-xs outline-none dark:border-white/10 dark:bg-zinc-900'
							/>
						</div>
						<div role='listbox' aria-label='Workflows' className='max-h-64 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-1.5 dark:border-white/10'>
							{isLoading ? (
								<p className='p-3 text-xs text-zinc-400'>Loading workflows…</p>
							) : filtered.length === 0 ? (
								<p className='p-3 text-xs text-zinc-400'>No workflows match.</p>
							) : (
								filtered.map((workflow) => {
									const active = workflow.id === selected;
									return (
										<button
											key={workflow.id}
											type='button'
											role='option'
											aria-selected={active}
											onClick={() => setSelected(workflow.id)}
											className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
												active
													? 'bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-100'
													: 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
											}`}>
											<GitMerge size={14} className='shrink-0 opacity-60' />
											<span className='min-w-0 flex-1 truncate text-xs font-semibold'>{workflow.name}</span>
											{workflow.status !== 'published' && (
												<span className='shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'>
													Not published
												</span>
											)}
										</button>
									);
								})
							)}
						</div>
					</div>
					<label className='block'>
						<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>Page name</span>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Defaults to the workflow’s name'
							maxLength={120}
							className='focus:border-primary-500 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-zinc-900'
						/>
					</label>
					<div className='flex justify-end gap-2 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
							Cancel
						</button>
						<button
							type='button'
							onClick={submit}
							disabled={!selected || create.isPending}
							className='bg-primary-400 text-primary-950 flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'>
							{create.isPending && <Loader2 size={14} className='animate-spin' />}
							Create and open builder
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default CreatePageModal;
