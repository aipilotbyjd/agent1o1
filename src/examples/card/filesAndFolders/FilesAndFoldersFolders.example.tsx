// @start-snippet:: filesAndFoldersFoldersExampleSource
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { Product1, Product2 } from '@/assets/images';

const FilesAndFoldersFoldersExample = () => {
	return (
		<div className='grid grid-cols-12 gap-4'>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='flex items-center gap-2'>
							<Icon icon='Folder01' size='text-xl' />
							<div>Videos</div>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='flex items-center gap-2'>
							<Icon icon='Folder01' size='text-xl' />
							<div>Photos</div>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='flex items-center gap-2'>
							<Icon icon='Folder01' size='text-xl' />
							<div>Files</div>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='flex items-center gap-2'>
							<Icon icon='Folder01' size='text-xl' />
							<div>Backup</div>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='-m-2 flex items-center gap-2'>
							<img
								src={Product1}
								alt=''
								className='size-10 rounded-md object-cover'
							/>
							<div>product-1.jpg</div>
						</div>
						<div className='text-xs font-bold text-zinc-500'>1.58 mb</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='-m-2 flex items-center gap-2'>
							<img
								src={Product2}
								alt=''
								className='size-10 rounded-md object-cover'
							/>
							<div>product-2.jpg</div>
						</div>
						<div className='text-xs font-bold text-zinc-500'>2.81 mb</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3'>
				<Card className='cursor-pointer'>
					<CardBody className='m-1 flex items-center justify-between gap-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-zinc-500/10'>
						<div className='flex items-center gap-2'>
							<Icon icon='Pdf01' size='text-xl' color='red' />
							<div>user-list.pdf</div>
						</div>
						<div className='text-xs font-bold text-zinc-500'>286 kb</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default FilesAndFoldersFoldersExample;
// @end-snippet:: filesAndFoldersFoldersExampleSource
