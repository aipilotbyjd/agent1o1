import Aside, { AsideBody } from '@/components/layout/Aside';
import { useLocation } from 'react-router';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav, { NavItem, NavTitle } from '@/components/layout/Navigation/Nav';
import pages from '@/Routes/pages';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import classNames from 'classnames';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import GlobalSearch from '@/templates/search/GlobalSearch.template';

const SearchBar = () => {
	const { asideStatus } = useAsideStatus();
	const { open } = useGlobalSearchStore();

	return (
		<>
			{!asideStatus && (
				<Button
					icon='Search01'
					variant='outline'
					color='zinc'
					rounded='rounded-xl'
					className='mb-4 !h-[48px] w-full border-zinc-200/50 !text-zinc-400 shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-zinc-300/80 hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] dark:border-border-main dark:!text-white dark:shadow-none'
					onClick={open}
					aria-label='Search'
				/>
			)}
			<FieldWrap
				className={classNames({ hidden: !asideStatus })}
				firstSuffix={
					<Icon
						icon='Search01'
						className='ms-1 text-lg text-zinc-400 dark:!text-white'
					/>
				}
				lastSuffix={
					<span className='me-1 rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 font-sans text-[10px] font-bold text-zinc-400 shadow-2xs dark:border-border-main dark:bg-zinc-950/40 dark:!text-white'>
						⌘K
					</span>
				}>
				<Input
					name='search'
					placeholder='Search workspace'
					type='search'
					dimension='default'
					rounded='rounded-xl'
					className='mb-4 border border-zinc-200/50 !bg-white shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-zinc-300/80 hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] dark:border-border-main dark:!bg-bg-card dark:shadow-none dark:placeholder:!text-white dark:!text-white'
					value=''
					onClick={open}
					onChange={() => {}}
				/>
			</FieldWrap>
			<GlobalSearch />
		</>
	);
};

const AppAsideTemplate = () => {
	const location = useLocation();
	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<SearchBar />
				<Nav>
					<NavTitle>MENU</NavTitle>
					<NavItem
						{...pages.app.subPages.dashboard}
						isActiveOverwrite={location.pathname.startsWith('/dashboard')}
					/>
					<NavItem
						{...pages.app.subPages.workflows}
						isActiveOverwrite={
							location.pathname === '/workflows-list' ||
							location.pathname.startsWith('/workflows')
						}
					/>
					<NavItem {...pages.app.subPages.agents} />
					<NavItem {...pages.app.subPages.skills} />
					<NavItem {...pages.app.subPages.apps} />
					<NavItem
						{...pages.app.subPages.templates}
						isActiveOverwrite={location.pathname.startsWith('/templates')}
					/>
					<NavItem {...pages.app.subPages.artifacts} />
					<NavItem {...pages.app.subPages.history} />

					<NavTitle className='mt-4'>SHORTCUTS</NavTitle>
					<NavItem
						icon='Settings01'
						to='/settings/profile'
						text='Settings'
						isActiveOverwrite={location.pathname.startsWith('/settings')}
					/>
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default AppAsideTemplate;
