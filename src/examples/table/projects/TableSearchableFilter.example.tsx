import user, { TUser } from '@/mocks/users.mock';
import { ChangeEvent, useState } from 'react';
import Checkbox from '@/components/form/Checkbox';
import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import EX_Dropdown from '@/examples/ui/dropdown/_index';
import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import TableTemplate, {
	TableCardFooterTemplate,
	TableIndeterminateCheckbox,
} from '@/templates/common/TableParts.template';
import Badge from '@/components/ui/Badge';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Avatar from '@/components/ui/Avatar';
import Progress from '@/components/ui/Progress';
import dayjs from 'dayjs';
import Ratings, { RatingValues } from '@/components/ui/Ratings';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import FieldWrap from '@/components/form/FieldWrap';

interface IProjectProps {
	id: number;
	name: string;
	category: string;
	tags: string[];
	assignee: TUser[];
	progress: number;
	deadline: string;
	rating: number;
}
const projects: IProjectProps[] = [
	{
		id: 1,
		name: 'Website Redesign',
		category: 'Web Development',
		tags: ['React', 'TypeScript', 'UI/UX'],
		assignee: [user.oliviaNovak, user.danielaPetrova],
		progress: 45,
		deadline: '2025-05-15',
		rating: 4,
	},
	{
		id: 2,
		name: 'Mobile App MVP',
		category: 'Mobile App',
		tags: ['Flutter', 'Firebase'],
		assignee: [user.johndoe],
		progress: 30,
		deadline: '2025-06-01',
		rating: 3,
	},
	{
		id: 3,
		name: 'E‑Commerce Integration',
		category: 'E‑commerce',
		tags: ['Node.js', 'Express', 'MongoDB'],
		assignee: [user.aulisTiainen, user.nicolasLefevre, user.johndoe],
		progress: 60,
		deadline: '2025-04-30',
		rating: 5,
	},
	{
		id: 4,
		name: 'SEO Optimization',
		category: 'Marketing',
		tags: ['SEO', 'Content', 'Analytics'],
		assignee: [user.johndoe],
		progress: 80,
		deadline: '2025-05-10',
		rating: 4,
	},
	{
		id: 5,
		name: 'Data Migration',
		category: 'Data Engineering',
		tags: ['ETL', 'Python', 'PostgreSQL'],
		assignee: [user.johndoe],
		progress: 25,
		deadline: '2025-07-01',
		rating: 3,
	},
	{
		id: 6,
		name: 'Dashboard Design',
		category: 'Business Intelligence',
		tags: ['Tableau', 'Data Visualization'],
		assignee: [user.johndoe],
		progress: 50,
		deadline: '2025-05-20',
		rating: 4,
	},
	{
		id: 7,
		name: 'CRM Integration',
		category: 'Integration',
		tags: ['Salesforce', 'API'],
		assignee: [user.johndoe],
		progress: 70,
		deadline: '2025-06-15',
		rating: 5,
	},
	{
		id: 8,
		name: 'Security Audit',
		category: 'Security',
		tags: ['Penetration Testing', 'Audit'],
		assignee: [user.johndoe],
		progress: 90,
		deadline: '2025-04-25',
		rating: 5,
	},
	{
		id: 9,
		name: 'AI Prototype',
		category: 'AI/ML',
		tags: ['Python', 'TensorFlow', 'NLP'],
		assignee: [user.johndoe],
		progress: 15,
		deadline: '2025-08-01',
		rating: 2,
	},
	{
		id: 10,
		name: 'Blog Platform Development',
		category: 'CMS',
		tags: ['Gatsby', 'GraphQL'],
		assignee: [user.johndoe],
		progress: 55,
		deadline: '2025-05-05',
		rating: 4,
	},
	{
		id: 11,
		name: 'IoT Device Integration',
		category: 'IoT',
		tags: ['MQTT', 'Embedded'],
		assignee: [user.johndoe],
		progress: 40,
		deadline: '2025-06-30',
		rating: 3,
	},
	{
		id: 12,
		name: 'Blockchain Experimental App',
		category: 'Blockchain',
		tags: ['Solidity', 'Ethereum'],
		assignee: [user.johndoe],
		progress: 20,
		deadline: '2025-09-01',
		rating: 3,
	},
	{
		id: 13,
		name: 'Social Media Campaign',
		category: 'Digital Marketing',
		tags: ['Facebook Ads', 'Instagram'],
		assignee: [user.johndoe],
		progress: 65,
		deadline: '2025-05-25',
		rating: 4,
	},
	{
		id: 14,
		name: 'Multilingual Support',
		category: 'Localization',
		tags: ['i18n', 'l10n'],
		assignee: [user.johndoe],
		progress: 35,
		deadline: '2025-07-15',
		rating: 3,
	},
	{
		id: 15,
		name: 'Performance Testing',
		category: 'Quality Assurance',
		tags: ['JMeter', 'Load Testing'],
		assignee: [user.johndoe],
		progress: 75,
		deadline: '2025-05-30',
		rating: 5,
	},
];
const columnHelper = createColumnHelper<IProjectProps>();

