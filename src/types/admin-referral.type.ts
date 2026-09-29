// ============================================================
// Admin Referral Types
// ------------------------------------------------------------
// The platform-admin API (`/admin/*`): programs, reward rules,
// codes, referrals, the reward ledger, blocked domains, stats
// and the audit log. Only users with `is_platform_admin` and
// two-factor auth confirmed can call it.
// ============================================================
import type { TBillingInterval } from './billing.type';
import type {
	TReferralRecipient,
	TReferralReward,
	TReferralRewardType,
	TReferralStatus,
	TReferralTrigger,
} from './referral.type';

export type TActivationEvent =
	'first_successful_run' | 'first_agent_session' | 'run_or_agent_session';

export type TApprovalMode = 'automatic' | 'manual';

export type TAlreadyOnPlanBehavior =
	'grant_anyway' | 'skip' | 'convert_to_credits' | 'stripe_balance_credit';

export type TReferralPaymentSource = 'subscription' | 'credit_pack' | 'lifetime';

export type TRuleTrigger = Exclude<TReferralTrigger, 'manual'>;

export type TFraudChecks = {
	shared_workspace: boolean;
	same_email_domain: boolean;
	disposable_email: boolean;
	card_fingerprint: boolean;
	ip_velocity: { enabled: boolean; max: number; hours: number };
	velocity_alert: { enabled: boolean; max_per_hour: number };
};

export type TRuleConditions = {
	min_payment_cents?: number;
	plan_ids?: string[];
	billing_intervals?: TBillingInterval[];
	payment_sources?: TReferralPaymentSource[];
	nth_payment_min?: number;
	nth_payment_max?: number;
};

export type TReferralRule = {
	id: string;
	program_id: string;
	name: string;
	description: string | null;
	/** Plain-English terms, e.g. "You get 1,000 bonus credits when…". */
	summary: string;
	is_active: boolean;
	is_live: boolean;
	sort_order: number;
	trigger: TRuleTrigger;
	recipient: TReferralRecipient;
	reward_type: TReferralRewardType;
	credits_amount: number | null;
	plan_id: string | null;
	duration_days: number | null;
	amount_cents: number | null;
	amount_percent_of_plan: number | null;
	trial_days: number | null;
	milestone_count: number | null;
	hold_days: number | null;
	if_already_on_plan: TAlreadyOnPlanBehavior;
	fallback_credits: number | null;
	max_per_recipient: number | null;
	conditions: TRuleConditions;
	starts_at: string | null;
	ends_at: string | null;
};

export type TReferralRuleDto = Partial<
	Omit<TReferralRule, 'id' | 'program_id' | 'summary' | 'is_live'>
>;

export type TReferralProgram = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	is_active: boolean;
	is_default: boolean;
	is_live: boolean;
	starts_at: string | null;
	ends_at: string | null;
	attribution_window_days: number;
	claim_window_hours: number;
	require_verified_email: boolean;
	activation_event: TActivationEvent;
	activation_min_count: number;
	activation_window_days: number;
	default_hold_days: number;
	approval_mode: TApprovalMode;
	revoke_on_partial_refund: boolean;
	referrer_monthly_credit_cap: number | null;
	referrer_max_stacked_plan_days: number | null;
	referrer_max_referrals_per_month: number | null;
	referrer_min_account_age_days: number;
	referrer_eligible_plan_ids: string[];
	fraud_checks: TFraudChecks;
	rules?: TReferralRule[];
	rules_count?: number;
	referrals_count?: number;
	deleted_at: string | null;
};

export type TReferralProgramDto = Partial<
	Omit<
		TReferralProgram,
		| 'id'
		| 'is_live'
		| 'rules'
		| 'rules_count'
		| 'referrals_count'
		| 'deleted_at'
		| 'fraud_checks'
	>
> & { fraud_checks?: Partial<TFraudChecks> };

export type TSimulateReferralDto = {
	trigger: TRuleTrigger;
	payment_cents?: number;
	plan_id?: string;
	billing_interval?: TBillingInterval;
	payment_source?: TReferralPaymentSource;
	payment_sequence?: number;
	converted_referrals?: number;
	multiplier?: number;
};

export type TSimulationResult = {
	rule_id: string;
	name: string;
	description: string;
	recipient: TReferralRecipient;
	applies: boolean;
	reason: string | null;
	reward: {
		reward_type: TReferralRewardType;
		credits: number | null;
		plan_id: string | null;
		duration_days: number | null;
		amount_cents: number | null;
		trial_days: number | null;
	};
	hold_days: number;
	initial_status: string;
};

export type TAdminPerson = { id: string; name: string; email: string };

export type TAdminReferralCode = {
	id: string;
	code: string;
	user?: TAdminPerson;
	program_id: string | null;
	is_active: boolean;
	max_uses: number | null;
	expires_at: string | null;
	reward_workspace_id: string | null;
	rule_multiplier: number;
	referrals_count?: number;
	visits_count?: number;
	created_at: string;
};

export type TUpdateAdminReferralCodeDto = Partial<
	Pick<
		TAdminReferralCode,
		'code' | 'program_id' | 'is_active' | 'max_uses' | 'expires_at' | 'rule_multiplier'
	>
>;

export type TAdminReferral = {
	id: string;
	program_id: string;
	code?: string | null;
	referrer?: TAdminPerson;
	referred_user?: TAdminPerson;
	referred_workspace_id: string | null;
	status: TReferralStatus;
	verified_at: string | null;
	activated_at: string | null;
	converted_at: string | null;
	rejected_at: string | null;
	rejection_reason: string | null;
	rewards?: TReferralReward[];
	created_at: string;
};

export type TAdminReferralReward = TReferralReward & {
	referral_id: string | null;
	rule_id: string | null;
	rule_snapshot: Record<string, unknown> | null;
	recipient?: TAdminPerson;
	plan_grant_id: string | null;
	credits_clawed_back: number;
	payment_reference: string | null;
	granted_by: string | null;
	notes: string | null;
};

export type TManualReferralRewardDto = {
	user_id: string;
	workspace_id?: string;
	reward_type: TReferralRewardType;
	credits?: number;
	plan_id?: string;
	duration_days?: number;
	amount_cents?: number;
	trial_days?: number;
	notes?: string;
};

export type TBlockedDomain = {
	id: string;
	domain: string;
	reason: string | null;
	created_at: string;
};

export type TAdminReferralStats = {
	window_days: number;
	visits: number;
	signups: number;
	rejected: number;
	by_status: Record<string, number>;
	activation_rate: number;
	conversion_rate: number;
	credits_issued: number;
	plan_days_issued: number;
	invoice_credit_cents_issued: number;
	credits_clawed_back: number;
	rewards_awaiting_approval: number;
	rewards_pending: number;
	rewards_by_recipient: Record<TReferralRecipient, number>;
	active_referral_plan_grants: number;
	top_referrers: Array<{
		user_id: string;
		name: string | null;
		email: string | null;
		converted: number;
	}>;
};

export type TAdminAuditLog = {
	id: string;
	action: string;
	admin: TAdminPerson | null;
	subject_type: string | null;
	subject_id: string | null;
	before: Record<string, unknown> | null;
	after: Record<string, unknown> | null;
	ip_address: string | null;
	created_at: string;
};
