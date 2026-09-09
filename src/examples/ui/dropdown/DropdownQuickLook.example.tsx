import Dropdown, { DropdownContent, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import priceFormat from '@/utils/priceFormat.util';
import Icon from '@/components/icon/Icon';

const DropdownQuickLookExample = () => {
	return (
		<Dropdown>
			<DropdownToggle trigger='hover'>
				<span className='absolute flex h-6 w-6'>
					<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-900 opacity-75 dark:bg-white' />
					<span className='relative inline-flex h-6 w-6 rounded-full bg-zinc-900 dark:bg-white' />
				</span>
			</DropdownToggle>
			<DropdownMenu rounded='rounded-2xl'>
				<DropdownContent className='flex cursor-pointer items-center rounded-md transition-all duration-300 ease-in-out hover:bg-zinc-500/25'>
					<div className=''>
						<div>Wired Headphones</div>
						<div className='text-sm text-zinc-500'>Headphones</div>
						<div className=''>{priceFormat(49)}</div>
					</div>
					<Icon icon='ArrowRight01' className='ms-auto' />
				</DropdownContent>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownQuickLookExample;