const TableSearchableFilterExample = () => {
	const [data] = useState(() => [...projects]);

	const columns = [
		columnHelper.display({
			cell: ({ row }) => (
				<TableIndeterminateCheckbox
					// eslint-disable-next-line react/jsx-props-no-spreading
					{...{
						checked: row.getIsSelected(),
						disabled: !row.getCanSelect(),
						indeterminate: row.getIsSomeSelected(),
						onChange: row.getToggleSelectedHandler(),
					}}
				/>
			),
			header: ({ table }) => (
				<TableIndeterminateCheckbox
					// eslint-disable-next-line react/jsx-props-no-spreading
					{...{
						checked: table.getIsAllRowsSelected(),
						indeterminate: table.getIsSomeRowsSelected(),
						onChange: table.getToggleAllRowsSelectedHandler(),
					}}
				/>
			),
			footer: ({ table }) => (
				<TableIndeterminateCheckbox
					// eslint-disable-next-line react/jsx-props-no-spreading
					{...{
						checked: table.getIsAllRowsSelected(),
						indeterminate: table.getIsSomeRowsSelected(),
						onChange: table.getToggleAllRowsSelectedHandler(),
					}}
				/>
			),
			id: 'select',
			meta: {
				className: '!py-0',
			},
		}),
		columnHelper.accessor('name', {
			cell: (info) => (
				<div className='truncate'>
					<div className='font-bold'>{info.getValue()}</div>
					<div className='text-sm text-zinc-500'>{info.row.original.category}</div>
				</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								aria-label='Name'
								variant='link'
								icon='Identification'
								className='!px-0'>
								Name
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='Sorting02'
								onClick={() => handleAction('sortAsc', column.id)}>
								Sort ascending
							</DropdownItem>
							<DropdownItem
								icon='Sorting01'
								onClick={() => handleAction('sortDesc', column.id)}>
								Sort descending
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Name',
		}),
		columnHelper.accessor('tags', {
			cell: (info) => (
				<div className='flex gap-2'>
					{info.getValue().map((item) => (
						<Badge key={item} variant='soft'>
							{item}
						</Badge>
					))}
				</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button aria-label='Tags' variant='link' icon='Tags' className='!px-0'>
								Tags
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Tags',
		}),
		columnHelper.accessor('assignee', {
			cell: (info) => (
				<div className='min-w-32'>
					<AvatarGroup>
						{info.getValue()?.map((item) => (
							<Avatar
								key={item.id}
								color={item.color}
								src={item.image.org}
								name={`${item.firstName} ${item.lastName}`}
								variant='solid'
							/>
						))}
					</AvatarGroup>
				</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								aria-label='Assignee'
								variant='link'
								icon='UserGroup'
								className='!px-0'>
								Assignee
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='Sorting02'
								onClick={() => handleAction('sortAsc', column.id)}>
								Sort ascending
							</DropdownItem>
							<DropdownItem
								icon='Sorting01'
								onClick={() => handleAction('sortDesc', column.id)}>
								Sort descending
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Assignee',
		}),
		columnHelper.accessor('progress', {
			cell: (info) => (
				<div className='w-full'>
					<Progress value={info.getValue()} />
				</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								aria-label='Progress'
								variant='link'
								icon='Progress'
								className='!px-0'>
								Progress
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='Sorting02'
								onClick={() => handleAction('sortAsc', column.id)}>
								Sort ascending
							</DropdownItem>
							<DropdownItem
								icon='Sorting01'
								onClick={() => handleAction('sortDesc', column.id)}>
								Sort descending
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Progress',
		}),
		columnHelper.accessor('deadline', {
			cell: (info) => (
				<div className='truncate'>{dayjs(info.getValue()).format('MMM DD, YYYY')}</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								aria-label='Deadline'
								icon='DateTime'
								variant='link'
								className='!px-0'>
								Deadline
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='Sorting02'
								onClick={() => handleAction('sortAsc', column.id)}>
								Sort ascending
							</DropdownItem>
							<DropdownItem
								icon='Sorting01'
								onClick={() => handleAction('sortDesc', column.id)}>
								Sort descending
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Deadline',
		}),
		columnHelper.accessor('rating', {
			cell: (info) => (
				<div>
					<Ratings
						id={info.row.original.id.toString()}
						selectedRating={Math.round(info.getValue()) as RatingValues}
						setSelectedRating={() => {}}
						type='star'
						isDisable
					/>
				</div>
			),
			header: ({ column }) => {
				return (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								aria-label='Rating'
								variant='link'
								icon='StarHalf'
								className='!px-0'>
								Rating
							</Button>
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								icon='Sorting02'
								onClick={() => handleAction('sortAsc', column.id)}>
								Sort ascending
							</DropdownItem>
							<DropdownItem
								icon='Sorting01'
								onClick={() => handleAction('sortDesc', column.id)}>
								Sort descending
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								icon='TransitionLeft'
								isDisabled={table.getState().columnOrder.indexOf(column.id) === 0}
								onClick={() => handleAction('moveLeft', column.id)}>
								Move Left
							</DropdownItem>
							<DropdownItem
								icon='TransitionRight'
								isDisabled={
									table.getState().columnOrder.indexOf(column.id) ===
									table.getState().columnOrder.length - 1
								}
								onClick={() => handleAction('moveRight', column.id)}>
								Move Right
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem onClick={() => handleAction('delete', column.id)}>
								Hide in view {column.id}
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				);
			},
			footer: () => 'Rating',
		}),
	];

	const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
	const [globalFilter, setGlobalFilter] = useState<string>('');
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		select: true,
		name: true,
		tags: true,
		assignee: true,
		progress: true,
		deadline: true,
		rating: true,
	});
	const [columnOrder, setColumnOrder] = useState<string[]>(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		columns.map((col: any) => col.id ?? (col as any).accessorKey),
	);
	const [rowSelection, setRowSelection] = useState({});

	const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setColumnVisibility((prev) => ({
			...prev,
			[name]: checked,
		}));
	};

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			rowSelection,
			globalFilter,
			columnVisibility,
			columnOrder,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		onColumnOrderChange: setColumnOrder,
		enableRowSelection: true,
		enableGlobalFilter: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: { pageSize: 5 },
			columnOrder,
		},
	});

	const moveColumnRight = (columnId: string) => {
		setColumnOrder((old) => {
			const idx = old.indexOf(columnId);
			if (idx < 0 || idx === old.length - 1) return old;
			const newOrder = [...old];
			newOrder.splice(idx, 1);
			newOrder.splice(idx + 1, 0, columnId);
			return newOrder;
		});
	};
	const moveColumnLeft = (columnId: string) => {
		setColumnOrder((old) => {
			const idx = old.indexOf(columnId);
			if (idx <= 0) return old;
			const newOrder = [...old];
			newOrder.splice(idx, 1);
			newOrder.splice(idx - 1, 0, columnId);
			return newOrder;
		});
	};

	function handleAction(action: string, columnId: string) {
		const column = table.getColumn(columnId); // Table instance'tan kolonu bul

		switch (action) {
			case 'sortAsc':
				column?.toggleSorting(false); // false = ascending
				break;
			case 'sortDesc':
				column?.toggleSorting(true); // true = descending
				break;
			case 'moveRight':
				moveColumnRight(columnId);
				break;
			case 'moveLeft':
				moveColumnLeft(columnId);
				break;
			case 'delete':
				setColumnVisibility((prev) => ({ ...prev, [columnId]: false }));
				break;
		}
	}

	const [searchVisibility, setSearchVisibility] = useState<boolean>(false);
	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'PropertyNew',
							color: 'emerald',
							size: 'text-3xl',
						}}>
						{!searchVisibility && <span>Projects</span>}
						{!searchVisibility && (
							<>
								<div className='h-8 border-s border-zinc-500/25'></div>
								<Button
									aria-label='Search'
									icon='Search01'
									variant='link'
									className='px-0!'
									onClick={() => setSearchVisibility(true)}
								/>
							</>
						)}
						{searchVisibility && (
							<FieldWrap
								firstSuffix={<Icon icon='Search01' />}
								lastSuffix={
									<Button
										aria-label='Clear'
										icon='XVariableCircle'
										className='px-0!'
										color='red'
										onClick={() => {
											setSearchVisibility(false);
											setGlobalFilter('');
										}}
									/>
								}>
								<Input
									dimension='sm'
									name='search'
									value={globalFilter}
									onChange={(e) => setGlobalFilter(e.target.value)}
								/>
							</FieldWrap>
						)}
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<EX_Dropdown.Download />
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button aria-label='Delete' icon='ColumnDelete' variant='link' />
						</DropdownToggle>
						<DropdownMenu>
							<div className='flex items-center'>
								<div className='px-2 text-xl font-bold'>Column visible</div>
							</div>
							<DropdownDivider />
							<div className='-mx-2'>
								<Input
									name='filter'
									variant='underline'
									className='w-full'
									placeholder='Search...'
									dimension='sm'
									type='search'
								/>
							</div>
							<div className='px-2 text-zinc-500'>All column</div>
							<DropdownItem className='gap-2'>
								<Icon icon='CheckmarkSquare01' color='zinc' size='text-xl' />
								<div className=''>Select</div>
								<Icon icon='SquareLock01' color='zinc' />
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='select'
										disabled
										checked={columnVisibility.select}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='Identification' color='blue' size='text-xl' />
								<div className=''>Name</div>
								<Icon icon='SquareLock01' color='zinc' />
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='name'
										disabled
										checked={columnVisibility.name}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='Tags' color='amber' size='text-xl' />
								<div className=''>Tags</div>
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='tags'
										checked={columnVisibility.tags}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='UserGroup' color='emerald' size='text-xl' />
								<div className=''>Assignee</div>
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='assignee'
										checked={columnVisibility.assignee}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='Progress' color='violet' size='text-xl' />
								<div className=''>Progress</div>
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='progress'
										checked={columnVisibility.progress}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='DateTime' color='red' size='text-xl' />
								<div className=''>Deadline</div>
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='deadline'
										checked={columnVisibility.deadline}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
							<DropdownItem className='gap-2'>
								<Icon icon='StarHalf' color='amber' size='text-xl' />
								<div className=''>Rating</div>
								<div className='ms-auto'>
									<Checkbox
										dimension='sm'
										name='rating'
										checked={columnVisibility.rating}
										onChange={handleCheckboxChange}
									/>
								</div>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='overflow-y-auto'>
				<TableTemplate
					table={table}
					hasFooter={false}
					isSortable={false}
					className='w-full'
				/>
			</CardBody>
			<TableCardFooterTemplate table={table} />
		</Card>
	);
};

export default TableSearchableFilterExample;
