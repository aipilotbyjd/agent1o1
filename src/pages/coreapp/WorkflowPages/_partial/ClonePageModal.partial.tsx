import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Copy, Loader2 } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useWorkflows } from '@/api/modules/workflows';
import { useWorkspaces } from '@/api/modules/workspaces';
import { useCloneWorkflowPage } from '@/api/modules/workflow-pages';
import type { TWorkflowPage } from '@/types/workflow-page.type';
import paths from '@/Routes/paths';

type Props = {
	ws: string;
	page: TWorkflowPage;
	isOpen: boolean;
	onClose: () => void;
};

/** Roles that can build pages (`page.manage` on the server). */
const CAN_BUILD = new Set(['owner', 'admin', 'editor']);

const field =
	'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-primary-500 dark:border-white/10 dark:bg-zinc-900 dark:text-white';

/**
 * Copies a page into another workspace. A page always runs a workflow, so
 * the copy is wired to one of the target workspace's: its inputs and
 * outputs are matched by name, and the rest of the layout comes along.
 */
const ClonePageModal = ({ ws, page, isOpen, onClose }: Props) => {
	const navigate = useNavigate();
	const { data: workspaces } = useWorkspaces({ enabled: isOpen });
	const [targetId, setTargetId] = useState(ws);
	const [workflowId, setWorkflowId] = useState('');
	const [name, setName] = useState('');
	const { data: workflows, isLoading } = useWorkflows(isOpen ? targetId : '');
	const clone = useCloneWorkflowPage(ws);

	const targets = useMemo(
		() => (workspaces ?? []).filter((workspace) => workspace.role && CAN_BUILD.has(workspace.role)),
		[workspaces],
	);
	const chosenWorkflow = workflowId || (workflows ?? [])[0]?.id || '';

	const submit = () =>
		clone.mutate(
			{ id: page.id, target_workspace_id: targetId, workflow_id: chosenWorkflow, name: name.trim() || undefined },
			{ onSuccess: (copy) => navigate(paths.editPage(targetId, copy.id)) },
		);

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex size-9 items-center justify-center rounded-xl'>
						<Copy size={16} />
					</div>
					<div>
						<p className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Copy to a workspace
						</p>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							“{page.name}” is copied as a draft. Sharing settings stay behind.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<label className='block space-y-1.5'>
						<span className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>Workspace</span>
						<select
							value={targetId}
							onChange={(event) => {
								setTargetId(event.target.value);
								setWorkflowId('');
							}}
							className={field}>
							{targets.map((workspace) => (
								<option key={workspace.id} value={workspace.id}>
									{workspace.name}
									{workspace.id === ws ? ' (this one)' : ''}
								</option>
							))}
						</select>
					</label>
					<label className='block space-y-1.5'>
						<span className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>Workflow it runs there</span>
						<select
							value={chosenWorkflow}
							onChange={(event) => setWorkflowId(event.target.value)}
							disabled={isLoading || (workflows ?? []).length === 0}
							className={field}>
							{(workflows ?? []).map((workflow) => (
								<option key={workflow.id} value={workflow.id}>
									{workflow.name}
								</option>
							))}
						</select>
						{!isLoading && (workflows ?? []).length === 0 && (
							<span className='block text-[11px] text-amber-600 dark:text-amber-400'>
								That workspace has no workflows yet. A page needs one to run.
							</span>
						)}
						<span className='block text-[11px] text-zinc-400'>
							Inputs and outputs are matched by name; any that don’t exist there are dropped.
						</span>
					</label>
					<label className='block space-y-1.5'>
						<span className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>Name</span>
						<input
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder={page.name}
							className={field}
						/>
					</label>
				</div>
				<div className='mt-5 flex justify-end gap-2'>
					<button
						type='button'
						onClick={onClose}
						className='h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
						Cancel
					</button>
					<button
						type='button'
						onClick={submit}
						disabled={!chosenWorkflow || clone.isPending}
						className='bg-primary-400 text-primary-950 flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'>
						{clone.isPending && <Loader2 size={14} className='animate-spin' />}
						Copy and open
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default ClonePageModal;
