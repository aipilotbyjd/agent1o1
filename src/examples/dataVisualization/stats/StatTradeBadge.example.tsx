// @start-snippet:: statTradeBadgeExampleSource
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

const StatTradeBadgeExample = () => {
	return (
		<div className='mx-auto w-full lg:max-w-5xl'>
			<div className='grid grid-cols-1 md:grid-cols-3'>
				<div className='flex flex-col gap-2'>
					<div className='mb-2'>Support request</div>
					<div className='flex items-center gap-2'>
						<span className='text-2xl font-bold'>452</span>
						<Badge variant='default' color='emerald' rounded='rounded-lg'>
							<Icon icon='TradeUp' /> 18.4
						</Badge>
					</div>
					<div className='text-zinc-500'>4 last week</div>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='mb-2'>Resolved request</div>
					<div className='flex items-center gap-2'>
						<span className='text-2xl font-bold'>247</span>
						<Badge variant='default' color='red' rounded='rounded-lg'>
							<Icon icon='TradeDown' /> 12.8
						</Badge>
					</div>
					<div className='text-zinc-500'>4 last week</div>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='mb-2'>Ticket resolved by AI</div>
					<div className='flex items-center gap-2'>
						<span className='text-2xl font-bold'>121</span>
						<Badge variant='default' color='emerald' rounded='rounded-lg'>
							<Icon icon='TradeUp' />
							9.6
						</Badge>
					</div>
					<div className='text-zinc-500'>4 last week</div>
				</div>
			</div>
		</div>
	);
};

export default StatTradeBadgeExample;
// @end-snippet:: statTradeBadgeExampleSource
