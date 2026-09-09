// @start-snippet:: chartAndGraphBasicRangeAreaChartExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import ChartRangeAreaPart from '@/parts/charts/ChartRangeArea.part';
import Button from '@/components/ui/Button';

const ChartAndGraphBasicRangeAreaChartExample = () => {
	return (
		<Card className='h-full'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'UserGroup',
							color: 'emerald',
							size: 'text-3xl',
						}}>
						Teams
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<Button color='emerald' aria-label='Full Reports'>
						Full Reports
					</Button>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<ChartRangeAreaPart />
			</CardBody>
		</Card>
	);
};

export default ChartAndGraphBasicRangeAreaChartExample;
// @end-snippet:: chartAndGraphBasicRangeAreaChartExampleSource
