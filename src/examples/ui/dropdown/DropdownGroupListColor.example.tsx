import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';

const DropdownGroupListColorExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button aria-label='More' icon='MoreHorizontalCircle01' variant='link' />
			</DropdownToggle>
			<DropdownMenu rounded='rounded-2xl'>
				<Input
					name='email'
					type='email'
					variant='solid'
					placeholder='Group'
					dimension='sm'
				/>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-zinc-500'></div>
						<span>Gray</span>
					</div>
					<Icon icon='Tick02' size='text-xl' className='ms-auto' />
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-red-500'></div>
						<span>Red</span>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-orange-500'></div>
						<span>Orange</span>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-yellow-500'></div>
						<span>Yellow</span>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-emerald-500'></div>
						<span>Green</span>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-indigo-500'></div>
						<span>Indigo</span>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<div className='flex items-center gap-2'>
						<div className='h-6 w-2 rounded-2xl bg-blue-500'></div>
						<span>Blue</span>
					</div>
				</DropdownItem>
				<hr className='-mx-2 border-zinc-500/25' />
				<DropdownItem icon='Eye'>Hide group</DropdownItem>
				<DropdownItem icon='Delete01' color='red'>
					Delete group
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownGroupListColorExample;
