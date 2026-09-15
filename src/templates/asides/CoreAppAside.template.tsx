import { useMemo } from 'react';
import Aside, { AsideBody } from '@/components/layout/Aside';
import { useParams } from 'react-router';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav, { NavCollapse, NavItem, NavTitle } from '@/components/layout/Navigation/Nav';
import pages, { TPages } from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
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

	return !asideStatus ? (
		<Button
			icon='Search01'
			variant='outline'
			color='zinc'
			className='mb-4 !h-[44px] w-full !text-zinc-500'
			onClick={open}
			aria-label='Search'
		/>
	) : (
		<FieldWrap
			firstSuffix={<Icon icon='Search01' className='text-zinc-500' />}
			lastSuffix={<span className='text-zinc-500'>⌘K</span>}>
			<Input
				name='search'
				placeholder='Search'
				type='search'
				className='mb-4 !border-zinc-500/25 transition-all duration-300 ease-in-out hover:!border-zinc-500/50'
				value=''
				onClick={open}
				onChange={() => {}}
			/>
		</FieldWrap>
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
					<NavCollapse
						{...workspacePages.dashboard}
						to={resolvePath(workspacePages.dashboard.to)}>
						{Object.values(workspacePages.dashboard.subPages as TPages).map((item) => (
							<NavItem key={item.id} {...item} to={resolvePath(item.to)} />
						))}
					</NavCollapse>

					<NavTitle>Workspace</NavTitle>
					{workspaceNavOrder.map((id) => {
						const item = workspacePages[id];
						if (!item) return null;
						return <NavItem key={item.id} {...item} to={resolvePath(item.to)} />;
					})}
				</Nav>
			</AsideBody>
			<AsideFooterPart />
			<GlobalSearch />
		</Aside>
	);
};

export default CoreAppAsideTemplate;
