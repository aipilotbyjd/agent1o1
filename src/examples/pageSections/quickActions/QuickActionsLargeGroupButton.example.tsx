// @start-snippet:: quickActionsLargeGroupButtonExampleSource
import { Atlassian, Dropbox, Slack } from '@/assets/images';
import Button from '@/components/ui/Button';

const QuickActionsLargeGroupButtonExample = () => {
	return (
		<div className='flex flex-col gap-4'>
			<div className='flex cursor-pointer gap-4 rounded-lg bg-zinc-500/10 p-4 transition-all duration-300 ease-in-out hover:bg-zinc-500/5'>
				<div className='shrink'>
					<img src={Dropbox} alt='' className='size-12' />
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-xl font-bold'>Dropbox</div>
					<div className='text-zinc-500'>
						Connect the application to manage shared files
					</div>
					<div className=''>
						<Button aria-label='Connect' className='p-0!'>
							Connect
						</Button>
					</div>
				</div>
			</div>
			<div className='flex cursor-pointer gap-4 rounded-lg bg-zinc-500/10 p-4 transition-all duration-300 ease-in-out hover:bg-zinc-500/5'>
				<div className='shrink'>
					<img src={Slack} alt='' className='size-12' />
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-xl font-bold'>Slack</div>
					<div className='text-zinc-500'>
						Connect the application to manage shared files
					</div>
					<div className=''>
						<Button aria-label='Connect' className='p-0!'>
							Connect
						</Button>
					</div>
				</div>
			</div>
			<div className='flex cursor-pointer gap-4 rounded-lg bg-zinc-500/10 p-4 transition-all duration-300 ease-in-out hover:bg-zinc-500/5'>
				<div className='shrink'>
					<img src={Atlassian} alt='' className='size-12' />
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-xl font-bold'>Atlassian</div>
					<div className='text-zinc-500'>
						Connect the application to manage shared files
					</div>
					<div className=''>
						<Button aria-label='Connect' className='p-0!'>
							Connect
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QuickActionsLargeGroupButtonExample;
// @end-snippet:: quickActionsLargeGroupButtonExampleSource
