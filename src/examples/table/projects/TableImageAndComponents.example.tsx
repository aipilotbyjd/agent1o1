import { useState } from 'react';
import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import EX_Dropdown from '@/examples/ui/dropdown/_index';
import TableTemplate, { TableCardFooterTemplate } from '@/templates/common/TableParts.template';
import priceFormat from '@/utils/priceFormat.util';
import Progress from '@/components/ui/Progress';
import { TStatusKey } from '@/examples/ui/dropdown/DropdownChangeStatus.example';
import {
	Adobe,
	AirBnb,
	Amazon,
	Apple,
	Atlassian,
	Dropbox,
	Facebook,
	Google,
	Microsoft,
	Netflix,
	Salesforce,
	Shopify,
	Slack,
	Uber,
	Yandex,
} from '@/assets/images';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface IProjectProps {
	id: number;
	img: string;
	name: string;
	cost: number;
	hours: number;
	hoursUpdated: number;
	tasks: number;
	complete: number;
	status: TStatusKey;
}
const projects: IProjectProps[] = [
	{
		id: 1,
		img: Facebook,
		name: 'Facebook',
		cost: 25000,
		hours: 120,
		hoursUpdated: 0,
		tasks: 75,
		complete: 18,
		status: 'backlog',
	},
	{
		id: 2,
		img: AirBnb,
		name: 'Airbnb',
		cost: 18000,
		hours: 95,
		hoursUpdated: 24,
		tasks: 60,
		complete: 12,
		status: 'inProgress',
	},
	{
		id: 3,
		img: Google,
		name: 'Google',
		cost: 32000,
		hours: 200,
		hoursUpdated: -18,
		tasks: 80,
		complete: 25,
		status: 'inReview',
	},
	{
		id: 4,
		img: Microsoft,
		name: 'Microsoft',
		cost: 40000,
		hours: 240,
		hoursUpdated: 10,
		tasks: 90,
		complete: 30,
		status: 'backlog',
	},
	{
		id: 5,
		img: Amazon,
		name: 'Amazon',
		cost: 28000,
		hours: 160,
		hoursUpdated: 35,
		tasks: 70,
		complete: 22,
		status: 'inReview',
	},
	{
		id: 6,
		img: Netflix,
		name: 'Netflix',
		cost: 15000,
		hours: 85,
		hoursUpdated: 40,
		tasks: 65,
		complete: 14,
		status: 'inProgress',
	},
	{
		id: 7,
		img: Uber,
		name: 'Uber',
		cost: 20000,
		hours: 110,
		hoursUpdated: 0,
		tasks: 72,
		complete: 20,
		status: 'todo',
	},
	{
		id: 8,
		img: Shopify,
		name: 'Spotify',
		cost: 17000,
		hours: 100,
		hoursUpdated: -20,
		tasks: 68,
		complete: 68,
		status: 'done',
	},
	{
		id: 9,
		img: Slack,
		name: 'Slack',
		cost: 22000,
		hours: 130,
		hoursUpdated: -5,
		tasks: 77,
		complete: 19,
		status: 'changeRequest',
	},
	{
		id: 10,
		img: Dropbox,
		name: 'Dropbox',
		cost: 16000,
		hours: 90,
		hoursUpdated: 8,
		tasks: 62,
		complete: 15,
		status: 'changeRequest',
	},
	{
		id: 11,
		img: Apple,
		name: 'Apple',
		cost: 23000,
		hours: 140,
		hoursUpdated: 0,
		tasks: 73,
		complete: 21,
		status: 'inProgress',
	},
	{
		id: 12,
		img: Adobe,
		name: 'Adobe',
		cost: 31000,
		hours: 180,
		hoursUpdated: 20,
		tasks: 85,
		complete: 28,
		status: 'inReview',
	},
	{
		id: 13,
		img: Salesforce,
		name: 'Salesforce',
		cost: 35000,
		hours: 210,
		hoursUpdated: 30,
		tasks: 88,
		complete: 27,
		status: 'todo',
	},
	{
		id: 14,
		img: Atlassian,
		name: 'Atlassian',
		cost: 24000,
		hours: 150,
		hoursUpdated: 40,
		tasks: 78,
		complete: 23,
		status: 'inReview',
	},
	{
		id: 15,
		img: Yandex,
		name: 'Yandex',
		cost: 19000,
		hours: 105,
		hoursUpdated: 20,
		tasks: 66,
		complete: 17,
		status: 'changeRequest',
	},
];
const columnHelper = createColumnHelper<IProjectProps>();

const TableImageAndComponentsExample = () => {
	const [data] = useState(() => [...projects]);

	const columns = [
		columnHelper.accessor('img', {
			cell: (info) => (
				<div>
					<img src={info.getValue()} alt='' className='size-12' />
				</div>
			),
			header: 'Image',
			footer: 'Image',
			meta: {
				className: 'w-12!',
			},
			enableSorting: false,
		}),
		columnHelper.accessor('name', {
			cell: (info) => <div className='text-lg font-bold'>{info.getValue()}</div>,
			header: 'Name',
			footer: 'Name',
		}),
		columnHelper.accessor('status', {
			cell: (info) => (
				<div>
					<EX_Dropdown.ChangeStatus initialStatusKey={info.getValue()} />
				</div>
			),
			header: 'Status',
			footer: 'Status',
		}),
		columnHelper.accessor('cost', {
			cell: (info) => <div>{priceFormat(info.getValue())}</div>,
			header: 'Cost',
			footer: 'Cost',
		}),
		columnHelper.accessor('hours', {
			cell: (info) => {
				const h = info.row.original.hoursUpdated;
				return (
					<div className='flex items-center gap-2'>
						<span>{info.getValue()}</span>
						<Badge
							variant='soft'
							color={h === 0 ? 'zinc' : h < 0 ? 'red' : 'emerald'}
							rounded='rounded-full'>
							<Icon
								icon={
									h === 0 ? 'ApproximatelyEqual' : h < 0 ? 'TradeDown' : 'TradeUp'
								}
							/>{' '}
							{h}
						</Badge>
					</div>
				);
			},
			header: 'Hours',
			footer: 'Hours',
		}),
		columnHelper.accessor('tasks', {
			cell: (info) => (
				<Progress
					value={info.row.original.complete}
					min={0}
					max={info.getValue()}
					labelEnd={`${info.row.original.complete}/${info.getValue()}`}
				/>
			),
			header: 'Complete',
			footer: 'Complete',
		}),
	];
	const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
	const [globalFilter, setGlobalFilter] = useState<string>('');

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		enableRowSelection: true,
		enableGlobalFilter: true,
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
							icon: 'PropertyNew',
							color: 'emerald',
							size: 'text-3xl',
						}}>
						Active Projects
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<EX_Dropdown.Download />
					<EX_Dropdown.Assign />
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='overflow-y-auto'>
				<TableTemplate table={table} hasFooter={false} className='w-full' />
			</CardBody>
			<TableCardFooterTemplate table={table} />
		</Card>
	);
};

export default TableImageAndComponentsExample;
