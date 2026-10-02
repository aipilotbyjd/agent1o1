import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNodeCategory } from '@/api/modules/catalog';
import { mapApiCategoryToGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { useConnectedApps } from '../../_hooks/useConnectedApps.hook';
import { NodeRow, PanelLoader, RetryButton, StateMessage } from './LibraryItems.partial';

type Props = {
	categoryId: string;
	workspaceId: string;
	onAdd: (node: TNodeDefinition) => void;
};

const CategoryPanel = ({ categoryId, workspaceId, onAdd }: Props) => {
	const { data, isLoading, isError, refetch } = useNodeCategory(categoryId);
	const connectedApps = useConnectedApps(workspaceId);
	// The detail endpoint returns the category and its nodes side by side.
	const group = useMemo(
		() =>
			data
				? mapApiCategoryToGroup({
						...data.category,
						nodes: data.nodes,
						nodes_count: data.nodes_count,
					})
				: null,
		[data],
	);

	const connected = group ? connectedApps.has(group.slug) : false;

	if (isLoading) return <PanelLoader />;

	if (isError) {
		return (
			<StateMessage
				icon={<AlertTriangle size={20} className='text-rose-500' />}
				title='Couldn’t load category'>
				<RetryButton onClick={() => refetch()} />
			</StateMessage>
		);
	}

	if (!group || group.nodes.length === 0) {
		return (
			<div className='py-12 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500'>
				No nodes available in this category.
			</div>
		);
	}

	return (
		<div className='space-y-1 px-4 pb-4'>
			{group.kind === 'app' && (
				<div className='px-1 pb-2 text-[10px] font-black tracking-widest uppercase'>
					<span className={connected ? 'text-emerald-500' : 'text-zinc-400'}>
						{connected ? '● Connected' : '○ Not connected'}
					</span>
					<span className='text-zinc-400'> · {group.nodes.length} nodes</span>
				</div>
			)}
			{group.nodes.map((node) => (
				<NodeRow key={node.key} node={node} onAdd={onAdd} />
			))}
		</div>
	);
};

export default CategoryPanel;
