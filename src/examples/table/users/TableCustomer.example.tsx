import { Link, useNavigate } from 'react-router';
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
import CUSTOMERS, { ICustomer } from '@/mocks/customers.mock';
import { ChangeEvent, useState } from 'react';
import TableTemplate, {
	TableCardFooterTemplate,
	TableIndeterminateCheckbox,
} from '@/templates/common/TableParts.template';
import pages from '@/Routes/pages';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Checkbox from '@/components/form/Checkbox';
import Avatar from '@/components/ui/Avatar';

const columnHelper = createColumnHelper<ICustomer>();

const TableCustomerExample = () => {
	const navigate = useNavigate();

	const [data] = useState(() => [...CUSTOMERS]);

	const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
	const [globalFilter, setGlobalFilter] = useState<string>('');
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		imageUrl: true,
		id: true,
		address: true,
		email: true,
		phone: true,
		actions: true,
	});
	const [rowSelection, setRowSelection] = useState({});

	const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setColumnVisibility((prev) => ({
			...prev,
			[name]: checked,
		}));
	};

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
			enableSorting: false,
			meta: {
				className: '!py-0',
			},
		}),
		columnHelper.accessor('imageUrl', {
			cell: (info) => (
				<Avatar
					src={info.getValue()}
					name={`${info.row.original.firstName} ${info.row.original.lastName}`}
					color={info.row.original.color}
					variant='outline'
				/>
			),
			header: () => 'Image',
			footer: () => 'Image',
			enableSorting: false,
			meta: {
				className: 'w-8',
			},
		}),
		columnHelper.accessor('id', {
			cell: (info) => (
				<Link
					to={{
						pathname: pages.apps.customer.subPages.view.to,
						search: `?customerId=${info.getValue()}`,
					}}>
					{`${info.row.original.firstName} ${info.row.original.lastName}`}
				</Link>
			),
			header: () => 'Name',
			footer: () => 'Name',
		}),
		columnHelper.accessor('address', {
			cell: (info) => {
				const address = info.row.original.address;
				return (
					<div>
						<div>{`${address.streetAddress}, ${address.apartmentOrSuite}, ${address.city},`}</div>
						<div>{`${address.regionOrState}, ${address.postalCode}, ${address.country}`}</div>
					</div>
				);
			},
			header: () => 'Address',
			footer: () => 'Address',
		}),
		columnHelper.accessor('email', {
			cell: (info) => <div>{info.getValue()}</div>,
			header: () => 'Email',
			footer: () => 'Email',
		}),
		columnHelper.accessor('phone', {
			cell: (info) => <div>{info.getValue()}</div>,
			header: () => 'Phone',
			footer: () => 'Phone',
		}),
		columnHelper.display({
			cell: (info) => (
				<div className='flex items-end gap-2'>
					<Button
						aria-label='Edit'
						icon='PencilEdit02'
						variant='link'
						onClick={() =>
							navigate(
								`${pages.apps.customer.subPages.edit.to}?customerId=${info.row.original.id}`,
							)
						}
					/>
				</div>
			),
			header: 'Actions',
			footer: 'Actions',
			id: 'actions',
			meta: {
				className: '',
			},
		}),
	];

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			rowSelection,
			globalFilter,
			columnVisibility,
		},
		onSortingChange: setSorting,
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		enableGlobalFilter: true,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: { pageSize: 10 },
		},
	});

	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'UserGroup',
							color: 'amber',
							size: 'text-3xl',
						}}>
						Customers
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button aria-label='Visibility' icon='ColumnDelete' variant='link' />
						</DropdownToggle>
						<DropdownMenu placement='bottom-end'>
							<div className='flex items-center'>
								<div className='grow'>Image</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='imageUrl'
										checked={columnVisibility.imageUrl}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
							<div className='flex items-center'>
								<div className='grow'>Name</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='id'
										checked={columnVisibility.id}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
							<div className='flex items-center'>
								<div className='grow'>Address</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='address'
										checked={columnVisibility.address}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
							<div className='flex items-center'>
								<div className='grow'>Email</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='email'
										checked={columnVisibility.email}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
							<div className='flex items-center'>
								<div className='grow'>Phone</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='phone'
										checked={columnVisibility.phone}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
							<div className='flex items-center'>
								<div className='grow'>Actions</div>
								<div className='shrink'>
									<Checkbox
										dimension='sm'
										name='actions'
										checked={columnVisibility.actions}
										onChange={handleCheckboxChange}
									/>
								</div>
							</div>
						</DropdownMenu>
					</Dropdown>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='overflow-auto'>
				<TableTemplate table={table} hasFooter={false} />
			</CardBody>
			<TableCardFooterTemplate table={table} />
		</Card>
	);
};

export default TableCustomerExample;
