import ButtonGroup from '@/components/ui/ButtonGroup';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';

const DropdownButtonGroupExample = () => {
	return (
		<ButtonGroup variant='soft'>
			<Button aria-label='Send'>Send</Button>
			<Dropdown>
				<DropdownToggle hasIcon={false}>
					<Button
						variant='soft'
						className='ltr:rounded-s-none rtl:rounded-e-none'
						icon='ArrowUp01'
						aria-label='Dropdown'
					/>
				</DropdownToggle>
				<DropdownMenu placement='top-end'>
					<DropdownItem icon='Sent02'>Send</DropdownItem>
					<DropdownItem icon='InboxCheck'>Send & Archive</DropdownItem>
					<DropdownItem icon='Calendar02'>Schedule send</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		</ButtonGroup>
	);
};

export default DropdownButtonGroupExample;
