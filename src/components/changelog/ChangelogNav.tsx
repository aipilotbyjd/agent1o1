import { Link } from 'react-router';
import { getAccessToken } from '@/api/core';
import pages from '@/Routes/pages';

/** The slim header of the public changelog pages. */
const ChangelogNav = () => {
	const signedIn = !!getAccessToken();

	return (
		<header className='relative z-20 px-5 pt-6'>
			<nav className='mx-auto flex max-w-4xl items-center justify-between rounded-[28px] border border-white bg-white/85 px-4 py-3 shadow-xl shadow-slate-200/70 backdrop-blur'>
				<Link to='/' className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white'>
						A1
					</span>
					<span className='text-xl font-black text-slate-950'>Agent1o1</span>
				</Link>
				<div className='flex items-center gap-3'>
					<Link
						to={pages.welcome.subPages!.pricing.to}
						className='hidden text-sm font-bold text-slate-500 transition hover:text-slate-950 sm:block'>
						Pricing
					</Link>
					<Link
						to={signedIn ? pages.choose.to : pages.identity.login.to}
						className='rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800'>
						{signedIn ? 'Go to app' : 'Log in'}
					</Link>
				</div>
			</nav>
		</header>
	);
};

export default ChangelogNav;
