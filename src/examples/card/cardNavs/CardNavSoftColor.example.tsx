// @start-snippet:: cardNavSoftColorExampleSource
import { ReactNode, useState } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Empty from '@/components/ui/Empty';

type Tab = {
	label: string;
	content: ReactNode;
};

const CardNavSoftColorExample = () => {
	const tabs: Tab[] = [
		{
			label: 'All',
			content: (
				<div className='flex flex-col items-center justify-center gap-4'>
					<div className='text-xl font-bold'>No data</div>
					<div className='text-zinc-500'>
						No data here yet. We will notify you when there's an update.
					</div>
					<div className='w-full max-w-lg'>
						<Empty />
					</div>
					<Button aria-label='Learn more' variant='soft' color='zinc' className='mb-8'>
						Learn more
					</Button>
				</div>
			),
		},
		{
			label: 'New',
			content: (
				<div className='flex flex-col items-center justify-center gap-4'>
					<div className='text-xl font-bold'>No New data</div>
					<div className='text-zinc-500'>
						No data here yet. We will notify you when there's an update.
					</div>
					<div className='w-full max-w-lg'>
						<Empty />
					</div>
					<Button aria-label='Learn more' variant='soft' color='zinc' className='mb-8'>
						Learn more
					</Button>
				</div>
			),
		},
		{
			label: 'Archived',
			content: (
				<div className='flex flex-col items-center justify-center gap-4'>
					<div className='text-xl font-bold'>No Archived data</div>
					<div className='text-zinc-500'>
						No data here yet. We will notify you when there's an update.
					</div>
					<div className='w-full max-w-lg'>
						<Empty />
					</div>
					<Button aria-label='Learn more' variant='soft' color='zinc' className='mb-8'>
						Learn more
					</Button>
				</div>
			),
		},
	];

	const [activeTab, setActiveTab] = useState<number>(0);

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					{tabs.map((tab, i) => (
						<Button
							key={tab.label}
							onClick={() => setActiveTab(i)}
							variant={activeTab === i ? 'soft' : 'link'}
							aria-label=''>
							{tab.label}
						</Button>
					))}
				</CardHeaderChild>
			</CardHeader>
			<CardBody>{tabs[activeTab].content}</CardBody>
		</Card>
	);
};

export default CardNavSoftColorExample;
// @end-snippet:: cardNavSoftColorExampleSource
