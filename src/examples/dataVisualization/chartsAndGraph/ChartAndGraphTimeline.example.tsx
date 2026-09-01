// @start-snippet:: chartAndGraphTimelineExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import { useState } from 'react';
import Chart from '@/components/utils/Chart';
import { IChartOptions } from '@/interface/chart.interface';
import dayjs from 'dayjs';
import EXAMPLE from '@/examples/_index';

const ChartAndGraphTimelineExample = () => {
	const [state] = useState<IChartOptions>({
		series: [
			{
				data: [
					{
						x: 'Analysis',
						y: [dayjs().add(-5, 'day').valueOf(), dayjs().add(-2, 'day').valueOf()],
						fillColor: '#2b7fff',
					},
					{
						x: 'Design',
						y: [dayjs().add(-2, 'day').valueOf(), dayjs().add(0, 'day').valueOf()],
						fillColor: '#00bc7d',
					},
					{
						x: 'Coding',
						y: [dayjs().add(0, 'day').valueOf(), dayjs().add(8, 'day').valueOf()],
						fillColor: '#8e51ff',
					},
					{
						x: 'Testing',
						y: [dayjs().add(6, 'day').valueOf(), dayjs().add(10, 'day').valueOf()],
						fillColor: '#fd9a00',
					},
					{
						x: 'Deployment',
						y: [dayjs().add(9, 'day').valueOf(), dayjs().add(10, 'day').valueOf()],
						fillColor: '#fb2c36',
					},
				],
			},
		],
		options: {
			chart: {
				height: 400,
				type: 'rangeBar',
			},
			plotOptions: {
				bar: {
					horizontal: true,
					distributed: true,
					dataLabels: {
						hideOverflowingLabels: false,
					},
					borderRadius: 8,
				},
			},
			dataLabels: {
				enabled: true,
				formatter(val, opts) {
					const label = opts.w.globals.labels[opts.dataPointIndex];
					// @ts-ignore
					const a = dayjs(val[0]);
					// @ts-ignore
					const b = dayjs(val[1]);
					const diff = b.diff(a, 'days');
					return `${label}: ${diff}${diff > 1 ? ' days' : ' day'}`;
				},
				style: {
					colors: ['#f3f4f5', '#fff'],
				},
			},
			annotations: {
				xaxis: [
					{
						x: dayjs().valueOf(),
						borderColor: '#fb2c36',
						label: {
							style: {
								color: '#fff',
								background: '#fb2c36',
							},
							text: 'Today',
						},
					},
				],
			},
			xaxis: {
				type: 'datetime',
			},
			grid: {
				row: {
					opacity: 1,
				},
			},
			legend: {
				position: 'top',
				horizontalAlign: 'left',
				markers: { size: 6, shape: 'square', strokeWidth: 0, offsetX: -4 },
			},
		},
	});

	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<EXAMPLE.Ui.Dropdown.CompanyDetails />
				</CardHeaderChild>
				<CardHeaderChild>
					<EXAMPLE.Ui.Dropdown.Assign />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<Chart
					options={state.options}
					series={state.series}
					type={state.options.chart?.type}
					height={state.options.chart?.height}
				/>
			</CardBody>
		</Card>
	);
};

export default ChartAndGraphTimelineExample;
// @end-snippet:: chartAndGraphTimelineExampleSource
