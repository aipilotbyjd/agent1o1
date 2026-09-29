import { useState } from 'react';
import type { FC, FormEvent, ReactNode } from 'react';
import { useCreateReferralRule, useUpdateReferralRule } from '@/api/modules/admin-referrals';
import { ApiError, notify } from '@/api/core';
import type { TPlan, TBillingInterval } from '@/types/billing.type';
import type {
	TAlreadyOnPlanBehavior,
	TReferralPaymentSource,
	TReferralRule,
	TReferralRuleDto,
	TRuleTrigger,
} from '@/types/admin-referral.type';
import type { TReferralRecipient, TReferralRewardType } from '@/types/referral.type';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { Field, fieldClass } from '../../Referrals/_partial/ReferralUi.partial';
import { REWARD_TYPE_LABEL, TRIGGER_LABEL } from '../../Referrals/_helper/referral.helper';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';

const TRIGGERS: TRuleTrigger[] = [
	'signup_verified',
	'activated',
	'first_payment',
	'repeat_payment',
	'milestone',
];
const PAYMENT_TRIGGERS: TRuleTrigger[] = ['first_payment', 'repeat_payment'];
const INTERVALS: TBillingInterval[] = ['monthly', 'quarterly', 'yearly', 'lifetime'];
const SOURCES: { value: TReferralPaymentSource; label: string }[] = [
	{ value: 'subscription', label: 'Subscriptions' },
	{ value: 'credit_pack', label: 'Credit packs' },
	{ value: 'lifetime', label: 'Lifetime plans' },
];
const ALREADY_ON_PLAN: { value: TAlreadyOnPlanBehavior; label: string }[] = [
	{ value: 'grant_anyway', label: 'Give the plan time anyway' },
	{ value: 'stripe_balance_credit', label: 'Give invoice credit instead' },
	{ value: 'convert_to_credits', label: 'Give credits instead' },
	{ value: 'skip', label: 'Give nothing' },
];

type TForm = {
	name: string;
	trigger: TRuleTrigger;
	recipient: TReferralRecipient;
	reward_type: TReferralRewardType;
	credits_amount: string;
	plan_id: string;
	duration_days: string;
	amount_dollars: string;
	amount_percent_of_plan: string;
	trial_days: string;
	milestone_count: string;
	hold_days: string;
	if_already_on_plan: TAlreadyOnPlanBehavior;
	fallback_credits: string;
	max_per_recipient: string;
	min_payment_dollars: string;
	plan_ids: string[];
	billing_intervals: TBillingInterval[];
	payment_sources: TReferralPaymentSource[];
	starts_at: string;
	ends_at: string;
	is_active: boolean;
};

const str = (value: number | null | undefined) =>
	value === null || value === undefined ? '' : String(value);
const num = (value: string) => (value.trim() === '' ? null : Number(value));

const toForm = (rule?: TReferralRule | null): TForm => ({
	name: rule?.name ?? '',
	trigger: rule?.trigger ?? 'first_payment',
	recipient: rule?.recipient ?? 'referrer',
	reward_type: rule?.reward_type ?? 'credits',
	credits_amount: str(rule?.credits_amount),
	plan_id: rule?.plan_id ?? '',
	duration_days: str(rule?.duration_days),
	amount_dollars: rule?.amount_cents ? String(rule.amount_cents / 100) : '',
	amount_percent_of_plan: str(rule?.amount_percent_of_plan),
	trial_days: str(rule?.trial_days),
	milestone_count: str(rule?.milestone_count),
	hold_days: str(rule?.hold_days),
	if_already_on_plan: rule?.if_already_on_plan ?? 'grant_anyway',
	fallback_credits: str(rule?.fallback_credits),
	max_per_recipient: str(rule?.max_per_recipient),
	min_payment_dollars: rule?.conditions?.min_payment_cents
		? String(rule.conditions.min_payment_cents / 100)
		: '',
	plan_ids: rule?.conditions?.plan_ids ?? [],
	billing_intervals: rule?.conditions?.billing_intervals ?? [],
	payment_sources: rule?.conditions?.payment_sources ?? [],
	starts_at: rule?.starts_at?.slice(0, 10) ?? '',
	ends_at: rule?.ends_at?.slice(0, 10) ?? '',
	is_active: rule?.is_active ?? true,
});

