import Badge from '@/components/ui/Badge';
import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';
import { Avatar1 } from '@/assets/images';
import Icon from '@/components/icon/Icon';

const DropdownAccountWorkspaceExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Badge
					variant='soft'
					color='zinc'
					rounded='rounded-full'
					className='cursor-pointer transition-all duration-300 ease-in-out hover:opacity-75'>
					<Avatar src={Avatar1} size='w-8' color='zinc' className='my-1.5' />
					John Doe's account
				</Badge>
			</DropdownToggle>
			<DropdownMenu className='max-w-md min-w-xs'>
				<div className='text-zinc-500'>Workspaces (3)</div>
				<DropdownItem>
					<div className='w-8'>
						<Icon icon='Tick02' />
					</div>
					<div className='flex flex-col'>
						<div>GitHub</div>
						<div className='text-sm text-zinc-500'>github.com</div>
					</div>
					<div className='ms-auto'>
						<Avatar name='Git Hub' rounded='rounded-xl' color='zinc' />
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-8'>
						<Icon icon='Tick02' className='invisible' />
					</div>
					<div className='flex flex-col'>
						<div>GitLab</div>
						<div className='text-sm text-zinc-500'>gitlab.com</div>
					</div>
					<div className='ms-auto'>
						<Avatar name='Git Lab' rounded='rounded-xl' color='amber' />
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-8'>
						<Icon icon='PlusSignCircle' />
					</div>
					<div className='flex flex-col'>
						<div>Add a workspace</div>
					</div>
				</DropdownItem>

				<DropdownDivider />
				<div className='text-zinc-500'>Download mobile app</div>
				<DropdownItem>
					<div className='w-8'>
						<Icon icon='CustomAppleAppStore' size='text-xl' />
					</div>
					<div className='flex flex-col'>
						<div>App Store</div>
					</div>
					<div className='ms-auto'>
						<Icon icon='LinkSquare02' />
					</div>
				</DropdownItem>
				<DropdownItem>
					<div className='w-8'>
						<Icon icon='CustomGooglePlay' size='text-xl' />
					</div>
					<div className='flex flex-col'>
						<div>Google Play</div>
					</div>
					<div className='ms-auto'>
						<Icon icon='LinkSquare02' />
					</div>
				</DropdownItem>
				<DropdownDivider />
				<DropdownItem>Invite people to Boltify</DropdownItem>
				<DropdownItem>Preferences</DropdownItem>
				<DropdownItem>Menage workspace</DropdownItem>
				<DropdownDivider />
				<DropdownItem>
					<span>Sign out</span>
					<span className='ms-auto text-sm text-zinc-500'>omtanke.studio</span>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownAccountWorkspaceExample;
