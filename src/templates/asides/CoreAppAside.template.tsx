import { useMemo } from 'react';
import Aside, { AsideBody } from '@/components/layout/Aside';
import { useParams } from 'react-router';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav, { NavItem, NavTitle } from '@/components/layout/Navigation/Nav';
import pages, { TPages } from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import Tooltip from '@/components/ui/Tooltip';
import classNames from 'classnames';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import GlobalSearch from '@/templates/search/GlobalSearch.template';

// Page paths are templates (`/:workspaceId/agents`); id comes from the URL, falling back to workspace context.
const useWorkspacePath = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const id = workspaceId || activeWorkspaceId;

	return useMemo(
		() => (to: string) => (id ? to.replace(':workspaceId', id) : to),
		[id],
	);
};

const Search = () => {
	const { asideStatus } = useAsideStatus();
	const open = () => useGlobalSearchStore.getState().open();

	return (
		<Tooltip text={asideStatus ? '' : 'Search'} placement='right'>
			<button
				type='button'
				title='Search workspace'
				onClick={open}
				className={classNames(
					'group relative mb-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-600 shadow-sm transition hover:border-primary-300 hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-300 dark:shadow-xl dark:shadow-black/10 dark:hover:border-primary-400/25 dark:hover:bg-white/[0.07] dark:hover:text-white',
					asideStatus ? 'px-4' : 'justify-center px-0',
				)}>
				<Icon icon='Search01' className='shrink-0' />
				{asideStatus && (
					<>
						<span className='min-w-0 flex-1 truncate text-left'>Search workspace</span>
						<span className='shrink-0 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold text-zinc-400 dark:border-white/10 dark:bg-black/30 dark:text-zinc-500'>
							⌘K
						</span>
					</>
				)}
			</button>
		</Tooltip>
	);
};

const workspacePages = pages.workspace.subPages as TPages;

/** Rendered under "Workspace", in the order the nav should read. */
const workspaceNavOrder = [
	'playbooks',
	'agents',
	'trail',
	'skills',
	'apps',
	'knowledge',
	'artifacts',
	'blueprints',
	'vault',
] as const;

const CoreAppAsideTemplate = () => {
	const resolvePath = useWorkspacePath();

	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<Search />
				<Nav>
					<NavTitle>Overview</NavTitle>
					<NavItem
						{...workspacePages.dashboard}
						to={resolvePath(workspacePages.dashboard.to)}
					/>

					<NavTitle>Workspace</NavTitle>
					{workspaceNavOrder.map((id) => {
						const item = workspacePages[id];
						if (!item) return null;
						return <NavItem key={item.id} {...item} to={resolvePath(item.to)} />;
					})}

					{/* Settings had no entry point anywhere in the app: the footer's gear
					    is a font-size dropdown, not a link, so the section was reachable
					    only by typing the URL or via global search. */}
					<NavTitle>Account</NavTitle>
					<NavItem
						{...pages.workspaceSettings}
						to={resolvePath(pages.workspaceSettings.to)}
					/>
				</Nav>
			</AsideBody>
			<AsideFooterPart />
			<GlobalSearch />
		</Aside>
	);
};

export default CoreAppAsideTemplate;
