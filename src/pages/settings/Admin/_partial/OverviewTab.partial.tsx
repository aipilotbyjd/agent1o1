import { useState } from 'react';
import { useAdminReferralStats } from '@/api/modules/admin-referrals';
import {
	EmptyBlock,
	LoadingBlock,
	SectionCard,
	StatTile,
	TableShell,
	Td,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { formatCents, formatNumber, formatPercent } from '../../Referrals/_helper/referral.helper';

const WINDOWS = [7, 30, 90, 365];

const OverviewTab = () => {
	const [days, setDays] = useState(30);
	const { data: stats, isLoading } = useAdminReferralStats(days);

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-end'>
				<select
					aria-label='Time window'
					value={days}
					onChange={(e) => setDays(Number(e.target.value))}
					className={`${fieldClass} w-auto`}>
					{WINDOWS.map((window) => (
						<option key={window} value={window}>
							Last {window} days
						</option>
					))}
				</select>
			</div>

			{isLoading || !stats ? (
				<LoadingBlock />
			) : (
				<>
					<div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
						<StatTile label='Link visits' value={formatNumber(stats.visits)} />
						<StatTile
							label='Signups'
							value={formatNumber(stats.signups)}
							hint={`${formatNumber(stats.rejected)} rejected`}
						/>
						<StatTile
							label='Activation rate'
							value={formatPercent(stats.activation_rate)}
						/>
						<StatTile
							label='Conversion rate'
							value={formatPercent(stats.conversion_rate)}
						/>
						<StatTile
							label='Credits issued'
							value={formatNumber(stats.credits_issued)}
						/>
						<StatTile
							label='Free plan days issued'
							value={formatNumber(stats.plan_days_issued)}
						/>
						<StatTile
							label='Invoice credit issued'
							value={formatCents(stats.invoice_credit_cents_issued)}
						/>
						<StatTile
							label='Credits clawed back'
							value={formatNumber(stats.credits_clawed_back)}
						/>
						<StatTile
							label='Awaiting approval'
							value={formatNumber(stats.rewards_awaiting_approval)}
						/>
						<StatTile label='On hold' value={formatNumber(stats.rewards_pending)} />
						<StatTile
							label='Active free-plan grants'
							value={formatNumber(stats.active_referral_plan_grants)}
						/>
						<StatTile
							label='Rewards granted'
							value={formatNumber(
								stats.rewards_by_recipient.referrer +
									stats.rewards_by_recipient.referee,
							)}
							hint={`${stats.rewards_by_recipient.referrer} referrers · ${stats.rewards_by_recipient.referee} new users`}
						/>
					</div>

					<SectionCard
						title='Top referrers'
						description='By referrals that became paying.'>
						{stats.top_referrers.length === 0 ? (
							<EmptyBlock>No paying referrals in this window.</EmptyBlock>
						) : (
							<TableShell head={['Referrer', 'Email', 'Paying referrals']}>
								{stats.top_referrers.map((row) => (
									<tr key={row.user_id}>
										<Td className='font-semibold'>{row.name ?? '—'}</Td>
										<Td>{row.email ?? '—'}</Td>
										<Td className='tabular-nums'>{row.converted}</Td>
									</tr>
								))}
							</TableShell>
						)}
					</SectionCard>
				</>
			)}
		</div>
	);
};

export default OverviewTab;
