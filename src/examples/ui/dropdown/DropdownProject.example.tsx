import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import { Logo, LogoFacit, LogoFyr } from '@/assets/images';
import Icon from '@/components/icon/Icon';

const DropdownProjectExample = () => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Project' variant='link' className='!px-0'>
					Project
				</Button>
			</DropdownToggle>
			<DropdownMenu>
				<DropdownItem className='gap-2'>
					<img src={Logo} alt='' className='size-10' />
					<div className='flex flex-col'>
						<div className='font-bold'>Boltify</div>
						<div className='text-sm text-zinc-500'>boltify.omtanke.studio</div>
					</div>
					<Icon icon='Tick02' size='text-xl' className='ms-auto' />
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<img src={LogoFacit} alt='' className='size-10' />
					<div className='flex flex-col'>
						<div className='font-bold'>Facit</div>
						<div className='text-sm text-zinc-500'>facit.omtanke.studio</div>
					</div>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<img src={LogoFyr} alt='' className='size-10' />
					<div className='flex flex-col'>
						<div className='font-bold'>Fyr</div>
						<div className='text-sm text-zinc-500'>fyr.omtanke.studio</div>
					</div>
				</DropdownItem>
				<DropdownDivider />
				<DropdownItem icon='AddCircle'>Add new project</DropdownItem>
				<DropdownDivider />
				<DropdownItem>
					<div>Sign out</div>
					<div className='ms-auto text-sm text-zinc-500'>boltify.omtanke.studio</div>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownProjectExample;
