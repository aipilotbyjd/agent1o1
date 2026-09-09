// @start-snippet:: mapWorldExampleSource
import WorldMap from 'react-svg-worldmap';
import colors from '@/tailwindcss/colors.tailwind';
import useDarkMode from '@/hooks/useDarkMode';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import TableTemplate from '@/templates/common/TableParts.template';
import priceFormat from '@/utils/priceFormat.util';

type IOrderProducts = {
	id: string;
	name: string;
	visit: number;
	purchases: number;
};

const columnHelper = createColumnHelper<IOrderProducts>();

const MapWorldExample = () => {
	const { isDarkTheme } = useDarkMode();

	const dataMap = [
		{ country: 'us', value: 17543 },
		{ country: 'in', value: 12482 },
		{ country: 'br', value: 9521 },
		{ country: 'de', value: 7865 },
		{ country: 'tr', value: 3521 },
	];

	const [data] = useState<IOrderProducts[]>([
		{
			id: 'us',
			name: '🇺🇸United States',
			visit: 17543,
			purchases: 8463,
		},
		{
			id: 'in',
			name: '🇮🇳India',
			visit: 12482,
			purchases: 5411,
		},
		{
			id: 'br',
			name: '🇧🇷Brazil',
			visit: 9521,
			purchases: 4562,
		},
		{
			id: 'de',
			name: '🇩🇪Germany',
			visit: 7865,
			purchases: 4882,
		},
		{
			id: 'tr',
			name: '🇹🇷Turkiye',
			visit: 3521,
			purchases: 1881,
		},
	]);

	const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
	const [globalFilter, setGlobalFilter] = useState<string>('');

	const columns = [
		columnHelper.accessor('name', {
			cell: (info) => <div>{info.getValue()}</div>,
			header: () => 'Country',
			footer: () => 'Country',
		}),
		columnHelper.accessor('visit', {
			cell: (info) => <div>{info.getValue()}</div>,
			header: () => 'Visits',
			footer: () => 'Visits',
		}),
		columnHelper.accessor('purchases', {
			cell: (info) => <div>{priceFormat(info.getValue())}</div>,
			header: () => 'Purchases',
			footer: () => 'Purchases',
		}),
	];

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		enableRowSelection: true,
		enableGlobalFilter: true,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: {},
	});

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'MapsGlobal01',
							color: 'blue',
							size: 'text-3xl',
						}}>
						Analytics
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='flex items-center justify-center'>
					<WorldMap
						color={colors.blue['500']}
						value-suffix='people'
						size='responsive'
						data={dataMap}
						backgroundColor='transparent'
						borderColor={isDarkTheme ? colors.zinc['300'] : colors.zinc['700']}
						tooltipTextFunction={({ countryName, countryValue }) =>
							`${countryName} - Visit: ${countryValue?.toLocaleString()} people`
						}
					/>
				</div>
			</CardBody>
			<CardBody className='overflow-auto'>
				<TableTemplate table={table} hasFooter={false} />
			</CardBody>
		</Card>
	);
};

export default MapWorldExample;
// @end-snippet:: mapWorldExampleSource
