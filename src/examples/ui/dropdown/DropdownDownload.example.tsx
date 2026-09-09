import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Checkbox from '@/components/form/Checkbox';

const DropdownDownloadExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button icon='Download02' variant='link' aria-label='Download' />
			</DropdownToggle>
			<DropdownMenu placement='bottom-end' rounded='rounded-2xl'>
				<div className=''>
					<div className='text-xl font-bold'>Download Report</div>
					<div className='text-sm text-zinc-500'>Select Options</div>
				</div>
				<div className='border-b border-zinc-500/25'></div>
				<div className='my-1 flex rounded-xl bg-zinc-500/25 p-1'>
					<Button
						className='w-full'
						variant='solid'
						color='blue'
						icon='EditTable'
						aria-label='Excel'>
						Excel
					</Button>
					<Button
						className='w-full'
						variant='link'
						color='zinc'
						icon='File01'
						aria-label='Word'>
						Word
					</Button>
				</div>
				<div className='border-b border-zinc-500/25'></div>
				<div>
					<div className='flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<Icon icon='PencilEdit01' />
							<span>Section Name</span>
						</div>
						<div>
							<Checkbox checked dimension='sm' />
						</div>
					</div>
				</div>
				<div>
					<div className='flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<Icon icon='FingerPrintScan01' />
							<span>Comparison stats</span>
						</div>
						<div>
							<Checkbox checked dimension='sm' />
						</div>
					</div>
				</div>
				<div>
					<div className='flex items-center gap-4'>
						<div className='flex grow items-center gap-2'>
							<Icon icon='Circle' />
							<span>Legend Indicator</span>
						</div>
						<div>
							<Checkbox checked dimension='sm' />
						</div>
					</div>
				</div>
				<div className='border-b border-zinc-500/25'></div>
				<Button variant='solid' aria-label='Download'>
					Download
				</Button>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownDownloadExample;
