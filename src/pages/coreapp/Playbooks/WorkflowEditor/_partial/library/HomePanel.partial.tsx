import { useMemo, useState } from 'react';
import { AlertTriangle, PackageOpen } from 'lucide-react';
import { useNodeCategories } from '@/api/modules/catalog';
import { useNodes, useRecentlyUsedNodes } from '@/api/modules/nodes';
import {
	appVendors,
	groupAppsBySection,
	mapApiCategoriesToGroups,
	mapApiNodeToDefinition,
	isListed,
} from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { useConnectedApps } from '../../_hooks/useConnectedApps.hook';
import { useCollapsedAppSections } from '../../_hooks/useCollapsedAppSections.hook';
import { usePinnedApps } from '../../_hooks/usePinnedApps.hook';
import {
	AppCard,
	AppFilterChips,
	AppSection,
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
	const connectedApps = useConnectedApps(workspaceId);
	const { isCollapsed, setCollapsed } = useCollapsedAppSections();
	const { pinned, toggle: togglePin } = usePinnedApps();
	const [appFilter, setAppFilter] = useState('all');

	const recent = useMemo(() => recentlyUsed?.nodes ?? [], [recentlyUsed]);
	const needsFallback = !recentLoading && recent.length === 0;
	const { data: fallbackNodes } = useNodes(needsFallback ? workspaceId : '');

	const groups = useMemo(() => mapApiCategoriesToGroups(categories ?? []), [categories]);
	const coreGroups = useMemo(() => groups.filter((group) => group.kind === 'core'), [groups]);
	const appGroups = useMemo(() => groups.filter((group) => group.kind === 'app'), [groups]);
	const appSections = useMemo(() => groupAppsBySection(appGroups), [appGroups]);
	const connectedList = useMemo(
		() => appGroups.filter((group) => connectedApps.has(group.slug)),
		[appGroups, connectedApps],
	);
	/** What the user has connected plus what they starred, so a favourite is one tap away before it is connected. */
	const yourApps = useMemo(
		() =>
			appGroups.filter(
				(group) => connectedApps.has(group.slug) || pinned.includes(group.slug),
			),
		[appGroups, connectedApps, pinned],
	);
	const vendors = useMemo(() => appVendors(appGroups), [appGroups]);
	const appChips = useMemo(
		() => [
			{ id: 'all', label: 'All' },
			...(connectedList.length > 0 ? [{ id: 'connected', label: 'Connected' }] : []),
			...vendors.map((vendor) => ({ id: `vendor:${vendor.slug}`, label: vendor.label })),
		],
		[connectedList.length, vendors],
	);
	const activeFilter = appChips.some((chip) => chip.id === appFilter) ? appFilter : 'all';
	const filteredApps = useMemo(() => {
		if (activeFilter === 'connected') return connectedList;
		if (activeFilter.startsWith('vendor:')) {
			return appGroups.filter((group) => `vendor:${group.vendor?.slug}` === activeFilter);
		}
		return [];
	}, [activeFilter, appGroups, connectedList]);
	const filteredTitle =
		activeFilter === 'connected'
			? 'Connected'
			: `Made by ${vendors.find((vendor) => `vendor:${vendor.slug}` === activeFilter)?.label ?? ''}`;

	const frequent = useMemo(() => {
		const source = recent.length > 0 ? recent : (fallbackNodes ?? []);
		return source
			.map((node) => mapApiNodeToDefinition(node))
			.filter(isListed)
			.slice(0, FREQUENT_COUNT);
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
					{appChips.length > 1 && (
						<AppFilterChips
							chips={appChips}
							active={activeFilter}
							onChange={setAppFilter}
						/>
					)}

					{activeFilter !== 'all' ? (
						<>
							<SectionTitle>
								{filteredTitle} · {filteredApps.length}
							</SectionTitle>
							<div className='grid grid-cols-3 gap-2.5'>
								{filteredApps.map((group) => (
									<AppCard
										key={group.id}
										group={group}
										connected={connectedApps.has(group.slug)}
										pinned={pinned.includes(group.slug)}
										onTogglePin={togglePin}
										onSelect={onSelectCategory}
									/>
								))}
							</div>
						</>
					) : (
						<>
							{yourApps.length > 0 && (
								<div className='mb-6'>
									<SectionTitle>Your apps</SectionTitle>
									<div className='grid grid-cols-3 gap-2.5'>
										{yourApps.map((group) => (
											<AppCard
												key={group.id}
												group={group}
												connected={connectedApps.has(group.slug)}
												pinned={pinned.includes(group.slug)}
												onTogglePin={togglePin}
												onSelect={onSelectCategory}
											/>
										))}
									</div>
								</div>
							)}

							<SectionTitle>Browse apps · {appGroups.length}</SectionTitle>
							{appSections.map((section, position) => {
								const collapsed = isCollapsed(section.id, position);

								return (
									<AppSection
										key={section.id}
										section={section}
										collapsed={collapsed}
										connectedApps={connectedApps}
										pinnedApps={pinned}
										onTogglePin={togglePin}
										onToggle={() => setCollapsed(section.id, !collapsed)}
										onSelect={onSelectCategory}
									/>
								);
							})}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default HomePanel;
