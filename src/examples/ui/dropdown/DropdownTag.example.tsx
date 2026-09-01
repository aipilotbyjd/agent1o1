import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';

const DropdownTagExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button aria-label='Tag' icon='Tag01' variant='link' />
			</DropdownToggle>
			<DropdownMenu>
				<div className='flex items-center'>
					<div className='px-2 text-xl font-bold'>Tags</div>
					<Tooltip text='Create new tag' placement='left'>
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
				<div className='px-2 text-zinc-500'>All tags</div>
				<DropdownItem icon='Bug01'>
					<div className=''>Bug</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='Tags' color='amber' size='text-xl' />
					<div className=''>Generic</div>
					<Icon icon='SquareLock01' color='zinc' />
					<div className='ms-auto'>
						<Checkbox dimension='sm' checked />
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='Tag01' color='blue' size='text-xl' />
					<div className=''>Reviews</div>
					<Icon icon='SquareLock01' color='zinc' />
					<div className='ms-auto'>
						<Checkbox dimension='sm' />
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='CheckmarkCircle02' color='emerald' size='text-xl' />
					<div className=''>Closed</div>
					<div className='ms-auto'>
						<Checkbox dimension='sm' />
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='Comment01' color='zinc' size='text-xl' />
					<div className=''>Feedback</div>
					<Icon icon='SquareLock01' color='zinc' />
					<div className='ms-auto'>
						<Checkbox dimension='sm' checked />
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='UserCircle' color='zinc' size='text-xl' />
					<div className=''>Account</div>
					<div className='ms-auto'>
						<Checkbox dimension='sm' />
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<Icon icon='BubbleChatQuestion' color='violet' size='text-xl' />
					<div className=''>FAQ</div>
					<div className='ms-auto'>
						<Checkbox dimension='sm' />
					</div>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownTagExample;
