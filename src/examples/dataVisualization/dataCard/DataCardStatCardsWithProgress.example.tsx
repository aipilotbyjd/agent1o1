// @start-snippet:: dataCardStatCardsWithProgressExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import EXAMPLE from '@/examples/_index';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import priceFormat from '@/utils/priceFormat.util';
import Progress, { ProgressBar } from '@/components/ui/Progress';

const DataCardStatCardsWithProgressExample = () => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle
						iconProps={{ icon: 'SaleTag01', color: 'emerald', size: 'text-3xl' }}>
						Sales
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<EXAMPLE.Ui.Dropdown.Range />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<Card>
						<CardBody>
							<div className='flex flex-col gap-2'>
								<div className='text-zinc-500'>In-store sales</div>
								<div className='flex items-center gap-2'>
									<span className='text-2xl font-bold'>
										{priceFormat(24581.58)}
									</span>
									<Badge variant='default' color='emerald' rounded='rounded-lg'>
										<Icon icon='TradeUp' /> 3.46
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<div className='flex flex-col gap-2'>
								<div className='text-zinc-500'>Website sales</div>
								<div className='flex items-center gap-2'>
									<span className='text-2xl font-bold'>
										{priceFormat(64835.56)}
									</span>
									<Badge variant='default' color='red' rounded='rounded-lg'>
										<Icon icon='TradeDown' /> 4.41
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<div className='flex flex-col gap-2'>
								<div className='text-zinc-500'>Discount</div>
								<div className='flex items-center gap-2'>
									<span className='text-2xl font-bold'>
										{priceFormat(1341.58)}
									</span>
									<Badge variant='default' color='emerald' rounded='rounded-lg'>
										<Icon icon='TradeUp' /> 24
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				<div className='mt-8 flex flex-col gap-2'>
					<div className='text-zinc-500'>Monthly closed sales</div>
					<div className='flex items-center gap-2'>
						<span className='text-2xl font-bold'>{priceFormat(54283.28)}</span>
					</div>
					<div>
						<div className='mb-2 flex justify-center divide-x divide-zinc-500/25'>
							<div className='flex flex-1 items-center justify-center gap-2'>
								<div className='size-2 rounded-full bg-red-500'></div>
								<div>Bad</div>
							</div>
							<div className='flex flex-1 items-center justify-center gap-2'>
								<div className='size-2 rounded-full bg-amber-500'></div>
								<div>Average</div>
							</div>
							<div className='flex flex-1 items-center justify-center gap-2'>
								<div className='size-4 rounded-full bg-blue-500'></div>
								<div className='font-bold'>Good</div>
							</div>
							<div className='flex flex-1 items-center justify-center gap-2'>
								<div className='size-2 rounded-full bg-emerald-500'></div>
								<div>Excellent</div>
							</div>
						</div>
						<Progress>
							<ProgressBar value={68} color='blue' />
						</Progress>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default DataCardStatCardsWithProgressExample;
// @end-snippet:: dataCardStatCardsWithProgressExampleSource
