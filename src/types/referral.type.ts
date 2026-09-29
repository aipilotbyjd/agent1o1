// ============================================================
// Referral Types
// ------------------------------------------------------------
// The signed-in user's side of the referral program: their code,
// the program's terms, their numbers and who they referred. Every
// reward is credits, free plan time, an invoice credit or trial
// days — never cash.
// ============================================================

export type TReferralStatus = 'pending' | 'verified' | 'activated' | 'converted' | 'rejected';

export type TReferralTrigger =
	'signup_verified' | 'activated' | 'first_payment' | 'repeat_payment' | 'milestone' | 'manual';

export type TReferralRecipient = 'referrer' | 'referee';

export type TReferralRewardType =
	'credits' | 'plan_time' | 'stripe_balance_credit' | 'trial_extension';

export type TReferralRewardStatus = 'awaiting_approval' | 'pending' | 'granted' | 'revoked';

export type TReferralProfile = {
	/** False when referrals are switched off or no program is live — hide the page. */
	enabled: boolean;
	code: string;
	is_active: boolean;
	share_url: string;
	/** A custom code can be set once. */
	can_customize_code: boolean;
	reward_workspace: { id: string; name: string } | null;
	program: { id: string; name: string } | null;
	next_milestone: { count: number; remaining: number; description: string } | null;
};

export type TUpdateReferralProfileDto = {
	code?: string;
	reward_workspace_id?: string;
};

export type TReferralTerm = {
	trigger: TReferralTrigger;
	recipient: TReferralRecipient;
	reward_type: TReferralRewardType;
	/** Ready-to-show sentence, e.g. "You get 30 days of Pro free when your friend makes their first payment." */
	description: string;
};

export type TReferralProgramTerms = {
	enabled: boolean;
	program: { name: string; description: string | null; ends_at: string | null } | null;
	terms: TReferralTerm[];
};

export type TReferralStats = {
	visits: number;
	signups: number;
	verified: number;
	activated: number;
	converted: number;
	credits_earned: number;
	plan_days_earned: number;
	invoice_credit_cents: number;
	pending_rewards: number;
	free_plan_time: { plan: string | null; expires_at: string } | null;
};

/** A referred person as their referrer sees them — email masked. */
export type TReferredUser = {
	id: string;
	email: string | null;
	status: TReferralStatus;
	signed_up_at: string;
	verified_at: string | null;
	activated_at: string | null;
	converted_at: string | null;
};

export type TReferralReward = {
	id: string;
	/** Ready-to-show value, e.g. "1,000 bonus credits". */
	summary: string;
	trigger: TReferralTrigger;
	recipient_role: TReferralRecipient;
	reward_type: TReferralRewardType;
	credits: number | null;
	plan_id: string | null;
	plan_name?: string | null;
	duration_days: number | null;
	amount_cents: number | null;
	trial_days: number | null;
	status: TReferralRewardStatus;
	grant_after: string | null;
	granted_at: string | null;
	revoked_at: string | null;
	revoked_reason: string | null;
	workspace_id: string | null;
	created_at: string;
};

export type TRecordReferralVisitDto = {
	code: string;
	visitor_id?: string;
	landing_url?: string;
	referrer_url?: string;
	utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>;
};

export type TReferralVisitResult = { visitor_id: string; code: string };

export type TClaimReferralDto = { code: string; visitor_id?: string };

export type TClaimReferralResult = { status: TReferralStatus; accepted: boolean };
