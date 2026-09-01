// @start-snippet:: userProfileHeaderWithTabsExampleSource
import { Avatar3, Bg } from '@/assets/images';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

const UserProfileHeaderWithTabsExample = () => {
	return (
		<>
			<div
				style={{ backgroundImage: `url(${Bg}` }}
				className='mb-12 flex h-48 items-end justify-center rounded-lg bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% bg-cover bg-top p-4'>
				<Avatar
					src={Avatar3}
					name='Catherine Robertson<'
					size='w-36'
					color='zinc'
					className='relative top-1/3 border-4 border-white backdrop-blur-xl dark:border-zinc-900'
					variant='outline'
				/>
			</div>
			<div className='flex flex-col items-center justify-center'>
				<div className='text-2xl font-bold'>Catherine Robertson</div>
				<div className='text-zinc-500'>catherine.robertson</div>
			</div>
			<div className='flex justify-between'>
				<div>
					<Button aria-label='Details' icon='UserSettings02'>
						Details
					</Button>
					<Button aria-label='Team' icon='UserGroup' variant='link'>
						Team
					</Button>
					<Button aria-label='Project' icon='DocumentValidation' variant='link'>
						Project
					</Button>
					<Button aria-label='Connections' icon='Link04' variant='link'>
						Connections
					</Button>
				</div>
				<Button aria-label='Unfollow' variant='outline' color='zinc'>
					Unfollow
				</Button>
			</div>
		</>
	);
};

export default UserProfileHeaderWithTabsExample;
// @end-snippet:: userProfileHeaderWithTabsExampleSource
