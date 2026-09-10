import { useMemo } from 'react';
import { AlertTriangle, PackageOpen } from 'lucide-react';
import { useCustomNodes } from '@/api/modules/node-types';
import { mapApiNodeToDefinition } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { NodeRow, PanelLoader, RetryButton, StateMessage } from './LibraryItems.partial';

type Props = {
	workspaceId: string;
	onAdd: (node: TNodeDefinition) => void;
};

const CustomNodesPanel = ({ workspaceId, onAdd }: Props) => {
	const { data, isLoading, isError, refetch } = useCustomNodes(workspaceId);
	const nodes = useMemo(
		() => (data?.nodes ?? []).map((node) => mapApiNodeToDefinition(node)),
		[data],
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
		return <StateMessage icon={<PackageOpen size={20} />} title='No custom nodes yet' />;
	}

	return (
		<div className='space-y-1 px-4 pb-4'>
			{nodes.map((node) => (
				<NodeRow key={node.key} node={node} onAdd={onAdd} />
			))}
		</div>
	);
};

export default CustomNodesPanel;
