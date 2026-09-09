import Dropdown, {
	DropdownContent,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';

const DropdownLoginExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Profile' icon='User' variant='link' />
			</DropdownToggle>
			<DropdownMenu className='min-w-xs !px-0 !pt-0' rounded='rounded-2xl'>
				<DropdownContent className='mt-1 !px-1'>
					<div className='flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-500/25 p-4'>
						<div>Account</div>
						<Button aria-label='Login' variant='solid' className='w-full'>
							Login
						</Button>
						<div className='text-sm text-zinc-500'>
							Don't have an account?{' '}
							<a href='/' className='underline'>
								Register
							</a>
						</div>
					</div>
				</DropdownContent>
				<DropdownContent className='flex flex-col gap-2'>
					<DropdownItem icon='ShoppingBasket03'>My orders</DropdownItem>
					<hr className='border-zinc-500/25' />
					<DropdownItem icon='ShipmentTracking'>Order status</DropdownItem>
					<hr className='border-zinc-500/25' />
					<DropdownItem icon='HelpCircle'>Help</DropdownItem>
				</DropdownContent>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownLoginExample;