/** Sends only the value columns that matter for the chosen type, so switching type never leaves stale values behind. */
const toDto = (form: TForm): TReferralRuleDto => {
	const conditions = {
		...(form.min_payment_dollars && {
			min_payment_cents: Math.round(Number(form.min_payment_dollars) * 100),
		}),
		...(form.plan_ids.length && { plan_ids: form.plan_ids }),
		...(form.billing_intervals.length && { billing_intervals: form.billing_intervals }),
		...(form.payment_sources.length && { payment_sources: form.payment_sources }),
	};
	const type = form.reward_type;

	return {
		name: form.name.trim(),
		trigger: form.trigger,
		recipient: form.recipient,
		reward_type: type,
		is_active: form.is_active,
		credits_amount: type === 'credits' ? num(form.credits_amount) : null,
		plan_id:
			type === 'plan_time' || type === 'stripe_balance_credit' ? form.plan_id || null : null,
		duration_days: type === 'plan_time' ? num(form.duration_days) : null,
		amount_cents:
			type === 'stripe_balance_credit' && form.amount_dollars
				? Math.round(Number(form.amount_dollars) * 100)
				: null,
		amount_percent_of_plan:
			type === 'stripe_balance_credit' && !form.amount_dollars
				? num(form.amount_percent_of_plan)
				: null,
		trial_days: type === 'trial_extension' ? num(form.trial_days) : null,
		milestone_count: form.trigger === 'milestone' ? num(form.milestone_count) : null,
		hold_days: num(form.hold_days),
		if_already_on_plan: form.if_already_on_plan,
		fallback_credits: type === 'plan_time' ? num(form.fallback_credits) : null,
		max_per_recipient: num(form.max_per_recipient),
		conditions: PAYMENT_TRIGGERS.includes(form.trigger) ? conditions : {},
		starts_at: form.starts_at || null,
		ends_at: form.ends_at || null,
	};
};

const toggle = <T,>(list: T[], value: T) =>
	list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const Checks: FC<{ children: ReactNode }> = ({ children }) => (
	<div className='flex flex-wrap gap-x-4 gap-y-2 pt-1'>{children}</div>
);

const Check: FC<{ checked: boolean; onChange: () => void; label: string }> = ({
	checked,
	onChange,
	label,
}) => (
	<label className='flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
		<input type='checkbox' checked={checked} onChange={onChange} />
		{label}
	</label>
);

/**
 * Create or edit a reward rule. Render it with a `key` per rule so each
 * opening starts from that rule's values.
 *
 * Fields appear for the chosen trigger and
 * reward type; the backend re-checks the whole rule and any field error
 * lands next to its field.
 */
