import { Fragment, useState } from 'react';
import EX_Dropdown from '@/examples/ui/dropdown/_index';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Row,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import {
	TableCardFooterTemplate,
	TableIndeterminateCheckbox,
} from '@/templates/common/TableParts.template';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Icon from '@/components/icon/Icon';
import classNames from 'classnames';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import priceFormat from '@/utils/priceFormat.util';
import Checkbox from '@/components/form/Checkbox';
import { useNavigate } from 'react-router';
import pages from '@/Routes/pages';
import PRODUCTS, { IProduct } from '@/mocks/products.mock';

const EditSubComponent = ({ row }: { row: Row<IProduct> }) => {
	const [name, setName] = useState<string>(row.original.name);
	const [sku, setSku] = useState<string>(row.original.sku);
	const [stock, setStock] = useState<number>(row.original.stock);
	const [price, setPrice] = useState<number>(row.original.price);

	return (
		<pre>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12 lg:col-span-3'>
					<Input
						name='name'
						label='Name'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</div>
				<div className='col-span-12 lg:col-span-3'>
					<Input
						name='sku'
						label='SKU'
						value={sku}
						onChange={(e) => setSku(e.target.value)}
					/>
				</div>
				<div className='col-span-12 lg:col-span-3'>
					<Input
						name='stock'
						type='number'
						label='Stock'
						value={stock}
						onChange={(e) => setStock(Number(e.target.value))}
					/>
				</div>
				<div className='col-span-12 lg:col-span-3'>
					<Input
						name='price'
						type='number'
						label='Price'
						value={price}
						step='0.01'
						min={0}
						onChange={(e) => setPrice(Number(e.target.value))}
					/>
				</div>
				<div className='col-span-12'></div>
				<div className='col-span-12 flex justify-end'>
					<Button
						aria-label='Save'
						variant='soft'
						onClick={() => {
							row.toggleExpanded();
						}}>
						Save
					</Button>
				</div>
			</div>
		</pre>
	);
};

