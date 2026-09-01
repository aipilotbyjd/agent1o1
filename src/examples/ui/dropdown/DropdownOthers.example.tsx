import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';

const DropdownOthersExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button aria-label='More' icon='More' variant='link' />
			</DropdownToggle>
			<DropdownMenu placement='bottom-end'>
				<DropdownItem icon='Share08'>Share reports</DropdownItem>
				<DropdownItem icon='FullScreen'>View in fullscreen</DropdownItem>
				<DropdownItem icon='Connect'>Connect other apps</DropdownItem>
				<DropdownDivider />
				<DropdownItem icon='CommentAdd01'>Submit Feedback</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownOthersExample;
