import { useState } from 'react';
import type { FC, FormEvent, ReactNode } from 'react';
import { useUpdateReferralProgram } from '@/api/modules/admin-referrals';
import { ApiError, notify } from '@/api/core';
import type { TPlan } from '@/types/billing.type';
import type {
	TActivationEvent,
	TApprovalMode,
	TFraudChecks,
	TReferralProgram,
} from '@/types/admin-referral.type';
import { Field, SectionCard, fieldClass } from '../../Referrals/_partial/ReferralUi.partial';
import { primaryBtn } from '../../_shared/buttons';

type TForm = {
	name: string;
	description: string;
	is_active: boolean;
	starts_at: string;
	ends_at: string;
	attribution_window_days: string;
	claim_window_hours: string;
	require_verified_email: boolean;
	activation_event: TActivationEvent;
	activation_min_count: string;
	activation_window_days: string;
	default_hold_days: string;
	approval_mode: TApprovalMode;
	revoke_on_partial_refund: boolean;
	referrer_monthly_credit_cap: string;
	referrer_max_stacked_plan_days: string;
	referrer_max_referrals_per_month: string;
	referrer_min_account_age_days: string;
	referrer_eligible_plan_ids: string[];
	fraud_checks: TFraudChecks;
};

const str = (value: number | null) => (value === null ? '' : String(value));
const num = (value: string) => (value.trim() === '' ? null : Number(value));

const toForm = (p: TReferralProgram): TForm => ({
	name: p.name,
	description: p.description ?? '',
	is_active: p.is_active,
	starts_at: p.starts_at?.slice(0, 10) ?? '',
	ends_at: p.ends_at?.slice(0, 10) ?? '',
	attribution_window_days: String(p.attribution_window_days),
	claim_window_hours: String(p.claim_window_hours),
	require_verified_email: p.require_verified_email,
	activation_event: p.activation_event,
	activation_min_count: String(p.activation_min_count),
	activation_window_days: String(p.activation_window_days),
	default_hold_days: String(p.default_hold_days),
	approval_mode: p.approval_mode,
	revoke_on_partial_refund: p.revoke_on_partial_refund,
	referrer_monthly_credit_cap: str(p.referrer_monthly_credit_cap),
	referrer_max_stacked_plan_days: str(p.referrer_max_stacked_plan_days),
	referrer_max_referrals_per_month: str(p.referrer_max_referrals_per_month),
	referrer_min_account_age_days: String(p.referrer_min_account_age_days),
	referrer_eligible_plan_ids: p.referrer_eligible_plan_ids ?? [],
	fraud_checks: p.fraud_checks,
});

const Group: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
	<div className='space-y-4 border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0 dark:border-zinc-800'>
		<p className='text-xs font-black tracking-wider text-zinc-400 uppercase'>{title}</p>
		<div className='grid gap-4 sm:grid-cols-3'>{children}</div>
	</div>
);

const Toggle: FC<{
	checked: boolean;
	onChange: (value: boolean) => void;
	label: string;
	hint?: string;
}> = ({ checked, onChange, label, hint }) => (
	<label className='flex items-start gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
		<input
			type='checkbox'
			className='mt-1'
			checked={checked}
			onChange={(e) => onChange(e.target.checked)}
		/>
		<span>
			{label}
			{hint && <span className='block text-[11px] font-medium text-zinc-400'>{hint}</span>}
		</span>
	</label>
);

