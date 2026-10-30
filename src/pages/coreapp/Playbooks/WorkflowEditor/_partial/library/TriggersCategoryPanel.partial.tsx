import { useMemo, useState } from 'react';
import { useNodeCategories } from '@/api/modules/catalog';
import {
	filterNodes,
	groupNodesByApp,
	mapApiCategoriesToGroups,
} from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { AppFilterChips, NodeGroupHeader, NodeRow, NodeSearchBox } from './LibraryItems.partial';

type Props = {
	group: TNodeCategoryGroup;
	onAdd: (node: TNodeDefinition) => void;
};

/** Everything that can start a flow, filed under its app with a one-tap filter per app, so "Slack triggers" is not buried in 189 rows. */
const TriggersCategoryPanel = ({ group, onAdd }: Props) => {
	const { data: categories } = useNodeCategories();
	const [query, setQuery] = useState('');
	const [appFilter, setAppFilter] = useState('all');

	const labels = useMemo(
		() =>
			new Map(mapApiCategoriesToGroups(categories ?? []).map((app) => [app.slug, app.label])),
		[categories],
	);
	const apps = useMemo(
		() =>
			groupNodesByApp(filterNodes(group.nodes, query), (slug) => labels.get(slug)).filter(
				(app) => app.nodes.length > 0,
			),
		[group.nodes, query, labels],
	);

	const chips = useMemo(
		() => [
			{ id: 'all', label: 'All' },
			...apps.map((app) => ({ id: app.slug, label: `${app.label} ${app.nodes.length}` })),
		],
		[apps],
	);
	const activeFilter = chips.some((chip) => chip.id === appFilter) ? appFilter : 'all';
	const visible = activeFilter === 'all' ? apps : apps.filter((app) => app.slug === activeFilter);

	return (
		<div className='space-y-1 px-4 pb-4'>
			<NodeSearchBox value={query} onChange={setQuery} placeholder='Search triggers' />

			{chips.length > 2 && (
				<AppFilterChips chips={chips} active={activeFilter} onChange={setAppFilter} />
			)}

			{visible.map((app) => (
				<div key={app.slug}>
					<NodeGroupHeader title={app.label} count={app.nodes.length} />
					{app.nodes.map((node) => (
						<NodeRow key={node.key} node={node} onAdd={onAdd} />
					))}
				</div>
			))}

			{visible.length === 0 && (
				<div className='py-10 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500'>
					No triggers match “{query}”.
				</div>
			)}
		</div>
	);
};

export default TriggersCategoryPanel;
