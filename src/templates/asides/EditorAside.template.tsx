import Aside, { AsideBody } from '@/components/layout/Aside';
import { useNavigate } from 'react-router';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav, {
	NavButton,
	NavCollapse,
	NavItem,
	NavSeparator,
	NavTitle,
} from '@/components/layout/Navigation/Nav';
import pages from '@/Routes/pages';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import classNames from 'classnames';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import EXAMPLE from '@/examples/_index';
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

const EditorAsideTemplate = () => {
	const navigate = useNavigate();

	const tabs = {
		dashboard: {
			id: 'dashboard',
			title: 'Dashboard',
			icon: 'Home09',
		},
		apps: {
			id: 'apps',
			title: 'Apps',
			icon: 'GridView',
		},
	};
	const activeTab = localStorage.getItem('bolt_activeTab') || tabs.dashboard.id;

	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<SearchBar />
				<Nav>
					{[tabs.dashboard.id].includes(activeTab as string) && (
						<>
							<NavTitle>Dashboards</NavTitle>
							<NavItem {...pages.apps.sales} />
							<NavItem {...pages.apps.customer} />
							<NavItem {...pages.apps.products}>
								<NavButton
									icon='PlusSignCircle'
									title='New'
									onClick={() => navigate(pages.apps.products.subPages.edit.to)}
								/>
							</NavItem>
							<NavItem {...pages.apps.projects} isChildrenNavButtonOverwrite>
								<div className='-mx-2 -my-2'>
									<EXAMPLE.Ui.Dropdown.Snooze />
								</div>
							</NavItem>
							<NavItem {...pages.apps.invoices} />
							<NavItem {...pages.apps.mail}>
								<Badge variant='soft' color='emerald'>
									8
								</Badge>
							</NavItem>
							<NavItem {...pages.apps.chat}>
								<Badge variant='soft'>Soon</Badge>
							</NavItem>
						</>
					)}
					{[tabs.dashboard.id, tabs.apps.id].includes(activeTab as string) && (
						<>
							<NavTitle>Apps</NavTitle>
							<NavCollapse {...pages.apps.sales}>
								<NavItem {...pages.apps.sales} />
								<NavItem {...pages.apps.sales.subPages?.list} />
								<NavItem {...pages.apps.sales.subPages?.view} />
							</NavCollapse>
							<NavCollapse {...pages.apps.customer}>
								<NavItem {...pages.apps.customer} />
								<NavItem {...pages.apps.customer.subPages?.list} />
								<NavItem
									{...pages.apps.customer.subPages?.edit}
									to={`${pages.apps.customer.subPages.edit.to}?customerId=17`}
								/>
								<NavItem
									{...pages.apps.customer.subPages?.view}
									to={`${pages.apps.customer.subPages.view.to}?customerId=17`}
								/>
							</NavCollapse>
							<NavCollapse {...pages.apps.products}>
								<NavItem {...pages.apps.products} />
								<NavItem {...pages.apps.products.subPages?.list} />
								<NavItem {...pages.apps.products.subPages?.edit} />
							</NavCollapse>
							<NavCollapse {...pages.apps.projects}>
								<NavItem {...pages.apps.projects} />
								<NavItem {...pages.apps.projects.subPages?.board} />
								<NavItem {...pages.apps.projects.subPages?.list} />
								<NavItem {...pages.apps.projects.subPages?.grid} />
							</NavCollapse>
							<NavCollapse {...pages.apps.invoices}>
								<NavItem {...pages.apps.invoices} />
								<NavItem {...pages.apps.invoices.subPages?.list} />
								<NavItem
									{...pages.apps.invoices.subPages?.view}
									to={`${pages.apps.invoices.subPages.view.to}?invoiceId=100023`}
								/>
							</NavCollapse>
							<NavCollapse {...pages.apps.mail}>
								<NavItem {...pages.apps.mail} />
								<NavItem
									{...pages.apps.mail.subPages?.new}
									to={`${pages.apps.mail.to}?newMail=true`}
								/>
							</NavCollapse>
							<NavItem {...pages.apps.chat} />
							<NavSeparator />
						</>
					)}
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default EditorAsideTemplate;