/** Every tunable setting of one program. Changes apply to the next referral event. */
const ProgramSettingsForm: FC<{ program: TReferralProgram; plans: TPlan[] }> = ({
	program,
	plans,
}) => {
	const update = useUpdateReferralProgram();
	const [form, setForm] = useState<TForm>(toForm(program));
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	const set = <K extends keyof TForm>(key: K, value: TForm[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const setFraud = <K extends keyof TFraudChecks>(key: K, value: TFraudChecks[K]) =>
		setForm((f) => ({ ...f, fraud_checks: { ...f.fraud_checks, [key]: value } }));
	const err = (key: string) => errors[key]?.[0] ?? null;

	const save = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await update.mutateAsync({
				id: program.id,
				body: {
					name: form.name.trim(),
					description: form.description.trim() || null,
					is_active: form.is_active,
					starts_at: form.starts_at || null,
					ends_at: form.ends_at || null,
					attribution_window_days: Number(form.attribution_window_days),
					claim_window_hours: Number(form.claim_window_hours),
					require_verified_email: form.require_verified_email,
					activation_event: form.activation_event,
					activation_min_count: Number(form.activation_min_count),
					activation_window_days: Number(form.activation_window_days),
					default_hold_days: Number(form.default_hold_days),
					approval_mode: form.approval_mode,
					revoke_on_partial_refund: form.revoke_on_partial_refund,
					referrer_monthly_credit_cap: num(form.referrer_monthly_credit_cap),
					referrer_max_stacked_plan_days: num(form.referrer_max_stacked_plan_days),
					referrer_max_referrals_per_month: num(form.referrer_max_referrals_per_month),
					referrer_min_account_age_days: Number(form.referrer_min_account_age_days) || 0,
					referrer_eligible_plan_ids: form.referrer_eligible_plan_ids,
					fraud_checks: form.fraud_checks,
				},
			});
			notify.success('Program saved.');
			setErrors({});
		} catch (error) {
			setErrors(ApiError.is(error) ? (error.fields ?? {}) : {});
		}
	};

	const numberInput = (key: keyof TForm, min = 0, placeholder?: string) => (
		<input
			type='number'
			min={min}
			placeholder={placeholder}
			value={form[key] as string}
			onChange={(e) => set(key, e.target.value as never)}
			className={fieldClass}
		/>
	);

	return (
		<SectionCard
			title='Program settings'
			actions={
				<button
					type='submit'
					form={`program-${program.id}`}
					disabled={update.isPending}
					className={`${primaryBtn} h-10!`}>
					{update.isPending ? 'Saving…' : 'Save settings'}
				</button>
			}>
			<form id={`program-${program.id}`} onSubmit={save} className='space-y-6'>
				<Group title='Basics'>
					<Field label='Name' error={err('name')}>
						<input
							required
							value={form.name}
							onChange={(e) => set('name', e.target.value)}
							className={fieldClass}
						/>
					</Field>
					<Field label='Starts (optional)' error={err('starts_at')}>
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
					<div className='sm:col-span-3'>
						<Field
							label='Description'
							hint='Shown to users at the top of their referral page.'
							error={err('description')}>
							<input
								value={form.description}
								onChange={(e) => set('description', e.target.value)}
								className={fieldClass}
							/>
						</Field>
					</div>
					<Toggle
						checked={form.is_active}
						onChange={(v) => set('is_active', v)}
						label='Program is on'
						hint='Off pauses new referrals and rewards.'
					/>
				</Group>

				<Group title='Signup & activation'>
					<Field label='Link counts for (days)' error={err('attribution_window_days')}>
						{numberInput('attribution_window_days', 1)}
					</Field>
					<Field
						label='Social signup claim window (hours)'
						error={err('claim_window_hours')}>
						{numberInput('claim_window_hours', 1)}
					</Field>
					<Toggle
						checked={form.require_verified_email}
						onChange={(v) => set('require_verified_email', v)}
						label='Require a verified email'
					/>
					<Field label='"Activated" means' error={err('activation_event')}>
						<select
							className={fieldClass}
							value={form.activation_event}
							onChange={(e) =>
								set('activation_event', e.target.value as TActivationEvent)
							}>
							<option value='run_or_agent_session'>
								A workflow run or agent session
							</option>
							<option value='first_successful_run'>A successful workflow run</option>
							<option value='first_agent_session'>An agent session</option>
						</select>
					</Field>
					<Field label='How many of them' error={err('activation_min_count')}>
						{numberInput('activation_min_count', 1)}
					</Field>
					<Field label='Within (days of signup)' error={err('activation_window_days')}>
						{numberInput('activation_window_days', 1)}
					</Field>
				</Group>

				<Group title='Granting'>
					<Field
						label='Hold payment rewards for (days)'
						hint='Refunds in this window cancel the reward.'
						error={err('default_hold_days')}>
						{numberInput('default_hold_days')}
					</Field>
					<Field label='Approval' error={err('approval_mode')}>
						<select
							className={fieldClass}
							value={form.approval_mode}
							onChange={(e) => set('approval_mode', e.target.value as TApprovalMode)}>
							<option value='automatic'>Automatic</option>
							<option value='manual'>Every reward needs my approval</option>
						</select>
					</Field>
					<Toggle
						checked={form.revoke_on_partial_refund}
						onChange={(v) => set('revoke_on_partial_refund', v)}
						label='Withdraw rewards on partial refunds too'
					/>
				</Group>

				<Group title='Limits for referrers'>
					<Field
						label='Credits per month'
						hint='Empty = no cap.'
						error={err('referrer_monthly_credit_cap')}>
						{numberInput('referrer_monthly_credit_cap', 0, 'No cap')}
					</Field>
					<Field
						label='Max stacked free days'
						hint='Empty = no cap.'
						error={err('referrer_max_stacked_plan_days')}>
						{numberInput('referrer_max_stacked_plan_days', 0, 'No cap')}
					</Field>
					<Field
						label='Referrals per month'
						hint='Empty = no cap.'
						error={err('referrer_max_referrals_per_month')}>
						{numberInput('referrer_max_referrals_per_month', 1, 'No cap')}
					</Field>
					<Field
						label='Account must be at least (days old)'
						error={err('referrer_min_account_age_days')}>
						{numberInput('referrer_min_account_age_days')}
					</Field>
					<div className='sm:col-span-2'>
						<Field label='Only referrers on these plans (none ticked = anyone)'>
							<div className='flex flex-wrap gap-x-4 gap-y-2 pt-1'>
								{plans.map((plan) => (
									<label
										key={plan.id}
										className='flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
										<input
											type='checkbox'
											checked={form.referrer_eligible_plan_ids.includes(
												plan.id,
											)}
											onChange={() =>
												set(
													'referrer_eligible_plan_ids',
													form.referrer_eligible_plan_ids.includes(
														plan.id,
													)
														? form.referrer_eligible_plan_ids.filter(
																(id) => id !== plan.id,
															)
														: [
																...form.referrer_eligible_plan_ids,
																plan.id,
															],
												)
											}
										/>
										{plan.name}
									</label>
								))}
							</div>
						</Field>
					</div>
				</Group>

				<Group title='Fraud checks'>
					<Toggle
						checked={form.fraud_checks.shared_workspace}
						onChange={(v) => setFraud('shared_workspace', v)}
						label='Reject if already in a workspace together'
					/>
					<Toggle
						checked={form.fraud_checks.disposable_email}
						onChange={(v) => setFraud('disposable_email', v)}
						label='Reject blocked email domains'
					/>
					<Toggle
						checked={form.fraud_checks.same_email_domain}
						onChange={(v) => setFraud('same_email_domain', v)}
						label='Reject the same company email domain'
						hint='Gmail and other shared providers are ignored.'
					/>
					<Toggle
						checked={form.fraud_checks.card_fingerprint}
						onChange={(v) => setFraud('card_fingerprint', v)}
						label="Reject if they pay with the referrer's card"
					/>
					<div className='space-y-2'>
						<Toggle
							checked={form.fraud_checks.ip_velocity.enabled}
							onChange={(v) =>
								setFraud('ip_velocity', {
									...form.fraud_checks.ip_velocity,
									enabled: v,
								})
							}
							label='Limit signups from one network'
						/>
						<div className='flex items-center gap-2 text-xs font-semibold text-zinc-500'>
							<input
								type='number'
								min={1}
								aria-label='Signups allowed'
								value={form.fraud_checks.ip_velocity.max}
								onChange={(e) =>
									setFraud('ip_velocity', {
										...form.fraud_checks.ip_velocity,
										max: Number(e.target.value),
									})
								}
								className={`${fieldClass} h-8! w-16`}
							/>
							per
							<input
								type='number'
								min={1}
								aria-label='Hours'
								value={form.fraud_checks.ip_velocity.hours}
								onChange={(e) =>
									setFraud('ip_velocity', {
										...form.fraud_checks.ip_velocity,
										hours: Number(e.target.value),
									})
								}
								className={`${fieldClass} h-8! w-16`}
							/>
							hours
						</div>
					</div>
					<div className='space-y-2'>
						<Toggle
							checked={form.fraud_checks.velocity_alert.enabled}
							onChange={(v) =>
								setFraud('velocity_alert', {
									...form.fraud_checks.velocity_alert,
									enabled: v,
								})
							}
							label='Alert me about signup bursts'
						/>
						<div className='flex items-center gap-2 text-xs font-semibold text-zinc-500'>
							<input
								type='number'
								min={1}
								aria-label='Signups per hour'
								value={form.fraud_checks.velocity_alert.max_per_hour}
								onChange={(e) =>
									setFraud('velocity_alert', {
										...form.fraud_checks.velocity_alert,
										max_per_hour: Number(e.target.value),
									})
								}
								className={`${fieldClass} h-8! w-16`}
							/>
							signups on one code in an hour
						</div>
					</div>
				</Group>
			</form>
		</SectionCard>
	);
};

export default ProgramSettingsForm;
