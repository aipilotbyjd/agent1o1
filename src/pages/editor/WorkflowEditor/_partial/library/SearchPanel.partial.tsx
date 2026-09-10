import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNodes } from '@/api/modules/node-types';
import { mapApiNodeToDefinition } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { NodeRow, PanelLoader, SectionTitle, StateMessage } from './LibraryItems.partial';

type Props = {
	query: string;
	workspaceId: string;
	onAdd: (node: TNodeDefinition) => void;
};

const SearchPanel = ({ query, workspaceId, onAdd }: Props) => {
	const { data, isFetching } = useNodes(
		{ search: query, workspace_id: workspaceId || undefined },
		query.length > 0,
	);

	const nodes = useMemo(() => (data ?? []).map((node) => mapApiNodeToDefinition(node)), [data]);

	if (isFetching && nodes.length === 0) return <PanelLoader />;

	return (
		<div className='space-y-1 px-5 pb-4'>
			<SectionTitle>Search Results</SectionTitle>
			{nodes.length > 0 ? (
				nodes.map((node) => <NodeRow key={node.key} node={node} onAdd={onAdd} />)
			) : (
				<StateMessage icon={<Search size={20} />} title='No nodes found'>
					<div className='text-xs text-zinc-400 dark:text-zinc-500'>
						Try a different keyword.
					</div>
				</StateMessage>
			)}
		</div>
	);
};

export default SearchPanel;
