import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { useGrantManualReferralReward } from '@/api/modules/admin-referrals';
import { usePlans } from '@/api/modules/billing';
import { ApiError, notify } from '@/api/core';
import { useWorkspaceContext } from '@/context/workspace';
import type { TManualReferralRewardDto } from '@/types/admin-referral.type';
import type { TReferralRewardType } from '@/types/referral.type';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { Field, fieldClass } from '../../Referrals/_partial/ReferralUi.partial';
import { REWARD_TYPE_LABEL } from '../../Referrals/_helper/referral.helper';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';

/**
 * A goodwill reward handed out directly — it goes on the same ledger as
 * earned rewards and is granted immediately. Render it with a `key` that
 * changes per opening so its fields start empty.
 */
const ManualRewardModal: FC<{
	isOpen: boolean;
	onClose: () => void;
	userId?: string;
	userLabel?: string;
}> = ({ isOpen, onClose, userId, userLabel }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: plans = [] } = usePlans(activeWorkspaceId);
	const grant = useGrantManualReferralReward();

	const [recipient, setRecipient] = useState(userId ?? '');
	const [type, setType] = useState<TReferralRewardType>('credits');
	const [amount, setAmount] = useState('');
	const [planId, setPlanId] = useState('');
	const [notes, setNotes] = useState('');
	const [errors, setErrors] = useState<Record<string, string | undefined>>({});

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		const value = Number(amount);
		const body: TManualReferralRewardDto = {
			user_id: recipient.trim(),
			reward_type: type,
			notes: notes.trim() || undefined,
			...(type === 'credits' && { credits: value }),
			...(type === 'plan_time' && { plan_id: planId, duration_days: value }),
			...(type === 'stripe_balance_credit' && { amount_cents: Math.round(value * 100) }),
			...(type === 'trial_extension' && { trial_days: value }),
		};

		try {
			await grant.mutateAsync(body);
			notify.success('Reward granted.');
			setAmount('');
			setNotes('');
			onClose();
		} catch (err) {
			if (ApiError.is(err)) {
				setErrors({
					user_id: err.field('user_id'),
					amount:
						err.field('credits') ??
						err.field('duration_days') ??
						err.field('amount_cents') ??
						err.field('trial_days'),
					plan_id: err.field('plan_id'),
				});
			}
		}
	};

	const amountLabel = {
		credits: 'Credits',
		plan_time: 'Days of free plan time',
		stripe_balance_credit: 'Invoice credit (USD)',
		trial_extension: 'Extra trial days',
	}[type];

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={onClose}>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					Give a reward{userLabel ? ` to ${userLabel}` : ''}
				</span>
			</ModalHeader>
			<form onSubmit={submit}>
				<ModalBody>
					<div className='grid gap-4 pt-2 sm:grid-cols-2'>
						{!userId && (
							<div className='sm:col-span-2'>
								<Field
									label='User ID'
									hint='Copy it from the Referrals or Codes tab.'
									error={errors.user_id}>
									<input
										required
										value={recipient}
										onChange={(e) => setRecipient(e.target.value)}
										className={fieldClass}
									/>
								</Field>
							</div>
						)}
						<Field label='Reward'>
							<select
								className={fieldClass}
								value={type}
								onChange={(e) => setType(e.target.value as TReferralRewardType)}>
								{(Object.keys(REWARD_TYPE_LABEL) as TReferralRewardType[]).map(
									(key) => (
										<option key={key} value={key}>
											{REWARD_TYPE_LABEL[key]}
										</option>
									),
								)}
							</select>
						</Field>
						<Field label={amountLabel} error={errors.amount}>
							<input
								required
								type='number'
								min={type === 'stripe_balance_credit' ? 0.01 : 1}
								step={type === 'stripe_balance_credit' ? 0.01 : 1}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className={fieldClass}
							/>
						</Field>
						{type === 'plan_time' && (
							<div className='sm:col-span-2'>
								<Field label='Plan' error={errors.plan_id}>
									<select
										required
										className={fieldClass}
										value={planId}
										onChange={(e) => setPlanId(e.target.value)}>
										<option value=''>Choose a plan…</option>
										{plans.map((plan) => (
											<option key={plan.id} value={plan.id}>
												{plan.name}
											</option>
										))}
									</select>
								</Field>
							</div>
						)}
						<div className='sm:col-span-2'>
							<Field
								label='Note (optional)'
								hint='Stored on the reward, e.g. "Sorry about the outage".'>
								<input
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className={fieldClass}
								/>
							</Field>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<button type='button' onClick={onClose} className={secondaryBtn}>
							Cancel
						</button>
						<button type='submit' disabled={grant.isPending} className={primaryBtn}>
							{grant.isPending ? 'Granting…' : 'Grant reward'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ManualRewardModal;
