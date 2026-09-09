import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const DropdownEditTagExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button
					className='gap-2'
					color='zinc'
					variant='soft'
					rounded='rounded-full'
					aria-label='General'>
					<Icon icon='Tag01' color='amber' />
					General
				</Button>
			</DropdownToggle>
			<DropdownMenu>
				<DropdownItem icon='Edit02'>Edit</DropdownItem>
				<DropdownItem icon='Delete03'>Remove</DropdownItem>
				<DropdownItem icon='SearchVisual'>View all</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownEditTagExample;
