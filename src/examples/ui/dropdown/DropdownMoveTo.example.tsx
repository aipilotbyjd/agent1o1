import Button from '@/components/ui/Button';
import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';

const DropdownMoveToExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Inbox' variant='link' icon='Inbox'>
					Inbox
				</Button>
			</DropdownToggle>
			<DropdownMenu>
				<div className='flex items-center'>
					<div className='text-zinc-500'>Move to</div>
					<Tooltip text='Create new folder' placement='left'>
						<Button
							aria-label='Add'
							icon='PlusSign'
							dimension='xs'
							variant='outline'
							rounded='rounded-full'
							className='ms-auto'
							color='zinc'
						/>
					</Tooltip>
				</div>
				<DropdownDivider />
				<div className='-mx-2'>
					<Input
						name='filter'
						variant='underline'
						className='w-full'
						placeholder='Search...'
						dimension='sm'
						type='search'
					/>
				</div>
				<DropdownItem icon='Inbox'>
					<div className=''>Inbox</div>
					<div className='ms-auto'>
						<Icon icon='Tick02' />
					</div>
				</DropdownItem>
				<DropdownItem icon='LicenseDraft'>
					<div className=''>Draft</div>
				</DropdownItem>
				<DropdownItem icon='Sent02'>
					<div className=''>Sent</div>
				</DropdownItem>
				<DropdownItem icon='DeliveryBox02'>
					<div className=''>Junk</div>
				</DropdownItem>
				<DropdownItem icon='Delete02'>
					<div className=''>Delete</div>
				</DropdownItem>
				<DropdownItem icon='DeliveryView02'>
					<div className=''>Archive</div>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownMoveToExample;