const RuleModal: FC<{
	programId: string;
	rule: TReferralRule | null;
	isOpen: boolean;
	plans: TPlan[];
	onClose: () => void;
}> = ({ programId, rule, isOpen, plans, onClose }) => {
	const create = useCreateReferralRule();
	const update = useUpdateReferralRule();
	const [form, setForm] = useState<TForm>(toForm(rule));
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	const set = <K extends keyof TForm>(key: K, value: TForm[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const err = (...keys: string[]) => keys.map((k) => errors[k]?.[0]).find(Boolean) ?? null;

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			if (rule) {
				await update.mutateAsync({ id: rule.id, body: toDto(form) });
			} else {
				await create.mutateAsync({ programId, body: toDto(form) });
			}
			notify.success(rule ? 'Rule saved.' : 'Rule added.');
			onClose();
		} catch (error) {
			setErrors(ApiError.is(error) ? (error.fields ?? {}) : {});
		}
	};

	const type = form.reward_type;
	const isPayment = PAYMENT_TRIGGERS.includes(form.trigger);

	return (
		<Modal isOpen={isOpen} setIsOpen={(o) => !o && onClose()} size='lg' isScrollable>
			<ModalHeader setIsOpen={onClose}>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					{rule ? 'Edit rule' : 'New rule'}
				</span>
			</ModalHeader>
			<form onSubmit={submit}>
				<ModalBody isScrollable>
					<div className='grid gap-4 pt-2 sm:grid-cols-2'>
						<div className='sm:col-span-2'>
							<Field
								label='Name'
								hint='For you — people see the generated terms.'
								error={err('name')}>
								<input
									required
									value={form.name}
									onChange={(e) => set('name', e.target.value)}
									className={fieldClass}
								/>
							</Field>
						</div>

						<Field label='When' error={err('trigger')}>
							<select
								className={fieldClass}
								value={form.trigger}
								onChange={(e) => set('trigger', e.target.value as TRuleTrigger)}>
								{TRIGGERS.map((t) => (
									<option key={t} value={t}>
										{TRIGGER_LABEL[t]}
									</option>
								))}
							</select>
						</Field>
						<Field label='Who gets it' error={err('recipient')}>
							<select
								className={fieldClass}
								value={form.recipient}
								onChange={(e) =>
									set('recipient', e.target.value as TReferralRecipient)
								}>
								<option value='referrer'>The referrer</option>
								<option value='referee'>The new user</option>
							</select>
						</Field>

						{form.trigger === 'milestone' && (
							<Field label='Paying referrals needed' error={err('milestone_count')}>
								<input
									type='number'
									min={1}
									value={form.milestone_count}
									onChange={(e) => set('milestone_count', e.target.value)}
									className={fieldClass}
								/>
							</Field>
						)}

						<Field label='Reward' error={err('reward_type')}>
							<select
								className={fieldClass}
								value={type}
								onChange={(e) =>
									set('reward_type', e.target.value as TReferralRewardType)
								}>
								{(Object.keys(REWARD_TYPE_LABEL) as TReferralRewardType[]).map(
									(t) => (
										<option key={t} value={t}>
											{REWARD_TYPE_LABEL[t]}
										</option>
									),
								)}
							</select>
						</Field>

						{type === 'credits' && (
							<Field label='Credits' error={err('credits_amount')}>
								<input
									type='number'
									min={1}
									value={form.credits_amount}
									onChange={(e) => set('credits_amount', e.target.value)}
									className={fieldClass}
								/>
							</Field>
						)}

						{(type === 'plan_time' || type === 'stripe_balance_credit') && (
							<Field
								label='Plan'
								hint={
									type === 'stripe_balance_credit'
										? 'Only needed for a percentage of its price.'
										: undefined
								}
								error={err('plan_id')}>
								<select
									className={fieldClass}
									value={form.plan_id}
									onChange={(e) => set('plan_id', e.target.value)}>
									<option value=''>Choose a plan…</option>
									{plans.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</Field>
						)}

						{type === 'plan_time' && (
							<>
								<Field label='Days free' error={err('duration_days')}>
									<input
										type='number'
										min={1}
										value={form.duration_days}
										onChange={(e) => set('duration_days', e.target.value)}
										className={fieldClass}
									/>
								</Field>
								<Field
									label='If they already have this plan'
									error={err('if_already_on_plan')}>
									<select
										className={fieldClass}
										value={form.if_already_on_plan}
										onChange={(e) =>
											set(
												'if_already_on_plan',
												e.target.value as TAlreadyOnPlanBehavior,
											)
										}>
										{ALREADY_ON_PLAN.map((o) => (
											<option key={o.value} value={o.value}>
												{o.label}
											</option>
										))}
									</select>
								</Field>
								{form.if_already_on_plan === 'convert_to_credits' && (
									<Field
										label='Credits instead'
										hint="Empty = the plan's monthly credits for those days."
										error={err('fallback_credits')}>
										<input
											type='number'
											min={0}
											value={form.fallback_credits}
											onChange={(e) =>
												set('fallback_credits', e.target.value)
											}
											className={fieldClass}
										/>
									</Field>
								)}
							</>
						)}

						{type === 'stripe_balance_credit' && (
							<>
								<Field label='Fixed amount (USD)' error={err('amount_cents')}>
									<input
										type='number'
										min={0.01}
										step={0.01}
										value={form.amount_dollars}
										onChange={(e) => set('amount_dollars', e.target.value)}
										className={fieldClass}
									/>
								</Field>
								<Field
									label="…or % of the plan's monthly price"
									error={err('amount_percent_of_plan')}>
									<input
										type='number'
										min={1}
										disabled={!!form.amount_dollars}
										value={form.amount_percent_of_plan}
										onChange={(e) =>
											set('amount_percent_of_plan', e.target.value)
										}
										className={fieldClass}
									/>
								</Field>
							</>
						)}

						{type === 'trial_extension' && (
							<Field label='Extra trial days' error={err('trial_days')}>
								<input
									type='number'
									min={1}
									value={form.trial_days}
									onChange={(e) => set('trial_days', e.target.value)}
									className={fieldClass}
								/>
							</Field>
						)}

						<Field
							label='Hold before granting (days)'
							hint='Empty = program default for payments, none otherwise.'
							error={err('hold_days')}>
							<input
								type='number'
								min={0}
								value={form.hold_days}
								onChange={(e) => set('hold_days', e.target.value)}
								className={fieldClass}
							/>
						</Field>
						<Field
							label='Max times per person'
							hint={
								form.trigger === 'repeat_payment'
									? 'e.g. 3 = reward the first 3 later payments.'
									: 'Empty = no limit.'
							}
							error={err('max_per_recipient')}>
							<input
								type='number'
								min={1}
								value={form.max_per_recipient}
								onChange={(e) => set('max_per_recipient', e.target.value)}
								className={fieldClass}
							/>
						</Field>

						{isPayment && (
							<div className='space-y-4 rounded-xl border border-zinc-100 p-4 sm:col-span-2 dark:border-zinc-800'>
								<p className='text-xs font-black tracking-wider text-zinc-400 uppercase'>
									Only for payments that…
								</p>
								<Field
									label='Are at least (USD, before tax)'
									error={err('conditions.min_payment_cents')}>
									<input
										type='number'
										min={0}
										step={0.01}
										value={form.min_payment_dollars}
										onChange={(e) => set('min_payment_dollars', e.target.value)}
										className={fieldClass}
									/>
								</Field>
								<Field label='Are for these plans (none ticked = any)'>
									<Checks>
										{plans.map((p) => (
											<Check
												key={p.id}
												label={p.name}
												checked={form.plan_ids.includes(p.id)}
												onChange={() =>
													set('plan_ids', toggle(form.plan_ids, p.id))
												}
											/>
										))}
									</Checks>
								</Field>
								<Field label='Are on these billing intervals (none ticked = any)'>
									<Checks>
										{INTERVALS.map((i) => (
											<Check
												key={i}
												label={i}
												checked={form.billing_intervals.includes(i)}
												onChange={() =>
													set(
														'billing_intervals',
														toggle(form.billing_intervals, i),
													)
												}
											/>
										))}
									</Checks>
								</Field>
								<Field label='Come from (none ticked = any)'>
									<Checks>
										{SOURCES.map((s) => (
											<Check
												key={s.value}
												label={s.label}
												checked={form.payment_sources.includes(s.value)}
												onChange={() =>
													set(
														'payment_sources',
														toggle(form.payment_sources, s.value),
													)
												}
											/>
										))}
									</Checks>
								</Field>
							</div>
						)}

						<Field label='Starts (optional)'>
							<input
								type='date'
								value={form.starts_at}
								onChange={(e) => set('starts_at', e.target.value)}
								className={fieldClass}
							/>
						</Field>
						<Field label='Ends (optional)' error={err('ends_at')}>
							<input
								type='date'
								value={form.ends_at}
								onChange={(e) => set('ends_at', e.target.value)}
								className={fieldClass}
							/>
						</Field>
						<label className='flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
							<input
								type='checkbox'
								checked={form.is_active}
								onChange={(e) => set('is_active', e.target.checked)}
							/>
							Rule is on
						</label>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<button type='button' onClick={onClose} className={secondaryBtn}>
							Cancel
						</button>
						<button
							type='submit'
							disabled={create.isPending || update.isPending}
							className={primaryBtn}>
							{create.isPending || update.isPending
								? 'Saving…'
								: rule
									? 'Save rule'
									: 'Add rule'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default RuleModal;
