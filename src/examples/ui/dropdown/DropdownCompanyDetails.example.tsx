import Dropdown, { DropdownDivider, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Badge from '@/components/ui/Badge';
import { Logo } from '@/assets/images';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const DropdownCompanyDetailsExample = () => {
	return (
		<Dropdown>
			<DropdownToggle trigger='hover'>
				<Badge color='zinc' variant='soft' className='py-2'>
					<img src={Logo} alt='Boltify' className='size-8' />
					Boltify | Omtanke Studio
				</Badge>
			</DropdownToggle>
			<DropdownMenu placement='bottom'>
				<div className='flex items-center gap-4'>
					<div className='flex grow items-center gap-4'>
						<img src={Logo} alt='Boltify' className='size-12' />
						<div>
							<div className='font-bold'>Boltify</div>
							<div className='text-xs text-zinc-500'>@omtanke.studio</div>
						</div>
					</div>
					<div className=''>
						<Button
							variant='outline'
							color='zinc'
							dimension='sm'
							aria-label='Following'>
							Following
						</Button>
					</div>
				</div>
				<DropdownDivider />
				<div className='flex gap-4 text-zinc-500'>
					<div className='flex items-center gap-2'>
						<Icon icon='Briefcase01' />
						<span>3 Projects</span>
					</div>
					<div className='flex items-center gap-2'>
						<Icon icon='UserMultiple03' />
						<span>5 Members</span>
					</div>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownCompanyDetailsExample;
