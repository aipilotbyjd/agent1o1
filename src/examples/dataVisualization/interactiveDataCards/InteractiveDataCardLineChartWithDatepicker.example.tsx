// @start-snippet:: interactiveDataCardLineChartWithDatepickerExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import priceFormat from '@/utils/priceFormat.util';
import { useState } from 'react';
import { IChartOptions } from '@/interface/chart.interface';
import Chart from '@/components/utils/Chart';
import EX_Dropdown from '@/examples/ui/dropdown/_index';

const InteractiveDataCardLineChartWithDatepickerExample = () => {
	const [state] = useState<IChartOptions>({
		series: [
			{
				name: 'Store Sales',
				data: [31, 40, 28, 51, 42, 109, 100],
			},
			{
				name: 'Online Sales',
				data: [11, 32, 45, 32, 34, 52, 41],
			},
			{
				name: 'Other Sales',
				data: [3, 4, 1, 2, 23, 6, 7],
			},
		],
		options: {
			chart: { height: 250, type: 'line' },
			legend: {
				show: false,
			},
			dataLabels: { enabled: false },
			stroke: {},
			xaxis: {
				labels: { show: false },
				axisBorder: { show: false },
			},
			yaxis: {
				labels: { show: false },
			},
			tooltip: { x: { format: 'dd MMM yyyy HH:mm' } },
			grid: { yaxis: { lines: { show: false } } },
			fill: {
				type: 'gradient',
				gradient: {
					type: 'horizontal',
					opacityFrom: 0,
					opacityTo: 1,
					stops: [0, 50, 100],
					colorStops: [],
				},
			},
		},
	});
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'SaleTag02',
							color: 'blue',
							size: 'text-3xl',
						}}>
						Total Sales
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<EX_Dropdown.Datepicker />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='flex flex-col gap-4'>
					<div className='mb-4 flex gap-2'>
						<div className='text-2xl text-zinc-500'>$</div>
						<div className='text-6xl font-semibold'>49.500</div>
					</div>
					<div className='col-span-12 flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<div className='size-4 rounded-full bg-blue-500'></div>
							<div className=''>Store Sales</div>
						</div>
						<div className=''>{priceFormat(23264)}</div>
						<Badge variant='soft' color='emerald' rounded='rounded-lg'>
							<Icon icon='TradeUp' /> 7.6
						</Badge>
					</div>
					<div className='col-span-12 flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<div className='size-4 rounded-full bg-emerald-500'></div>
							<div className=''>Online Sales</div>
						</div>
						<div className=''>{priceFormat(23264)}</div>
						<Badge variant='soft' color='emerald' rounded='rounded-lg'>
							<Icon icon='TradeUp' /> 7.6
						</Badge>
					</div>
					<div className='col-span-12 flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<div className='size-4 rounded-full bg-amber-500'></div>
							<div className=''>Other Sales</div>
						</div>
						<div className=''>{priceFormat(23264)}</div>
						<Badge variant='soft' color='emerald' rounded='rounded-lg'>
							<Icon icon='TradeUp' /> 7.6
						</Badge>
					</div>
					<Chart
						options={state.options}
						series={state.series}
						type={state.options.chart?.type}
						height={state.options.chart?.height}
					/>
				</div>
			</CardBody>
		</Card>
	);
};

export default InteractiveDataCardLineChartWithDatepickerExample;
// @end-snippet:: interactiveDataCardLineChartWithDatepickerExampleSource
