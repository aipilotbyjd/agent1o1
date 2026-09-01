import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import dayjs from 'dayjs';
import USERS from '@/mocks/users.mock';
import Tooltip from '@/components/ui/Tooltip';

const DropdownNotificationsExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<div className='flex items-center'>
					<Tooltip text='View notifications'>
						<Button
							aria-label='Notification'
							icon='Notification03'
							variant='link'
							className='!p-0'
						/>
					</Tooltip>
				</div>
			</DropdownToggle>
			<DropdownMenu placement='bottom-end' className='max-w-sm !gap-0 !p-0'>
				<div className='flex gap-4 border-b-2 border-inherit p-2'>
					<div className='grow'>
						<Button aria-label='All' variant='solid'>
							All
						</Button>
						<Button aria-label='Archived' variant='link'>
							Archived
						</Button>
					</div>
					<div className=''>
						<Button aria-label='Settings' icon='Settings02' variant='link' />
					</div>
				</div>
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
				<div className='flex items-center justify-center border-t border-zinc-500/10'>
					<Button aria-label='Mark all as read' icon='TickDouble02' variant='link'>
						Mark all as read
					</Button>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownNotificationsExample;
