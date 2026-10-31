import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNodeCategories } from '@/api/modules/catalog';
import { useNodes } from '@/api/modules/nodes';
import {
	isListed,
	mapApiCategoriesToGroups,
	mapApiNodeToDefinition,
	matchApps,
} from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { AppCard, NodeRow, PanelLoader, SectionTitle, StateMessage } from './LibraryItems.partial';
import { useConnectedApps } from '../../_hooks/useConnectedApps.hook';
import { usePinnedApps } from '../../_hooks/usePinnedApps.hook';

type Props = {
	query: string;
	workspaceId: string;
	onAdd: (node: TNodeDefinition) => void;
	onSelectApp: (group: TNodeCategoryGroup) => void;
};

const SearchPanel = ({ query, workspaceId, onAdd, onSelectApp }: Props) => {
	const { data, isFetching } = useNodes(query.length > 0 ? workspaceId : '', { search: query });

	const nodes = useMemo(
		() => (data ?? []).map((node) => mapApiNodeToDefinition(node)).filter(isListed),
		[data],
	);

	const { data: categories } = useNodeCategories();
	const connectedApps = useConnectedApps(workspaceId);
	const { pinned, toggle: togglePin } = usePinnedApps();
	const apps = useMemo(
		() =>
			matchApps(
				mapApiCategoriesToGroups(categories ?? []).filter((group) => group.kind === 'app'),
				query,
			),
		[categories, query],
	);

	if (isFetching && nodes.length === 0 && apps.length === 0) return <PanelLoader />;

	return (
		<div className='space-y-1 px-5 pb-4'>
			{apps.length > 0 && (
				<div className='pb-4'>
					<SectionTitle>Apps</SectionTitle>
					<div className='grid grid-cols-3 gap-2.5'>
						{apps.map((app) => (
							<AppCard
								key={app.id}
								group={app}
								connected={connectedApps.has(app.slug)}
								pinned={pinned.includes(app.slug)}
								onTogglePin={togglePin}
								onSelect={onSelectApp}
							/>
						))}
					</div>
				</div>
			)}
			{(nodes.length > 0 || apps.length === 0) && <SectionTitle>Search Results</SectionTitle>}
			{nodes.length > 0
				? nodes.map((node) => <NodeRow key={node.key} node={node} onAdd={onAdd} />)
				: apps.length === 0 && (
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
