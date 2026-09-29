import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
	useAdminReferrals,
	useRejectReferral,
	useRestoreReferral,
} from '@/api/modules/admin-referrals';
import { notify } from '@/api/core';
import type { TAdminReferral } from '@/types/admin-referral.type';
import type { TReferralStatus } from '@/types/referral.type';
import formatDate from '@/utils/formatDate.util';
import {
	EmptyBlock,
	LoadingBlock,
	Pager,
	Pill,
	SectionCard,
	TableShell,
	Td,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { REFERRAL_STATUS } from '../../Referrals/_helper/referral.helper';
import ReasonModal from './ReasonModal.partial';

const copyId = (id: string) =>
	navigator.clipboard
		.writeText(id)
		.then(() => notify.success('User ID copied.'))
		.catch(() => undefined);

/** Every referral, unmasked. Rejecting one withdraws all the rewards it produced. */
const ReferralsTab = () => {
	const [status, setStatus] = useState<TReferralStatus | ''>('');
	const [page, setPage] = useState(1);
	const { data, isLoading } = useAdminReferrals({ status: status || undefined, page });
	const reject = useRejectReferral();
	const restore = useRestoreReferral();
	const [rejecting, setRejecting] = useState<TAdminReferral | null>(null);

	return (
		<SectionCard
			title='Referrals'
			description='Who referred whom, how far each one got, and why any were rejected.'
			actions={
				<select
					aria-label='Filter by status'
					value={status}
					onChange={(e) => {
						setStatus(e.target.value as TReferralStatus | '');
						setPage(1);
					}}
					className={`${fieldClass} w-auto`}>
					<option value=''>All referrals</option>
					{(Object.keys(REFERRAL_STATUS) as TReferralStatus[]).map((key) => (
						<option key={key} value={key}>
							{REFERRAL_STATUS[key].label}
						</option>
					))}
				</select>
			}>
			{isLoading ? (
				<LoadingBlock />
			) : !data?.items.length ? (
				<EmptyBlock>No referrals match.</EmptyBlock>
			) : (
				<>
					<TableShell head={['Referrer', 'New user', 'Code', 'Status', 'Signed up', '']}>
						{data.items.map((referral) => (
							<tr key={referral.id}>
								<Td>
									<PersonCell person={referral.referrer} />
								</Td>
								<Td>
									<PersonCell person={referral.referred_user} />
								</Td>
								<Td className='font-mono text-xs'>{referral.code ?? '—'}</Td>
								<Td>
									<Pill tone={REFERRAL_STATUS[referral.status].tone}>
										{REFERRAL_STATUS[referral.status].label}
									</Pill>
									{referral.rejection_reason && (
										<span className='mt-0.5 block max-w-[220px] text-[11px] text-zinc-400'>
											{referral.rejection_reason}
										</span>
									)}
								</Td>
								<Td>{formatDate(referral.created_at)}</Td>
								<Td className='text-right whitespace-nowrap'>
									{referral.status === 'rejected' ? (
										<button
											type='button'
											disabled={restore.isPending}
											onClick={() =>
												restore.mutate(referral.id, {
													onSuccess: () =>
														notify.success('Referral restored.'),
												})
											}
											className='text-xs font-bold text-blue-600 hover:underline'>
											Restore
										</button>
									) : (
										<button
											type='button'
											onClick={() => setRejecting(referral)}
											className='text-xs font-bold text-red-500 hover:underline'>
											Reject
										</button>
									)}
								</Td>
							</tr>
						))}
					</TableShell>
					<Pager meta={data.meta} onPage={setPage} />
				</>
			)}

			<ReasonModal
				isOpen={rejecting !== null}
				title='Reject referral'
				description='Every reward this referral produced — for both people — is withdrawn.'
				confirmText='Reject'
				isPending={reject.isPending}
				onClose={() => setRejecting(null)}
				onConfirm={(reason) =>
					rejecting &&
					reject.mutate(
						{ id: rejecting.id, reason },
						{
							onSuccess: () => {
								notify.success('Referral rejected.');
								setRejecting(null);
							},
						},
					)
				}
			/>
		</SectionCard>
	);
};

const PersonCell = ({ person }: { person?: { id: string; name: string; email: string } }) =>
	person ? (
		<div>
			<span className='block font-semibold'>{person.name}</span>
			<span className='flex items-center gap-1 text-[11px] text-zinc-400'>
				{person.email}
				<button type='button' aria-label='Copy user ID' onClick={() => copyId(person.id)}>
					<Copy size={10} />
				</button>
			</span>
		</div>
	) : (
		<>—</>
	);

export default ReferralsTab;
