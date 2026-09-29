import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { FlaskConical } from 'lucide-react';
import { useSimulateReferralProgram } from '@/api/modules/admin-referrals';
import type { TBillingInterval, TPlan } from '@/types/billing.type';
import type {
	TReferralPaymentSource,
	TRuleTrigger,
	TSimulationResult,
} from '@/types/admin-referral.type';
import {
	EmptyBlock,
	Field,
	Pill,
	SectionCard,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { RECIPIENT_LABEL, TRIGGER_LABEL } from '../../Referrals/_helper/referral.helper';
import { secondaryBtn } from '../../_shared/buttons';

const TRIGGERS: TRuleTrigger[] = [
	'signup_verified',
	'activated',
	'first_payment',
	'repeat_payment',
	'milestone',
];

const rewardText = (result: TSimulationResult) => {
	const r = result.reward;
	switch (r.reward_type) {
		case 'credits':
			return `${(r.credits ?? 0).toLocaleString('en-US')} credits`;
		case 'plan_time':
			return `${r.duration_days ?? 0} days free`;
		case 'stripe_balance_credit':
			return `$${((r.amount_cents ?? 0) / 100).toFixed(2)} invoice credit`;
		default:
			return `${r.trial_days ?? 0} extra trial days`;
	}
};

/**
 * "What would this program give for this event?" — a dry run against the
 * program's rules. Nothing is written, and workspace-specific adjustments
 * (already on the plan, monthly caps) are left out.
 */
const SimulatorPanel: FC<{ programId: string; plans: TPlan[] }> = ({ programId, plans }) => {
	const simulate = useSimulateReferralProgram();
	const [trigger, setTrigger] = useState<TRuleTrigger>('first_payment');
	const [payment, setPayment] = useState('99');
	const [planId, setPlanId] = useState('');
	const [interval, setBillingInterval] = useState<TBillingInterval | ''>('monthly');
	const [source, setSource] = useState<TReferralPaymentSource>('subscription');
	const [sequence, setSequence] = useState('1');
	const [converted, setConverted] = useState('5');
	const [multiplier, setMultiplier] = useState('1');

	const isPayment = trigger === 'first_payment' || trigger === 'repeat_payment';

	const run = (e: FormEvent) => {
		e.preventDefault();
		simulate.mutate({
			id: programId,
			body: {
				trigger,
				multiplier: Number(multiplier) || 1,
				...(isPayment && {
					payment_cents: Math.round(Number(payment) * 100),
					plan_id: planId || undefined,
					billing_interval: interval || undefined,
					payment_source: source,
					payment_sequence: trigger === 'first_payment' ? 1 : Number(sequence) || 2,
				}),
				...(trigger === 'milestone' && { converted_referrals: Number(converted) || 0 }),
			},
		});
	};

	return (
		<SectionCard
			title='Try it out'
			description="See what this program's rules would give for an event. Nothing is saved or granted.">
			<form onSubmit={run} className='grid gap-3 sm:grid-cols-4'>
				<Field label='Event'>
					<select
						className={fieldClass}
						value={trigger}
						onChange={(e) => setTrigger(e.target.value as TRuleTrigger)}>
						{TRIGGERS.map((t) => (
							<option key={t} value={t}>
								{TRIGGER_LABEL[t]}
							</option>
						))}
					</select>
				</Field>
				{isPayment && (
					<>
						<Field label='Payment (USD)'>
							<input
								type='number'
								min={0}
								step={0.01}
								value={payment}
								onChange={(e) => setPayment(e.target.value)}
								className={fieldClass}
							/>
						</Field>
						<Field label='Plan'>
							<select
								className={fieldClass}
								value={planId}
								onChange={(e) => setPlanId(e.target.value)}>
								<option value=''>Any</option>
								{plans.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</Field>
						<Field label='Interval'>
							<select
								className={fieldClass}
								value={interval}
								onChange={(e) =>
									setBillingInterval(e.target.value as TBillingInterval)
								}>
								{['monthly', 'quarterly', 'yearly', 'lifetime'].map((i) => (
									<option key={i} value={i}>
										{i}
									</option>
								))}
							</select>
						</Field>
						<Field label='Paid for'>
							<select
								className={fieldClass}
								value={source}
								onChange={(e) =>
									setSource(e.target.value as TReferralPaymentSource)
								}>
								<option value='subscription'>Subscription</option>
								<option value='credit_pack'>Credit pack</option>
								<option value='lifetime'>Lifetime plan</option>
							</select>
						</Field>
						{trigger === 'repeat_payment' && (
							<Field label='Payment number'>
								<input
									type='number'
									min={2}
									value={sequence}
									onChange={(e) => setSequence(e.target.value)}
									className={fieldClass}
								/>
							</Field>
						)}
					</>
				)}
				{trigger === 'milestone' && (
					<Field label='Paying referrals'>
						<input
							type='number'
							min={0}
							value={converted}
							onChange={(e) => setConverted(e.target.value)}
							className={fieldClass}
						/>
					</Field>
				)}
				<Field label='Code multiplier'>
					<input
						type='number'
						min={0}
						step={0.1}
						value={multiplier}
						onChange={(e) => setMultiplier(e.target.value)}
						className={fieldClass}
					/>
				</Field>
				<div className='flex items-end'>
					<button
						type='submit'
						disabled={simulate.isPending}
						className={`${secondaryBtn} h-10! w-full`}>
						<FlaskConical size={14} />
						{simulate.isPending ? 'Running…' : 'Run'}
					</button>
				</div>
			</form>

			{simulate.data && (
				<div className='mt-5 space-y-2'>
					{simulate.data.length === 0 ? (
						<EmptyBlock>No rules for this event.</EmptyBlock>
					) : (
						simulate.data.map((result) => (
							<div
								key={result.rule_id}
								className='flex flex-col gap-1 rounded-xl border border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800'>
								<div>
									<p className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
										{result.name}
									</p>
									<p className='text-xs text-zinc-500'>
										{result.applies ? result.description : result.reason}
									</p>
								</div>
								{result.applies ? (
									<div className='flex shrink-0 items-center gap-2'>
										<span className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
											{RECIPIENT_LABEL[result.recipient]}:{' '}
											{rewardText(result)}
										</span>
										<Pill
											tone={
												result.initial_status === 'granted'
													? 'success'
													: 'info'
											}>
											{result.initial_status === 'granted'
												? 'Instantly'
												: result.initial_status === 'pending'
													? `After ${result.hold_days}-day hold`
													: 'Needs approval'}
										</Pill>
									</div>
								) : (
									<Pill tone='neutral'>Doesn&apos;t apply</Pill>
								)}
							</div>
						))
					)}
				</div>
			)}
		</SectionCard>
	);
};

export default SimulatorPanel;
