// @start-snippet:: offcanvasNotificationExampleSource
import { ReactNode, useState } from 'react';
import Button from '@/components/ui/Button';
import Offcanvas, {
	Content,
	OffcanvasBody,
	OffcanvasFooter,
	OffcanvasHeader,
} from '@/components/ui/Offcanvas';
import Avatar from '@/components/ui/Avatar';
import USERS from '@/mocks/users.mock';
import ButtonGroup from '@/components/ui/ButtonGroup';
import dayjs from 'dayjs';
import Empty from '@/components/ui/Empty';

type Tab = {
	label: string;
	content: ReactNode;
};

const OffcanvasNotificationExample = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<number>(0);

	const tabs: Tab[] = [
		{
			label: 'All',
			content: (
				<div className='max-h-96 divide-y divide-zinc-500/10 overflow-auto'>
					<div className='group/item relative flex gap-4 bg-zinc-500/10 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.nicolasLefevre.image.org} />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>2 hours ago</div>
							<div className='font-bo"d'>
								{`${USERS.nicolasLefevre.firstName} ${
									USERS.nicolasLefevre.lastName
								}`}
							</div>
							<div className='text-zinc-500'>
								changed an issue from 'in Progress' to 'Review'
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button aria-label='Delete' icon='Delete02' variant='link' />
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='invisible size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.oliviaNovak.image.org} color='amber' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>3 days ago</div>
							<div className='font-bold'>
								{`${USERS.oliviaNovak.firstName} ${USERS.oliviaNovak.lastName}`}
							</div>
							<div className='text-zinc-500'>mentioned you in a comment</div>
							<div className='border-s-4 border-zinc-500 ps-2'>
								Nice work, love! You really nailed it. Keep it up!
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button aria-label='Delete' icon='Delete02' variant='link' />
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 bg-zinc-500/10 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.danielaPetrova.image.org} color='emerald' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>
								{dayjs().add(-5, 'days').format('DD MMM YYYY')}
							</div>
							<div className='font-bold'>
								{`${USERS.danielaPetrova.firstName} ${
									USERS.danielaPetrova.lastName
								}`}
							</div>
							<div className='text-zinc-500'>
								Unusual activity detected in your account.
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button
									aria-label='Delete'
									icon='Delete02'
									rightIcon='A'
									variant='link'
								/>
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='invisible size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.aulisTiainen.image.org} color='violet' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>
								{dayjs().add(-5, 'days').format('DD MMM YYYY')}
							</div>
							<div className='font-bold'>
								{`${USERS.aulisTiainen.firstName} ${USERS.aulisTiainen.lastName}`}
							</div>
							<div className='text-zinc-500'>
								Unusual activity detected in your account.
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button
									aria-label='Delete'
									icon='Delete02'
									rightIcon='A'
									variant='link'
								/>
							</ButtonGroup>
						</div>
					</div>
				</div>
			),
		},
		{
			label: 'Archived',
			content: (
				<div className='flex flex-col items-center justify-center gap-4 px-4 py-8'>
					<div className='text-xl font-bold'>No Archived data</div>
					<div className='text-zinc-500'>
						No data here yet. We will notify you when there's an update.
					</div>
					<div className='w-full max-w-sm'>
						<Empty />
					</div>
					<Button aria-label='Learn more' variant='soft' color='zinc' className='mb-8'>
						Learn more
					</Button>
				</div>
			),
		},
	];

	return (
		<>
			<Button
				aria-label='Notification'
				variant='soft'
				icon='Notification01'
				onClick={() => setIsOpen(true)}>
				Notification
			</Button>
			<Offcanvas isOpen={isOpen} setIsOpen={setIsOpen}>
				<OffcanvasHeader
					rightContent={
						<Button aria-label='Settings' icon='Settings02' variant='link' />
					}>
					Notification
				</OffcanvasHeader>
				<OffcanvasBody className='px-0!'>
					<div className='flex gap-4 border-b-2 border-zinc-500/25 px-4 pb-2'>
						{tabs.map((tab, i) => (
							<Button
								aria-label={tab.label}
								key={tab.label}
								onClick={() => setActiveTab(i)}
								variant={activeTab === i ? 'soft' : 'link'}>
								{tab.label}
							</Button>
						))}
					</div>
					{tabs[activeTab].content}
				</OffcanvasBody>
				<OffcanvasFooter className='border-t border-zinc-500/25 pt-4'>
					<Button
						aria-label='Mark all as read'
						icon='TickDouble02'
						variant='link'
						className='w-full'>
						Mark all as read
					</Button>
				</OffcanvasFooter>
			</Offcanvas>
		</>
	);
};

