import { FC, ReactNode } from 'react';
import { Link } from 'react-router';

type TAuthCardHeaderProps = {
	/** Content on the right of the wordmark, e.g. a "Sign in" link or "Step 2 of 2". */
	right: ReactNode;
};

const AuthCardHeader: FC<TAuthCardHeaderProps> = ({ right }) => (
	<div className='mb-6 flex items-center justify-between'>
		<Link to='/' className='flex items-center gap-2 group'>
			<div className='flex size-9 items-center justify-center rounded-xl bg-primary-600 text-zinc-950 shadow-md shadow-primary-600/30 transition-transform group-hover:scale-105'>
				<svg className='size-5' viewBox='0 0 24 24' fill='currentColor'>
					<path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
				</svg>
			</div>
			<div className='flex items-baseline'>
				<span className='text-xl font-black tracking-tight text-zinc-950'>agent</span>
				<span className='text-xl font-black tracking-tight text-primary-600'>1o1</span>
			</div>
		</Link>

		<div className='text-xs text-zinc-500'>{right}</div>
	</div>
);

export default AuthCardHeader;
