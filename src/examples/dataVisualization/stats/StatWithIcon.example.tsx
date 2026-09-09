// @start-snippet:: statWithIconExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import priceFormat from '@/utils/priceFormat.util';
import Badge from '@/components/ui/Badge';

const StatWithIconExample = () => (
	<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<span className='text-zinc-500'>In-store sales</span>
				</CardHeaderChild>
				<CardHeaderChild>
					<Icon icon='Store01' size='text-xl' color='zinc' />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<span className='text-4xl font-bold'>{priceFormat(6432)}</span>
				<div className='flex items-center gap-2'>
					<div className='text-zinc-500'>3k orders</div>
					<Badge variant='soft' color='emerald' rounded='rounded-lg'>
						<Icon icon='TradeUp' /> 18.4
					</Badge>
				</div>
			</CardBody>
		</Card>
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<span className='text-zinc-500'>Website sales</span>
				</CardHeaderChild>
				<CardHeaderChild>
					<Icon icon='Globe02' size='text-xl' color='zinc' />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<span className='text-4xl font-bold'>{priceFormat(18484.55)}</span>
				<div className='flex items-center gap-2'>
					<div className='text-zinc-500'>3k orders</div>
					<Badge variant='soft' color='red' rounded='rounded-lg'>
						<Icon icon='TradeDown' />
						2.3
					</Badge>
				</div>
			</CardBody>
		</Card>
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<span className='text-zinc-500'>Discount</span>
				</CardHeaderChild>
				<CardHeaderChild>
					<Icon icon='DiscountTag02' size='text-xl' color='zinc' />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<span className='text-4xl font-bold'>{priceFormat(3000)}</span>
				<div className='flex items-center gap-2'>
					<div className='text-zinc-500'>3k orders</div>
					<Badge variant='soft' color='zinc' rounded='rounded-lg'>
						<Icon icon='MinusSign' /> 0.0
					</Badge>
				</div>
			</CardBody>
		</Card>
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<span className='text-zinc-500'>Affiliate</span>
				</CardHeaderChild>
				<CardHeaderChild>
					<Icon icon='Affiliate' size='text-xl' color='zinc' />
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<span className='text-4xl font-bold'>{priceFormat(875)}</span>
				<div className='flex items-center gap-2'>
					<div className='text-zinc-500'>3k orders</div>
					<Badge variant='soft' color='emerald' rounded='rounded-lg'>
						<Icon icon='TradeUp' /> 6.4
					</Badge>
				</div>
			</CardBody>
		</Card>
	</div>
);

export default StatWithIconExample;
// @end-snippet:: statWithIconExampleSource
