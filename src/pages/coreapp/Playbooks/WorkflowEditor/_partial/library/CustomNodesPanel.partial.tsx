import { useMemo, useState } from 'react';
import { AlertTriangle, Info, PackageOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useCustomNodes, useDeleteNode } from '@/api/modules/nodes';
import { useConfirm } from '@/context/confirm';
import type { TCustomNode } from '@/types/node.type';
import { mapApiNodeToDefinition } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { NodeRow, PanelLoader, RetryButton, StateMessage } from './LibraryItems.partial';
import CustomNodeFormModal from './CustomNodeFormModal.partial';

type Props = {
	workspaceId: string;
	onAdd: (node: TNodeDefinition) => void;
};

// `null` = closed, `'new'` = create, a node = edit that node.
type TFormState = null | 'new' | TCustomNode;

const CustomNodesPanel = ({ workspaceId, onAdd }: Props) => {
	const { data, isLoading, isError, refetch } = useCustomNodes(workspaceId);
	const deleteNode = useDeleteNode(workspaceId);
	const { confirm } = useConfirm();
	const [form, setForm] = useState<TFormState>(null);
	const nodes = useMemo(
		// The service already unwraps `{ nodes }` to the array.
		() => (data ?? []).map((node) => ({ node, definition: mapApiNodeToDefinition(node) })),
		[data],
	);

	const handleDelete = async (node: TCustomNode) => {
		const confirmed = await confirm({
			title: 'Delete custom node',
			confirmText: 'Delete',
			message: `“${node.name}” is removed from the node library. Workflows that already use it keep the step on their canvas.`,
		});
		if (!confirmed) return;
		deleteNode.mutate(node.id, { onSuccess: () => notify.success('Custom node deleted') });
	};

	const modal = form && (
		<CustomNodeFormModal
			workspaceId={workspaceId}
			node={form === 'new' ? undefined : form}
			onClose={() => setForm(null)}
		/>
	);

	if (isLoading) return <PanelLoader />;

	if (isError) {
		return (
			<StateMessage
				icon={<AlertTriangle size={20} className='text-rose-500' />}
				title='Couldn’t load custom nodes'>
				<RetryButton onClick={() => refetch()} />
			</StateMessage>
		);
	}

	if (nodes.length === 0) {
		return (
			<>
				<StateMessage icon={<PackageOpen size={20} />} title='No custom nodes yet'>
					<button
						type='button'
						onClick={() => setForm('new')}
						className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-primary-600 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-primary-400'>
						<Plus size={13} />
						Create a custom node
					</button>
				</StateMessage>
				{modal}
			</>
		);
	}

	return (
		<div className='space-y-1 px-4 pb-4'>
			<div className='mb-2 flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-[11px] leading-snug text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400'>
				<Info size={13} className='mt-px shrink-0 text-zinc-400' />
				<span>
					Custom nodes can be placed and saved, but runs can’t execute them yet — a run stops
					at the first one it reaches.
				</span>
			</div>
			<button
				type='button'
				onClick={() => setForm('new')}
				className='mb-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-600 dark:border-white/10 dark:text-zinc-400 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/[0.07] dark:hover:text-primary-300'>
				<Plus size={13} />
				New custom node
			</button>
			{nodes.map(({ node, definition }) => (
				<div key={node.id} className='group/custom flex items-center gap-1'>
					<div className='min-w-0 flex-1'>
						<NodeRow node={definition} onAdd={onAdd} />
					</div>
					<div className='flex shrink-0 flex-col gap-0.5 transition sm:opacity-0 sm:group-hover/custom:opacity-100 sm:focus-within:opacity-100'>
						<button
							type='button'
							aria-label={`Edit ${node.name}`}
							title='Edit'
							onClick={() => setForm(node)}
							className='flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'>
							<Pencil size={12} />
						</button>
						<button
							type='button'
							aria-label={`Delete ${node.name}`}
							title='Delete'
							disabled={deleteNode.isPending && deleteNode.variables === node.id}
							onClick={() => handleDelete(node)}
							className='flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-rose-500/10'>
							<Trash2 size={12} />
						</button>
					</div>
				</div>
			))}
			{modal}
		</div>
	);
};

export default CustomNodesPanel;
