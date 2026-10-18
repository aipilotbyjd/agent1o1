import { FC, ReactNode } from 'react';
import { Link } from 'react-router';
import AppLogo from '@/components/AppLogo';

type TAuthCardHeaderProps = {
	/** Content on the right of the wordmark, e.g. a "Sign in" link or "Step 2 of 2". */
	right: ReactNode;
};

const AuthCardHeader: FC<TAuthCardHeaderProps> = ({ right }) => (
	<div className='mb-6 flex items-center justify-between'>
		<Link to='/' className='group flex items-center gap-2'>
			<AppLogo
				variant='light'
				className='ring-primary-500/25 size-9 shadow-[0_4px_12px_-2px_rgb(183_229_47/0.4)] ring-1 transition-transform group-hover:scale-105'
				rounded='rounded-xl'
			/>
			<div className='flex items-baseline'>
				<span className='text-xl font-black tracking-tight text-zinc-950'>agent</span>
				<span className='decoration-primary-500 text-xl font-black tracking-tight text-zinc-950 underline decoration-[3px] underline-offset-4'>
					1o1
				</span>
			</div>
		</Link>

		<div className='text-xs text-zinc-500'>{right}</div>
	</div>
);

export default AuthCardHeader;
