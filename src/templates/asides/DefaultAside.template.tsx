import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Aside, { AsideBody, AsideQuickContainer, AsideQuickNav } from '@/components/layout/Aside';
import { useLocation, useNavigate } from 'react-router';
import useAsideStatus from '@/hooks/useAsideStatus';
import Icon from '@/components/icon/Icon';
import Nav, {
	NavButton,
	NavCollapse,
	NavItem,
	NavSeparator,
	NavTitle,
} from '@/components/layout/Navigation/Nav';
import pages, { TPage, TPages } from '@/Routes/pages';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import classNames from 'classnames';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import EXAMPLE from '@/examples/_index';

const getFlattenPages = (pages: TPages, parentId?: string): TPage[] => {
	return Object.values(pages).flatMap((page) => {
		const { subPages, ...pageData } = page;
		const currentPage: TPage = { ...pageData, parentId };
		const subPagesArray = subPages ? getFlattenPages(subPages, page.id) : [];
		return [currentPage, ...subPagesArray];
	});
};

const Search = () => {
	const { asideStatus } = useAsideStatus();
	const navigate = useNavigate();
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

	/**
	 * CMD + K open modal
	 */
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				setIsModalOpen(true);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	/**
	 * Auto focus input
	 */
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (isModalOpen) {
			inputRef.current?.focus();
		}
	}, [isModalOpen]);

	/**
	 * Search input
	 */
	const [inputValue, setInputValue] = useState<string>('');
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const flattenDocPages = getFlattenPages(pages.documentation as TPages);
	const flattenExamplesPages = getFlattenPages(pages.examples as TPages);

	const flattenPages = [...flattenDocPages, ...flattenExamplesPages];
	const result = flattenPages.filter((item: TPage) =>
		item.text.toLowerCase().includes(inputValue.toLowerCase()),
	);

	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	/**
	 * Auto fist select
	 */
	useEffect(() => {
		setSelectedIndex(0);
	}, [result.length, isModalOpen]);

	const handleClick = (to: string) => {
		navigate(to);
		setIsModalOpen(false);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => Math.min(prev + 1, result.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => Math.max(prev - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const selectedItem = result[selectedIndex];
			if (selectedItem && selectedItem.to) {
				handleClick(selectedItem.to);
			}
		}
	};

	useEffect(() => {
		if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isModalOpen, selectedIndex, result]);
	return (
		<>
			{!asideStatus && (
				<Button
					icon='Search01'
					variant='outline'
					color='zinc'
					className='mb-4 !h-[44px] w-full !text-zinc-500'
					onClick={() => setIsModalOpen(true)}
					aria-label=''
				/>
			)}
			<FieldWrap
				className={classNames({ hidden: !asideStatus })}
				firstSuffix={<Icon icon='Search01' className='text-zinc-500' />}
				lastSuffix={<span className='text-zinc-500'>⌘K</span>}>
				<Input
					name='search'
					placeholder='Search'
					type='search'
					className='mb-4 !border-zinc-500/25 transition-all duration-300 ease-in-out hover:!border-zinc-500/50'
					value={inputValue}
					onClick={() => setIsModalOpen(true)}
					onChange={() => {}}
				/>
			</FieldWrap>
			<Modal
				isOpen={isModalOpen}
				setIsOpen={setIsModalOpen}
				rounded='rounded-2xl'
				isScrollable>
				<ModalHeader hasCloseButton={false}>
					<FieldWrap
						firstSuffix={<Icon icon='Search01' className='text-zinc-500' />}
						lastSuffix={
							<Badge color='zinc' variant='outline' className='font-mono text-sm'>
								ESC
							</Badge>
						}>
						<Input
							ref={inputRef}
							name='search'
							placeholder='Search'
							type='search'
							value={inputValue}
							onChange={handleInputChange}
							className='w-full'
						/>
					</FieldWrap>
				</ModalHeader>
				<ModalBody className='pt-2'>
					<div className='flex flex-col gap-2'>
						{result.map((item, index) => (
							<button
								key={item.id + index}
								style={{
									padding: '8px',
									// backgroundColor: index === selectedIndex ? '#eee' : '#fff',
									cursor: 'pointer',
								}}
								className={classNames(
									'flex cursor-pointer items-center gap-4 rounded-lg border border-zinc-500/25',
									{
										'outline-2 outline-offset-1 outline-blue-500':
											index === selectedIndex,
									},
								)}
								onMouseEnter={() => setSelectedIndex(index)}
								onClick={() => handleClick(item.to)}>
								<div className='flex grow items-center gap-2'>
									{item.icon && <Icon icon={item.icon} />}
									{item.text}
								</div>
								<div className='text-xs text-zinc-500'>
									{flattenPages.find((i) => i.id === item.parentId)?.text}
								</div>
							</button>
						))}
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<div className='flex items-center gap-1 text-sm'>
							<div className='rounded-lg border border-zinc-500/50 p-1 font-mono text-sm'>
								<Icon icon='ArrowMoveDownLeft' />
							</div>
							<span className='text-zinc-500'>to select</span>
						</div>
						<div className='flex items-center gap-1 text-sm'>
							<div className='rounded-lg border border-zinc-500/50 p-1 font-mono text-sm'>
								<Icon icon='ArrowDown02' />
							</div>
							<div className='rounded-lg border border-zinc-500/50 p-1 font-mono text-sm'>
								<Icon icon='ArrowUp02' />
							</div>
							<span className='text-zinc-500'>to navigate</span>
						</div>
						<div className='flex items-center gap-1 text-sm'>
							<div className='rounded-lg border border-zinc-500/50 p-1 font-mono text-xs'>
								ESC
							</div>
							<span className='text-zinc-500'>to close</span>
						</div>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

const DefaultAsideTemplate = () => {
	const navigate = useNavigate();
	const location = useLocation();

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
		documentation: {
			id: 'documentation',
			title: 'Documentation',
			icon: 'BookBookmark02',
		},
		examples: {
			id: 'examples',
			title: 'Examples',
			icon: 'Star',
		},
	};
	const [activeTab, setActiveTab] = useState<string>(
		localStorage.getItem('bolt_activeTab') || tabs.dashboard.id,
	);
	const handleActiveTab = (id: string) => {
		setActiveTab(id);
		localStorage.setItem('bolt_activeTab', id);

		if (id === tabs.examples.id) navigate(pages.examples.exampleMain.to);
		if (id === tabs.dashboard.id) navigate(pages.apps.sales.to);
	};

	useEffect(() => {
		if ([tabs.examples.id, tabs.documentation.id].includes(location.pathname.split('/')[1])) {
			setActiveTab(location.pathname.split('/')[1]);
			localStorage.setItem('bolt_activeTab', location.pathname.split('/')[1]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname.split('/')[1]]);

	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<Search />
				<AsideQuickContainer>
					{Object.values(tabs).map((tab) => (
						<AsideQuickNav
							key={tab.id}
							icon={tab.icon}
							isActive={activeTab === tab.id}
							onClick={() => handleActiveTab(tab.id)}>
							{tab.title}
						</AsideQuickNav>
					))}
				</AsideQuickContainer>
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
					{[tabs.dashboard.id].includes(activeTab as string) && (
						<>
							<NavTitle>Pages Examples</NavTitle>
							<NavCollapse {...pages.pagesExamples.list}>
								<NavItem {...pages.pagesExamples.list.subPages?.example1} />
								<NavItem {...pages.pagesExamples.list.subPages?.example2} />
							</NavCollapse>
							<NavCollapse {...pages.pagesExamples.grid}>
								<NavItem {...pages.pagesExamples.grid.subPages?.example1} />
							</NavCollapse>
							<NavCollapse {...pages.pagesExamples.edit}>
								<NavItem {...pages.pagesExamples.edit.subPages?.example1} />
								<NavItem {...pages.pagesExamples.edit.subPages?.example2} />
							</NavCollapse>
							<NavItem {...pages.pagesExamples.login} />
							<NavItem {...pages.pagesExamples.signup} />
							<NavItem {...pages.pagesExamples.notFound} />
							<NavItem {...pages.pagesExamples.underConstruction} />
						</>
					)}
					{[tabs.documentation.id].includes(activeTab as string) && (
						<>
							<NavTitle>Documentation</NavTitle>
							<NavCollapse {...pages.documentation.gettingStarted}>
								<NavItem
									{...pages.documentation.gettingStarted.subPages?.installation}
								/>
								<NavItem
									{...pages.documentation.gettingStarted.subPages?.changelog}
								/>
								<NavItem
									{...pages.documentation.gettingStarted.subPages
										?.projectStructure}
								/>
								<NavItem
									{...pages.documentation.gettingStarted.subPages?.pagesConfigure}
								/>
							</NavCollapse>
							<NavCollapse {...pages.documentation.layout}>
								{Object.values(pages.documentation.layout.subPages).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.documentation.content}>
								{Object.values(pages.documentation.content.subPages).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.documentation.baseComponent}>
								{Object.values(pages.documentation.baseComponent.subPages).map(
									(item) => (
										<NavItem key={item.id} {...item}>
											{['blockquote', 'carousel'].includes(item.id) && (
												<Badge variant='soft' className='scale-90'>
													Soon
												</Badge>
											)}
										</NavItem>
									),
								)}
							</NavCollapse>
							<NavCollapse {...pages.documentation.forms}>
								{Object.values(pages.documentation.forms.subPages).map((item) => (
									<NavItem key={item.id} {...item}>
										{['blockquote', 'carousel'].includes(item.id) && (
											<Badge variant='soft' className='scale-90'>
												Soon
											</Badge>
										)}
									</NavItem>
								))}
							</NavCollapse>
							<NavItem {...pages.documentation.icon} />
						</>
					)}
					{[tabs.examples.id].includes(activeTab as string) && (
						<>
							<NavTitle>Examples</NavTitle>
							<NavCollapse {...pages.examples.exampleMain.subPages.dataVisualization}>
								{Object.values(
									pages.examples.exampleMain.subPages.dataVisualization.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.cards}>
								{Object.values(
									pages.examples.exampleMain.subPages.cards.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.overlays}>
								{Object.values(
									pages.examples.exampleMain.subPages.overlays.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.tables}>
								{Object.values(
									pages.examples.exampleMain.subPages.tables.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.forms}>
								{Object.values(
									pages.examples.exampleMain.subPages.forms.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse
								{...pages.examples.exampleMain.subPages.searchAndCommandPalettes}>
								{Object.values(
									pages.examples.exampleMain.subPages.searchAndCommandPalettes
										.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.navigations}>
								{Object.values(
									pages.examples.exampleMain.subPages.navigations.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.pageSections}>
								{Object.values(
									pages.examples.exampleMain.subPages.pageSections.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.contactAndFooters}>
								{Object.values(
									pages.examples.exampleMain.subPages.contactAndFooters.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
							<NavCollapse {...pages.examples.exampleMain.subPages.userInterface}>
								{Object.values(
									pages.examples.exampleMain.subPages.userInterface.subPages,
								).map((item) => (
									<NavItem key={item.id} {...item} />
								))}
							</NavCollapse>
						</>
					)}
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
