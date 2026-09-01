// @start-snippet:: listGroupLogoWithButtonExampleSource
import { Facebook, Google, Yandex } from '@/assets/images';
import Button from '@/components/ui/Button';

const ListGroupLogoWithButtonExample = () => {
	return (
		<div className='flex flex-col gap-4 divide-y divide-zinc-500/25 [&>*]:pb-4'>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex items-center gap-4'>
					<img src={Google} alt='Gmail account' className='size-12' />
					<div className=''>
						<div className='text-lg font-bold'>Gmail account</div>
						<div className='text-zinc-500'>Import your Gmail account contacts.</div>
					</div>
				</div>
				<Button aria-label='Connect' variant='solid'>
					Connect
				</Button>
			</div>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex items-center gap-4'>
					<img src={Facebook} alt='Facebook' className='size-12' />
					<div className=''>
						<div className='text-lg font-bold'>Facebook</div>
						<div className='text-zinc-500'>Import your Facebook contacts.</div>
					</div>
				</div>
				<Button aria-label='Connect' variant='solid'>
					Connect
				</Button>
			</div>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex items-center gap-4'>
					<img src={Yandex} alt='Yandex' className='size-12' />
					<div className=''>
						<div className='text-lg font-bold'>Yandex</div>
						<div className='text-zinc-500'>Import your Yandex contacts.</div>
					</div>
				</div>
				<Button aria-label='Connect' variant='solid'>
					Connect
				</Button>
			</div>
		</div>
	);
};

export default ListGroupLogoWithButtonExample;
// @end-snippet:: listGroupLogoWithButtonExampleSource
