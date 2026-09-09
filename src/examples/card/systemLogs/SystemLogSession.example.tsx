// @start-snippet:: systemLogSessionExampleSource
import Card, { CardBody, CardFooter, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const SystemLogSessionExample = () => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<Icon icon='ComputerPhoneSync' size='text-3xl' />
				</CardHeaderChild>
				<CardHeaderChild>
					<Button aria-label='Sign out' icon='Logout03' variant='outline' color='zinc'>
						Sign out
					</Button>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='flex flex-col gap-2'>
				<div className='flex justify-between'>
					<div className='text-xl font-bold'>macOS</div>
					<div className=''>
						<Badge variant='outline'>Current</Badge>
					</div>
				</div>
				<div className='flex justify-between'>
					<div className='text-zinc-500'>LOCATION:</div>
					<div className=''>United States</div>
				</div>
				<div className='flex justify-between'>
					<div className='text-zinc-500'>DEVICE:</div>
					<div className=''>Safari - macOS</div>
				</div>
				<div className='flex justify-between'>
					<div className='text-zinc-500'>IP ADDRESS:</div>
					<div className=''>123.456.789.012</div>
				</div>
				<div className='flex justify-between'>
					<div className='text-zinc-500'>RECENT ACTIVITY:</div>
					<div className=''>1 hour ago</div>
				</div>
			</CardBody>
			<CardFooter>
				<Button
					aria-label='Don’t recognize something?'
					variant='soft'
					color='zinc'
					icon='InformationSquare'
					className='w-full'
					dimension='lg'>
					Don’t recognize something?
				</Button>
			</CardFooter>
		</Card>
	);
};

export default SystemLogSessionExample;
// @end-snippet:: systemLogSessionExampleSource