export default OffcanvasNotificationExample;
// @end-snippet:: offcanvasNotificationExampleSource

// FOR DEVELOPMENT PREVIEW
export const OffcanvasNotificationExamplePreview = () => {
	const [activeTab, setActiveTab] = useState<number>(0);

	const tabs: Tab[] = [
		{
			label: 'All',
			content: (
				<div className='max-h-96 divide-y divide-zinc-500/10 overflow-auto'>
					<div className='group/item relative flex gap-4 bg-zinc-500/10 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.nicolasLefevre.image.org} />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>2 hours ago</div>
							<div className='font-bo"d'>
								{`${USERS.nicolasLefevre.firstName} ${
									USERS.nicolasLefevre.lastName
								}`}
							</div>
							<div className='text-zinc-500'>
								changed an issue from 'in Progress' to 'Review'
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button aria-label='Delete' icon='Delete02' variant='link' />
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='invisible size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.oliviaNovak.image.org} color='amber' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>3 days ago</div>
							<div className='font-bold'>
								{`${USERS.oliviaNovak.firstName} ${USERS.oliviaNovak.lastName}`}
							</div>
							<div className='text-zinc-500'>mentioned you in a comment</div>
							<div className='border-s-4 border-zinc-500 ps-2'>
								Nice work, love! You really nailed it. Keep it up!
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button aria-label='Delete' icon='Delete02' variant='link' />
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 bg-zinc-500/10 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.danielaPetrova.image.org} color='emerald' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>
								{dayjs().add(-5, 'days').format('DD MMM YYYY')}
							</div>
							<div className='font-bold'>
								{`${USERS.danielaPetrova.firstName} ${
									USERS.danielaPetrova.lastName
								}`}
							</div>
							<div className='text-zinc-500'>
								Unusual activity detected in your account.
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button
									aria-label='Delete'
									icon='Delete02'
									rightIcon='A'
									variant='link'
								/>
							</ButtonGroup>
						</div>
					</div>
					<div className='group/item relative flex gap-4 p-2'>
						<div>
							<div className='flex items-center gap-2'>
								<div className='flex w-2 justify-center'>
									<div className='invisible size-2 rounded-full bg-blue-500'></div>
								</div>
								<div>
									<Avatar src={USERS.aulisTiainen.image.org} color='violet' />
								</div>
							</div>
						</div>
						<div>
							<div className='text-sm text-zinc-500'>
								{dayjs().add(-5, 'days').format('DD MMM YYYY')}
							</div>
							<div className='font-bold'>
								{`${USERS.aulisTiainen.firstName} ${USERS.aulisTiainen.lastName}`}
							</div>
							<div className='text-zinc-500'>
								Unusual activity detected in your account.
							</div>
						</div>
						<div className='invisible absolute top-2 right-2 group-hover/item:visible'>
							<ButtonGroup
								className='rounded-xl border border-zinc-500/25'
								dimension='sm'>
								<Button aria-label='Accept' icon='Tick02' variant='link' />
								<Button
									aria-label='Delete'
									icon='Delete02'
									rightIcon='A'
									variant='link'
								/>
							</ButtonGroup>
						</div>
					</div>
				</div>
			),
		},
		{
			label: 'Archived',
			content: (
				<div className='flex flex-col items-center justify-center gap-4 px-4 py-8'>
					<div className='text-xl font-bold'>No Archived data</div>
					<div className='text-zinc-500'>
						No data here yet. We will notify you when there's an update.
					</div>
					<div className='w-full max-w-sm'>
						<Empty />
					</div>
					<Button aria-label='Learn more' variant='soft' color='zinc' className='mb-8'>
						Learn more
					</Button>
				</div>
			),
		},
	];
	return (
		<Content>
			<OffcanvasHeader
				rightContent={<Button aria-label='Settings' icon='Settings02' variant='link' />}>
				Notification
			</OffcanvasHeader>
			<OffcanvasBody className='px-0!'>
				<div className='flex gap-4 border-b-2 border-zinc-500/25 px-4 pb-2'>
					{tabs.map((tab, i) => (
						<Button
							aria-label={tab.label}
							key={tab.label}
							onClick={() => setActiveTab(i)}
							variant={activeTab === i ? 'soft' : 'link'}>
							{tab.label}
						</Button>
					))}
				</div>
				{tabs[activeTab].content}
			</OffcanvasBody>
			<OffcanvasFooter className='border-t border-zinc-500/25 pt-4'>
				<Button
					aria-label='Mark all as read'
					icon='TickDouble02'
					variant='link'
					className='w-full'>
					Mark all as read
				</Button>
			</OffcanvasFooter>
		</Content>
	);
};
