import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
	useAdminReferralRewards,
	useApproveReferralReward,
	useGrantReferralRewardNow,
	useRevokeReferralReward,
} from '@/api/modules/admin-referrals';
import { notify } from '@/api/core';
import type { TAdminReferralReward } from '@/types/admin-referral.type';
import type { TReferralRewardStatus } from '@/types/referral.type';
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
import { REWARD_STATUS, TRIGGER_LABEL } from '../../Referrals/_helper/referral.helper';
import { primaryBtn } from '../../_shared/buttons';
import ManualRewardModal from './ManualRewardModal.partial';
import ReasonModal from './ReasonModal.partial';

const linkBtn = 'text-xs font-bold transition hover:underline disabled:opacity-40';

/** The reward ledger: approve what's in review, grant early, withdraw, or give one by hand. */
const RewardsTab = () => {
	const [status, setStatus] = useState<TReferralRewardStatus | ''>('awaiting_approval');
	const [page, setPage] = useState(1);
	const { data, isLoading } = useAdminReferralRewards({ status: status || undefined, page });
	const approve = useApproveReferralReward();
	const grantNow = useGrantReferralRewardNow();
	const revoke = useRevokeReferralReward();

	const [revoking, setRevoking] = useState<TAdminReferralReward | null>(null);
	const [manualOpen, setManualOpen] = useState(false);

	return (
		<SectionCard
			title='Rewards'
			description='Everything the program has given, is holding, or is waiting for your approval.'
			actions={
				<>
					<select
						aria-label='Filter by status'
						value={status}
						onChange={(e) => {
							setStatus(e.target.value as TReferralRewardStatus | '');
							setPage(1);
						}}
						className={`${fieldClass} w-auto`}>
						<option value=''>All rewards</option>
						{(Object.keys(REWARD_STATUS) as TReferralRewardStatus[]).map((key) => (
							<option key={key} value={key}>
								{REWARD_STATUS[key].label}
							</option>
						))}
					</select>
					<button
						type='button'
						onClick={() => setManualOpen(true)}
						className={`${primaryBtn} h-10!`}>
						<Plus size={14} />
						Give reward
					</button>
				</>
			}>
			{isLoading ? (
				<LoadingBlock />
			) : !data?.items.length ? (
				<EmptyBlock>No rewards match.</EmptyBlock>
			) : (
				<>
					<TableShell head={['Reward', 'Recipient', 'Reason', 'Status', 'Date', '']}>
						{data.items.map((reward) => (
							<tr key={reward.id}>
								<Td className='font-semibold'>
									{reward.summary}
									{reward.notes && (
										<span className='mt-0.5 block text-[11px] font-medium text-zinc-400'>
											{reward.notes}
										</span>
									)}
								</Td>
								<Td>
									{reward.recipient?.email ?? '—'}
									<span className='block text-[11px] text-zinc-400'>
										{reward.recipient_role === 'referrer'
											? 'Referrer'
											: 'New user'}
									</span>
								</Td>
								<Td>{TRIGGER_LABEL[reward.trigger]}</Td>
								<Td>
									<Pill tone={REWARD_STATUS[reward.status].tone}>
										{REWARD_STATUS[reward.status].label}
									</Pill>
									{reward.revoked_reason && (
										<span className='mt-0.5 block text-[11px] text-zinc-400'>
											{reward.revoked_reason}
										</span>
									)}
								</Td>
								<Td>
									{reward.status === 'pending' && reward.grant_after
										? `Due ${formatDate(reward.grant_after)}`
										: formatDate(reward.granted_at ?? reward.created_at)}
								</Td>
								<Td className='space-x-3 text-right whitespace-nowrap'>
									{reward.status === 'awaiting_approval' && (
										<button
											type='button'
											disabled={approve.isPending}
											onClick={() =>
												approve.mutate(reward.id, {
													onSuccess: () =>
														notify.success('Reward approved.'),
												})
											}
											className={`${linkBtn} text-emerald-600`}>
											Approve
										</button>
									)}
									{(reward.status === 'pending' ||
										reward.status === 'awaiting_approval') && (
										<button
											type='button'
											disabled={grantNow.isPending}
											onClick={() =>
												grantNow.mutate(reward.id, {
													onSuccess: () =>
														notify.success('Reward granted.'),
												})
											}
											className={`${linkBtn} text-blue-600`}>
											Grant now
										</button>
									)}
									{reward.status !== 'revoked' && (
										<button
											type='button'
											onClick={() => setRevoking(reward)}
											className={`${linkBtn} text-red-500`}>
											{reward.status === 'granted' ? 'Revoke' : 'Decline'}
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
				isOpen={revoking !== null}
				title={revoking?.status === 'granted' ? 'Revoke reward' : 'Decline reward'}
				description={
					revoking?.status === 'granted'
						? 'Credits still unspent are taken back, plan time is shortened and invoice credit is reversed.'
						: 'The reward will never be granted.'
				}
				confirmText={revoking?.status === 'granted' ? 'Revoke' : 'Decline'}
				isPending={revoke.isPending}
				onClose={() => setRevoking(null)}
				onConfirm={(reason) =>
					revoking &&
					revoke.mutate(
						{ id: revoking.id, reason },
						{
							onSuccess: () => {
								notify.success('Reward withdrawn.');
								setRevoking(null);
							},
						},
					)
				}
			/>

			<ManualRewardModal
				key={manualOpen ? 'open' : 'closed'}
				isOpen={manualOpen}
				onClose={() => setManualOpen(false)}
			/>
		</SectionCard>
	);
};

export default RewardsTab;
