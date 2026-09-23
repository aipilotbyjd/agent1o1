import { Link } from 'react-router';
import Icon from '@/components/icon/Icon';
import { AsideHead } from '@/components/layout/Aside';
import useAsideStatus from '@/hooks/useAsideStatus';
import AppLogo from '@/components/AppLogo';

const AsideHeaderPart = () => {
	const { asideStatus, setAsideStatus } = useAsideStatus();

	return (
		<AsideHead>
			{asideStatus && (
				<Link to='/' aria-label='Agent1o1 home' className='flex items-center gap-2.5'>
					<AppLogo
						className='size-10 transition-all duration-300 ease-in-out'
						rounded='rounded-xl'
						alt=''
					/>
					<span className='text-lg font-black tracking-tight text-zinc-950 dark:text-white'>
						agent1o1
					</span>
				</Link>
			)}
			<button
				type='button'
				aria-label='Toggle Aside Menu'
				onClick={() => setAsideStatus(!asideStatus)}
				className='flex h-12 w-12 cursor-pointer items-center justify-center text-zinc-500'>
				<Icon icon={asideStatus ? 'SidebarLeft01' : 'SidebarLeft'} size='text-2xl' />
			</button>
		</AsideHead>
	);
};

export default AsideHeaderPart;
