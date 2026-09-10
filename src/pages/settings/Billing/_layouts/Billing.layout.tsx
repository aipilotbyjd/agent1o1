import { Outlet, NavLink } from 'react-router';
import { CreditCard, History, LayoutGrid } from 'lucide-react';
import pages from '@/Routes/pages';

const tabs = [
	{ to: pages.settings.subPages.billing.to, label: 'Overview', icon: LayoutGrid, end: true },
	{
		to: pages.settings.subPages.billing.subPages.credits.to,
		label: 'Buy Credits',
		icon: CreditCard,
		end: false,
	},
	{
		to: pages.settings.subPages.billing.subPages.history.to,
		label: 'History',
		icon: History,
		end: false,
	},
];

const BillingLayout = () => {
	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6 flex items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/50'>
				{tabs.map(({ to, label, icon: Icon, end }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						className={({ isActive }) =>
							[
								'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
								isActive
									? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
									: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300',
							].join(' ')
						}>
						<Icon size={15} />
						<span className='hidden sm:inline'>{label}</span>
					</NavLink>
				))}
			</div>
			<Outlet />
		</div>
	);
};

export default BillingLayout;
