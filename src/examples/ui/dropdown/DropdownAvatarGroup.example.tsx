import Dropdown, { DropdownContent, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';
import AvatarGroup from '@/components/ui/AvatarGroup';
import user from '@/mocks/users.mock';

const DropdownAvatarGroupExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<div className='flex items-center gap-2'>
					<AvatarGroup size='w-8'>
						<Avatar src={Avatar1} color='amber' />
						<Avatar src={Avatar2} color='emerald' />
						<Avatar src={Avatar3} color='secondary' />
					</AvatarGroup>
					<div className='font-bold'>+1</div>
				</div>
			</DropdownToggle>
			<DropdownMenu>
				<DropdownContent className='text-zinc-500'> Last seen by</DropdownContent>
				<DropdownContent>
					<div className='flex items-center gap-4 py-2'>
						<Avatar src={user.aulisTiainen.image.org} />
						<div className=''>
							<div>
								{`${user.aulisTiainen.firstName} ${user.aulisTiainen.lastName}`}
							</div>
							<div className='text-sm text-zinc-500'>Last seen 1 hour ago</div>
						</div>
					</div>
				</DropdownContent>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownAvatarGroupExample;
