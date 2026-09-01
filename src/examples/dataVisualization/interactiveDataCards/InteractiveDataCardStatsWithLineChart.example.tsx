// @start-snippet:: interactiveDataCardStatsWithLineChartExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import { useState } from 'react';
import Chart from '@/components/utils/Chart';
import { IChartOptions } from '@/interface/chart.interface';
import EX_Stat from '@/examples/dataVisualization/stats/_index';

const InteractiveDataCardStatsWithLineChartExample = () => {
	const [state] = useState<IChartOptions>({
		series: [
			{
				name: 'Support request',
				data: [44, 55, 57, 56, 61, 58, 63, 60, 66],
			},
			{
				name: 'Resolved request',
				data: [76, 85, 101, 98, 87, 105, 91, 114, 94],
			},
			{
				name: 'Ticket resolved by AI',
				data: [35, 41, 36, 26, 45, 48, 52, 53, 41],
			},
		],
		options: {
			chart: {
				type: 'bar',
				height: 350,
			},
			plotOptions: {
				bar: {
					horizontal: false,
					columnWidth: '50%',
					borderRadius: 7,
					borderRadiusApplication: 'around',
					borderRadiusWhenStacked: 'last',
				},
			},
			dataLabels: {
				enabled: false,
			},
			stroke: {
				show: true,
				width: 2,
				colors: ['transparent'],
			},
			xaxis: {
				categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
			},
			yaxis: {
				title: {
					text: 'Ticket',
				},
			},
			fill: {
				opacity: 1,
			},
			tooltip: {
				y: {
					formatter(val) {
						return `$ ${val} thousands`;
					},
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
							icon: 'AutoConversations',
							color: 'amber',
							size: 'text-3xl',
						}}>
						Total conversations
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<EX_Stat.TradeBadge />
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

export default InteractiveDataCardStatsWithLineChartExample;
// @end-snippet:: interactiveDataCardStatsWithLineChartExampleSource
