import Aside, { AsideBody } from '@/components/layout/Aside';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav from '@/components/layout/Navigation/Nav';
import Tooltip from '@/components/ui/Tooltip';
import classNames from 'classnames';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import NavSectionsPart from '@/templates/asides/_parts/NavSections.part';
import { coreAppNavigation } from '@/Routes/navigation';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import GlobalSearch from '@/templates/search/GlobalSearch.template';

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
					'group hover:border-primary-300 dark:hover:border-primary-400/25 relative mb-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-300 dark:shadow-xl dark:shadow-black/10 dark:hover:bg-white/[0.07] dark:hover:text-white',
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

const CoreAppAsideTemplate = () => {
	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<Search />
				<Nav>
					<NavSectionsPart sections={coreAppNavigation} />
				</Nav>
			</AsideBody>
			<AsideFooterPart />
			<GlobalSearch />
		</Aside>
	);
};

export default CoreAppAsideTemplate;
