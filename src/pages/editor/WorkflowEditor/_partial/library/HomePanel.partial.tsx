import { useMemo } from 'react';
import { AlertTriangle, PackageOpen } from 'lucide-react';
import { useNodeCategories, useNodes, useRecentlyUsedNodes } from '@/api/modules/node-types';
import {
	mapApiCategoriesToGroups,
	mapApiNodeToDefinition,
} from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import {
	AppCard,
	CategoryRow,
	FrequentCard,
	PanelLoader,
	RetryButton,
	SectionTitle,
	StateMessage,
} from './LibraryItems.partial';

type Props = {
	workspaceId: string;
	onSelectCategory: (group: TNodeCategoryGroup) => void;
	onAdd: (node: TNodeDefinition) => void;
};

const FREQUENT_COUNT = 6;

const HomePanel = ({ workspaceId, onSelectCategory, onAdd }: Props) => {
	const { data: categories, isLoading, isError, refetch } = useNodeCategories();
	const { data: recentlyUsed, isLoading: recentLoading } = useRecentlyUsedNodes(workspaceId);

	const recent = useMemo(() => recentlyUsed?.nodes ?? [], [recentlyUsed]);
	const needsFallback = !workspaceId || (!recentLoading && recent.length === 0);
	const { data: fallbackNodes } = useNodes({ per_page: FREQUENT_COUNT }, needsFallback);

	const groups = useMemo(() => mapApiCategoriesToGroups(categories ?? []), [categories]);
	const coreGroups = useMemo(() => groups.filter((group) => group.kind === 'core'), [groups]);
	const appGroups = useMemo(() => groups.filter((group) => group.kind === 'app'), [groups]);

	const frequent = useMemo(() => {
		const source = recent.length > 0 ? recent : (fallbackNodes ?? []);
		return source.slice(0, FREQUENT_COUNT).map((node) => mapApiNodeToDefinition(node));
	}, [recent, fallbackNodes]);

	const frequentTitle =
		recent.length === 0
			? 'Popular'
			: recentlyUsed?.is_default
				? 'Start with these'
				: 'Recently Used';

	if (isLoading) return <PanelLoader />;

	if (isError) {
		return (
			<StateMessage
				icon={<AlertTriangle size={20} className='text-rose-500' />}
				title='Couldn’t load nodes'>
				<RetryButton onClick={() => refetch()} />
			</StateMessage>
		);
	}

	if (groups.length === 0) {
		return <StateMessage icon={<PackageOpen size={20} />} title='No nodes available' />;
	}

	return (
		<div className='flex flex-col pb-5'>
			{frequent.length > 0 && (
				<div className='px-5'>
					<SectionTitle>{frequentTitle}</SectionTitle>
					<div className='grid grid-cols-2 gap-3.5'>
						{frequent.map((node) => (
							<FrequentCard key={node.key} node={node} onAdd={onAdd} />
						))}
					</div>
				</div>
			)}

			{coreGroups.length > 0 && (
				<div className='mt-6 px-5'>
					<SectionTitle>Categories</SectionTitle>
					<div className='space-y-1.5'>
						{coreGroups.map((group) => (
							<CategoryRow key={group.id} group={group} onSelect={onSelectCategory} />
						))}
					</div>
				</div>
			)}

			{appGroups.length > 0 && (
				<div className='mt-6 px-5'>
					<SectionTitle>Apps & Integrations</SectionTitle>
					<div className='grid grid-cols-3 gap-2.5'>
						{appGroups.map((group) => (
							<AppCard key={group.id} group={group} onSelect={onSelectCategory} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default HomePanel;
