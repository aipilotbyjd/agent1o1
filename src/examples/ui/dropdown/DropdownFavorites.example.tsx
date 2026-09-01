import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { Product1, Product2 } from '@/assets/images';
import priceFormat from '@/utils/priceFormat.util';

const DropdownFavoritesExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<div className='relative'>
					<Button variant='link' aria-label=''>
						<Icon icon='Favourite' size='text-2xl' />
					</Button>
					<span className='absolute end-0 top-0 -mt-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500 p-1 text-sm leading-none text-white'>
						2
					</span>
				</div>
			</DropdownToggle>
			<DropdownMenu className='min-w-xs'>
				<div className='text-xl font-bold'>Favorites</div>
				<div className='flex flex-col gap-4'>
					<div className='flex gap-4'>
						<img src={Product1} alt='' className='aspect-[2/3] w-20 rounded-lg' />
						<div className='flex flex-col gap-2'>
							<div className='text-lg font-bold'>Headphone</div>
							<div className='flex gap-2'>
								<span className='text-zinc-500 line-through'>
									{priceFormat(79)}
								</span>
								<span className='text-red-500'>{priceFormat(49)}</span>
							</div>
							<span className='cursor-pointer underline hover:opacity-75'>
								Remove
							</span>
						</div>
					</div>
					<div className='flex gap-4'>
						<img src={Product2} alt='' className='aspect-[2/3] w-20 rounded-lg' />
						<div className='flex flex-col gap-2'>
							<div className='text-lg font-bold'>Headphone</div>
							<div className='flex gap-2'>
								<span className=''>{priceFormat(135)}</span>
							</div>
							<span className='cursor-pointer underline hover:opacity-75'>
								Remove
							</span>
						</div>
					</div>
				</div>
				<div className='flex items-center justify-center border-t border-zinc-500/10 pt-2'>
					<span className='cursor-pointer underline hover:opacity-75'>
						View favorites
					</span>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownFavoritesExample;
