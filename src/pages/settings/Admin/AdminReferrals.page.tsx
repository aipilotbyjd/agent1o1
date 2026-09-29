import { useState } from 'react';
import classNames from 'classnames';
import AdminGate from './_partial/AdminGate.partial';
import OverviewTab from './_partial/OverviewTab.partial';
import ProgramsTab from './_partial/ProgramsTab.partial';
import RewardsTab from './_partial/RewardsTab.partial';
import ReferralsTab from './_partial/ReferralsTab.partial';
import CodesTab from './_partial/CodesTab.partial';
import BlockedDomainsTab from './_partial/BlockedDomainsTab.partial';

const TABS = {
	overview: { label: 'Overview', Component: OverviewTab },
	programs: { label: 'Programs & rules', Component: ProgramsTab },
	rewards: { label: 'Rewards', Component: RewardsTab },
	referrals: { label: 'Referrals', Component: ReferralsTab },
	codes: { label: 'Codes', Component: CodesTab },
	domains: { label: 'Blocked domains', Component: BlockedDomainsTab },
} as const;

type TTab = keyof typeof TABS;

/**
 * Platform-admin control room for the referral program: everything the
 * program gives, when and to whom is edited here and applies to the next
 * referral event — no deploy needed.
 */
const AdminReferralsPage = () => {
	const [tab, setTab] = useState<TTab>('overview');
	const { Component } = TABS[tab];

	return (
		<AdminGate>
			<div className='mx-auto w-full max-w-[1180px] space-y-6 px-6 py-8 sm:px-10 lg:px-14'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Referral program
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Rewards, rules and limits — changes apply to the next referral event.
					</p>
				</div>

				<div className='flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800'>
					{(Object.keys(TABS) as TTab[]).map((key) => (
						<button
							key={key}
							type='button'
							onClick={() => setTab(key)}
							className={classNames(
								'-mb-px border-b-2 px-3 py-2 text-sm font-bold transition',
								tab === key
									? 'border-primary-500 text-zinc-950 dark:text-zinc-50'
									: 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
							)}>
							{TABS[key].label}
						</button>
					))}
				</div>

				<Component />
			</div>
		</AdminGate>
	);
};

export default AdminReferralsPage;
