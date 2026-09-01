import Dropdown, {
	DropdownContent,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';
import user from '@/mocks/users.mock';

const DropdownShopAccountExample = () => {
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
				<hr className='border-zinc-500/25' />
				<DropdownItem icon='User'>Personal Info</DropdownItem>
				<DropdownItem icon='ShoppingCart02'>My Orders</DropdownItem>
				<DropdownItem icon='SearchVisual'>Order Details</DropdownItem>
				<DropdownItem icon='MapsEditing'>Address</DropdownItem>
				<DropdownItem icon='ScratchCard'>Payment</DropdownItem>
				<DropdownItem icon='News01'>Email Newsletter</DropdownItem>
				<hr className='border-zinc-500/25' />
				<DropdownItem icon='Gift'>Gifts Cards</DropdownItem>
				<DropdownItem icon='ReturnRequest'>Returns & Refunds</DropdownItem>
				<hr className='border-zinc-500/25' />
				<DropdownItem icon='Logout03'>Logout</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownShopAccountExample;