const TableExpandableExample = () => {
	const navigate = useNavigate();

	const [data] = useState(() => [...PRODUCTS]);

	const columns: ColumnDef<IProduct>[] = [
		{
			header: 'Product',
			// footer: (props) => props.column.id,
			columns: [
				{
					id: 'select',
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
					meta: {
						className: 'px-0! w-8',
					},
				},
				{
					id: 'expander',
					header: () => null,
					cell: ({ row }) => {
						return row.getCanExpand() ? (
							<button
								{...{
									onClick: row.getToggleExpandedHandler(),
									style: { cursor: 'pointer' },
								}}>
								{row.getIsExpanded() ? (
									<Icon icon='ArrowDown01' />
								) : (
									<Icon icon='ArrowRight01' />
								)}
							</button>
						) : (
							<Icon icon='MinusSign' />
						);
					},
				},
				{
					accessorKey: 'name',
					header: 'Name',
					cell: ({ row, getValue }) => (
						<div
							className='truncate'
							style={{
								// Since rows are flattened by default,
								// we can use the row.depth property
								// and paddingLeft to visually indicate the depth
								// of the row
								paddingLeft: `${row.depth * 2}rem`,
							}}>
							{getValue<string>()}
						</div>
					),
				},
				{
					accessorKey: 'sku',
					id: 'sku',
					// accessorFn: (row) => row.name,
					cell: (info) => (
						<div className='truncate font-mono font-bold'>{info.getValue()}</div>
					),
					header: () => 'SKU',
				},
			],
		},
		{
			header: 'More Info',
			columns: [
				{
					accessorKey: 'category',
					header: () => 'Category',
					cell: ({ row }) => (
						<div className='flex gap-2'>
							{row.original.category.map((item) => (
								<Badge key={item.id} variant='soft' color='zinc'>
									<div
										className={`h-4 w-1 rounded-2xl bg-${item.color}-500`}></div>
									<span>{item.name}</span>
								</Badge>
							))}
						</div>
					),
				},
				{
					accessorKey: 'tag',
					header: () => 'Tag',
					cell: ({ row }) => (
						<div className='flex gap-2'>
							{row.original.tag.map((item) => (
								<Badge
									key={item.id}
									variant='soft'
									color={item.color}
									className='truncate'>
									{item.name}
								</Badge>
							))}
						</div>
					),
				},
				{
					accessorKey: 'store',
					header: () => 'Store',
					cell: ({ row }) => (
						<div className='flex gap-2'>
							{row.original.store.map((item) => (
								<Badge
									key={item}
									variant='outline'
									color='zinc'
									className='truncate'>
									{item}
								</Badge>
							))}
						</div>
					),
				},
				{
					accessorKey: 'stock',
					header: () => 'Stock',
					cell: (info) => <div>{info.getValue()}</div>,
				},
				{
					accessorKey: 'price',
					header: () => 'Price',
					cell: (info) => <div>{priceFormat(info.getValue())}</div>,
				},
				{
					accessorKey: 'status',
					header: () => 'Status',
					cell: (info) => (
						<div>
							<Checkbox variant='switch' checked={info.getValue()} />{' '}
						</div>
					),
				},
			],
		},
		{
			header: 'Actions',
			cell: ({ row }) => (
				<div className='flex gap-2'>
					<Button
						aria-label='Edit'
						icon='Edit02'
						variant='link'
						onClick={() =>
							navigate(
								`${pages.apps.products.subPages.edit.to}?productId=${
									row.original.id
								}`,
							)
						}
					/>
				</div>
			),
		},
	];

	const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
	const [globalFilter, setGlobalFilter] = useState<string>('');
	const [rowSelection, setRowSelection] = useState({});

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			globalFilter,
			rowSelection,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		enableGlobalFilter: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowCanExpand: () => true,
		getExpandedRowModel: getExpandedRowModel(),
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
							icon: 'PropertyNew',
							color: 'emerald',
							size: 'text-3xl',
						}}>
						Products
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<EX_Dropdown.Download />
					<EX_Dropdown.Assign />
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='overflow-y-auto'>
				<Table>
					<THead>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<Th
											key={header.id}
											colSpan={header.colSpan}
											// eslint-disable-next-line react/jsx-props-no-spreading
											{...header.column.columnDef.meta}>
											{header.isPlaceholder ? null : (
												<div
													key={header.id}
													aria-hidden='true'
													{...{
														className: classNames(
															'flex gap-2 items-center justify-center',
															{
																'cursor-pointer select-none':
																	header.column.getCanSort(),
															},
														),

														onClick:
															header.column.getToggleSortingHandler(),
													}}>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: (
															<Icon
																icon='Sorting02'
																color='blue'
																className='ltr:ml-1.5 rtl:mr-1.5'
															/>
														),
														desc: (
															<Icon
																icon='Sorting01'
																color='blue'
																className='ltr:ml-1.5 rtl:mr-1.5'
															/>
														),
													}[header.column.getIsSorted() as string] ??
														null}
													{header.column.getCanSort() &&
														!(header.column.getIsSorted() as string) && (
															<Icon
																icon='Sorting05'
																className='ltr:ml-1.5 rtl:mr-1.5'
															/>
														)}
												</div>
											)}
										</Th>
									);
								})}
							</Tr>
						))}
					</THead>
					<TBody>
						{table.getRowModel().rows.map((row) => {
							return (
								<Fragment key={row.id}>
									<Tr>
										{/* the first row is a normal row */}
										{row.getVisibleCells().map((cell) => {
											return (
												<Td key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</Td>
											);
										})}
									</Tr>
									{row.getIsExpanded() && (
										<Tr>
											{/* 2nd row is a custom 1 cell row */}
											<Td colSpan={row.getVisibleCells().length}>
												<EditSubComponent row={row} />
											</Td>
										</Tr>
									)}
								</Fragment>
							);
						})}
					</TBody>
				</Table>
			</CardBody>
			<TableCardFooterTemplate table={table} />
		</Card>
	);
};

export default TableExpandableExample;
