import { AlertTriangle, Info } from 'lucide-react';
import { CREDIT_SOURCE_LABELS } from '@/constants/creditSource.constant';
import type { TCreditGrant, TFreeCreditsStatus } from '@/types/billing.type';

const fmtExpiry = (value: string | null) =>
	value === null
		? 'never expires'
		: `expires ${new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

/**
 * Where the workspace's credits come from and when each block expires, in
 * the order they will be spent, plus any debt and why free credits are
 * withheld. Credits belong to this workspace only.
 */
const CreditBreakdown = ({
	grants,
	debt,
	freeCredits,
}: {
	grants: TCreditGrant[];
	debt: number;
	freeCredits: TFreeCreditsStatus | null;
}) => {
	const shown = grants.filter((grant) => grant.remaining > 0);

	return (
		<div className='mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
			{shown.length > 0 && (
				<ul className='space-y-1.5'>
					{shown.map((grant) => (
						<li
							key={grant.id}
							className='flex items-center justify-between gap-3 text-xs font-semibold'>
							<span className='text-zinc-700 dark:text-zinc-300'>
								{CREDIT_SOURCE_LABELS[grant.source]}
							</span>
							<span className='text-right text-zinc-500 dark:text-zinc-400'>
								<span className='font-bold text-zinc-900 dark:text-zinc-100'>
									{grant.remaining.toLocaleString()}
								</span>{' '}
								· {fmtExpiry(grant.expires_at)}
							</span>
						</li>
					))}
				</ul>
			)}
			{debt > 0 && (
				<p className='flex items-start gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400'>
					<AlertTriangle size={14} className='mt-px shrink-0' />
					{debt.toLocaleString()} credits of past usage are unpaid. The next credits this
					workspace receives pay them first.
				</p>
			)}
			{freeCredits && !freeCredits.eligible && freeCredits.reason && (
				<p className='flex items-start gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
					<Info size={14} className='mt-px shrink-0' />
					{freeCredits.reason}
				</p>
			)}
		</div>
	);
};

export default CreditBreakdown;
