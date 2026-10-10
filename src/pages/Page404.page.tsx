import Button from '@/components/ui/Button';
import AppLogo from '@/components/AppLogo';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';

const Page404Page = () => {
	const navigate = useNavigate();

	return (
		<div className='flex h-full flex-col items-center justify-stretch p-8'>
			<button aria-label='Homepage' onClick={() => navigate('/')}>
				<span className='flex cursor-pointer items-center gap-3'>
					<AppLogo className='size-14' rounded='rounded-2xl' alt='' />
					<span className='text-3xl font-black tracking-tight text-zinc-950 dark:text-white'>
						agent1o1
					</span>
				</span>
			</button>
			<div className='flex h-full flex-col items-center justify-center gap-4'>
				<div className='text-9xl font-black'>404</div>
				<div className='text-4xl font-bold'>Oops! Page Not Found️.</div>
				<div className=''>Sorry, the page you're looking for cannot be found.</div>
				<Button
					aria-label='Homepage'
					variant='solid'
					color='primary'
					icon='ArrowLeft01'
					dimension='lg'
					onClick={() => navigate('/')}>
					Back to Home
				</Button>
			</div>
			<div className='text-zinc-500'>© All Rights Reserved. {dayjs().format('YYYY')}.</div>
		</div>
	);
};

export default Page404Page;
