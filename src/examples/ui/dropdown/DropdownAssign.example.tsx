import Dropdown, {
	DropdownContent,
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Avatar from '@/components/ui/Avatar';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import USERS from '@/mocks/users.mock';

const DropdownAssignExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Button
					variant='soft'
					color='zinc'
					rounded='rounded-full'
					className='!px-1'
					aria-label='Dropdown'>
					<AvatarGroup size='w-8'>
						<Avatar src={Avatar1} color='amber' />
						<Avatar src={Avatar2} color='emerald' />
						<Avatar src={Avatar3} color='secondary' />
					</AvatarGroup>
				</Button>
			</DropdownToggle>
			<DropdownMenu className='min-w-xs' fallbackPlacements={['bottom-end', 'top-end']}>
				<DropdownContent className='text-zinc-500'>Assign</DropdownContent>
				<DropdownDivider />
				<div className='-mx-2'>
					<Input
						name='filter'
						variant='underline'
						className='w-full'
						placeholder='Search teammates...'
						dimension='sm'
						type='search'
					/>
				</div>
				<DropdownItem>
					<div className='w-10'>
						<Icon icon='UserCircle02' size='text-3xl' />
					</div>
					<div className='flex flex-col'>
						<div>No assignee</div>
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-10'>
						<Avatar src={USERS.danielaPetrova.image.org} size='w-8' />
					</div>
					<div className='flex flex-col'>
						<div>
							{`${USERS.danielaPetrova.firstName} ${USERS.danielaPetrova.lastName}`}
						</div>
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-10'>
						<Avatar
							src={USERS.johndoe.image.org}
							size='w-8'
							color='amber'
							variant='solid'
						/>
					</div>
					<div className='flex flex-col'>
						<div>{`${USERS.johndoe.firstName} ${USERS.johndoe.lastName}`}</div>
					</div>
					<div className='ms-auto'>
						<Icon icon='Tick02' />
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-10'>
						<Avatar
							src={USERS.nicolasLefevre.image.org}
							size='w-8'
							color='emerald'
							variant='solid'
						/>
					</div>
					<div className='flex flex-col'>
						<div>{`${USERS.nicolasLefevre.firstName} ${USERS.nicolasLefevre.lastName}`}</div>
					</div>
					<div className='ms-auto'>
						<Icon icon='Tick02' />
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-10'>
						<Avatar
							src={USERS.oliviaNovak.image.org}
							size='w-8'
							color='secondary'
							variant='solid'
						/>
					</div>
					<div className='flex flex-col'>
						<div>{`${USERS.oliviaNovak.firstName} ${USERS.oliviaNovak.lastName}`}</div>
					</div>
					<div className='ms-auto'>
						<Icon icon='Tick02' />
					</div>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownAssignExample;
