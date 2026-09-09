import Dropdown, {
	DropdownContent,
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';
import user from '@/mocks/users.mock';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import useDarkMode from '@/hooks/useDarkMode';

const DropdownAccountExample = () => {
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	return (
		<Dropdown>
			<DropdownToggle>
				<Avatar src={user.nicolasLefevre.image.org} />
			</DropdownToggle>
			<DropdownMenu className='min-w-xs'>
				<DropdownContent>
					<div className='flex items-center gap-4 py-2'>
						<Avatar src={user.nicolasLefevre.image.org} />
						<div className=''>
							<div>{user.nicolasLefevre.firstName}</div>
							<div className='text-sm text-zinc-500'>{user.nicolasLefevre.email}</div>
						</div>
					</div>
				</DropdownContent>
				<DropdownDivider />
				<DropdownItem icon='ScratchCard'>Billing</DropdownItem>
				<DropdownItem icon='Settings01'>Settings</DropdownItem>
				<DropdownItem icon='User'>My Account</DropdownItem>
				<DropdownDivider />
				<DropdownItem onClick={() => setDarkModeStatus(isDarkTheme ? 'light' : 'dark')}>
					<div>Dark mode</div>
					<Checkbox className='ms-auto' variant='switch' checked={isDarkTheme} />
				</DropdownItem>
				<DropdownDivider />
				<DropdownItem>
					<div>Customization</div>
					<Badge className='ms-auto' variant='soft'>
						New
					</Badge>
				</DropdownItem>
				<DropdownItem>Menage team</DropdownItem>
				<DropdownItem>Sign out</DropdownItem>
				<DropdownDivider />
				<DropdownItem icon='AddCircle'>Add new account</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownAccountExample;
