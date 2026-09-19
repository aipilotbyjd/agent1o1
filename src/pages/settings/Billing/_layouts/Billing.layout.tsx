import { Outlet, NavLink } from 'react-router';
import { CreditCard, History, Layers, LayoutGrid } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';

const settingsPages = pages.workspaceSettings.subPages!;
const billingPages = settingsPages.billing.subPages!;

const tabs = [
	{ to: settingsPages.billing.to, label: 'Overview', icon: LayoutGrid, end: true },
	{ to: billingPages.plans.to, label: 'Plans', icon: Layers, end: false },
	{ to: billingPages.credits.to, label: 'Buy Credits', icon: CreditCard, end: false },
	{ to: billingPages.history.to, label: 'History', icon: History, end: false },
];

const BillingLayout = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const toWorkspacePath = (to: string) => to.replace(':workspaceId', activeWorkspaceId);

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6 flex items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/50'>
				{tabs.map(({ to, label, icon: Icon, end }) => (
					<NavLink
						key={to}
						to={toWorkspacePath(to)}
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
