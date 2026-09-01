// @start-snippet:: statWithButtonExampleSource
import Card, {
	CardBody,
	CardFooter,
	CardFooterChild,
	CardHeader,
	CardHeaderChild,
	CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const StatWithButtonExample = () => {
	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle
							iconProps={{
								icon: 'Clock01',
								color: 'zinc',
								size: 'text-3xl',
							}}>
							Total Hours
						</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<span className='text-4xl font-extrabold'>32h 28m</span>
				</CardBody>
				<CardFooter>
					<CardFooterChild>
						<Button
							aria-label='View reports'
							rightIcon='ArrowRight01'
							className='!px-0'>
							View reports
						</Button>
					</CardFooterChild>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle
							iconProps={{
								icon: 'Timer02',
								color: 'zinc',
								size: 'text-3xl',
							}}>
							Avg. Daily Hours
						</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<span className='text-4xl font-extrabold'>5h 46m</span>
				</CardBody>
				<CardFooter>
					<CardFooterChild>
						<Button
							aria-label='View reports'
							rightIcon='ArrowRight01'
							className='!px-0'>
							View reports
						</Button>
					</CardFooterChild>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle
							iconProps={{
								icon: 'TimeQuarter',
								color: 'zinc',
								size: 'text-3xl',
							}}>
							Over Limit
						</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<span className='text-4xl font-extrabold'>0h 0m</span>
				</CardBody>
				<CardFooter>
					<CardFooterChild>
						<Button
							aria-label='View reports'
							rightIcon='ArrowRight01'
							className='!px-0'>
							View reports
						</Button>
					</CardFooterChild>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle
							iconProps={{
								icon: 'TimeQuarterPass',
								color: 'zinc',
								size: 'text-3xl',
							}}>
							Under Limit
						</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<span className='text-4xl font-extrabold'>2h 32m</span>
				</CardBody>
				<CardFooter>
					<CardFooterChild>
						<Button
							aria-label='View reports'
							rightIcon='ArrowRight01'
							className='!px-0'>
							View reports
						</Button>
					</CardFooterChild>
				</CardFooter>
			</Card>
		</div>
	);
};

export default StatWithButtonExample;
// @end-snippet:: statWithButtonExampleSource
