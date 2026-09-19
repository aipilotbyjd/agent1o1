// ============================================================
// Billing Types
// ------------------------------------------------------------
// Plan catalog is workspace-scoped (`GET .../billing/plans`), not
// global — every plan-buying flow needs a workspace to attribute
// the purchase to. Money on `TInvoice` is doubled: `*_raw` in the
// currency's minor unit for arithmetic, `*` pre-formatted by
// Cashier for display.
// ============================================================

export type TBillingInterval = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export type TPlan = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	price_monthly: number;
	price_quarterly: number;
	price_yearly: number;
	price_lifetime: number;
	credits_monthly: number;
	limits: Record<string, number | null> | null;
	features: Record<string, boolean> | null;
	trial_days: number;
	is_active: boolean;
	available_intervals: TBillingInterval[];
};

export type TSubscription = {
	id: string;
	type: string;
	stripe_status: string;
	trial_ends_at: string | null;
	ends_at: string | null;
	plan: TPlan | null;
};

export type TPlanGrant = {
	id: string;
	source: string;
	status: string;
	price_cents: number;
	currency: string;
	granted_at: string;
	expires_at: string | null;
	plan: TPlan | null;
};

export type TUsagePeriod = {
	id: string;
	starts_at: string;
	ends_at: string;
	credits_used: number;
	credits_limit: number | null;
	/** `null` when the plan is unlimited. */
	credits_remaining: number | null;
	/** The share of `credits_used` that neither the plan allowance nor the
	 *  top-up pool covered — a subset of it, not additional spend. */
	overage_credits_used: number;
	overage_credits_billed: number;
};

export type TPlanLimitUsage = { used: number; max: number | null };

export type TBillingDunning = { started_at: string; attempts: number; invoice_id: string | null };

export type TBillingOverage = {
	available: boolean;
	enabled: boolean;
	effective_limit: number | null;
	credits_used: number;
	credits_remaining: number | null;
};

export type TBillingOverview = {
	subscription: TSubscription | null;
	plan_grant: TPlanGrant | null;
	current_plan: TPlan | null;
	usage_period: TUsagePeriod;
	topup_credits: number;
	credits_available: number | null;
	limits: Record<string, TPlanLimitUsage>;
	overage: TBillingOverage;
	dunning: TBillingDunning | null;
};

export type TCheckoutSubscriptionDto = {
	plan_id: string;
	interval: TBillingInterval;
};

/** A recurring-interval checkout that swaps an existing subscription in
 *  place returns the updated `subscription` instead of a `checkout_url`;
 *  a lifetime purchase returns `plan_grant` alongside the URL. */
export type TCheckoutSubscriptionResult =
	| { checkout_url: string; plan_grant?: TPlanGrant }
	| { subscription: TSubscription };

export type TPreviewSubscriptionSwapDto = {
	plan_id: string;
	interval: TBillingInterval;
};

export type TInvoice = {
	id: string;
	number: string | null;
	status: string | null;
	currency: string;
	total: string;
	total_raw: number;
	subtotal: string;
	tax: string;
	amount_due: string;
	amount_due_raw: number;
	date: string;
	due_date: string | null;
	hosted_invoice_url: string | null;
	invoice_pdf: string | null;
};

// ─── Credit packs ────────────────────────────────────────────

export type TCreditPackOffer = {
	key: string;
	label: string;
	credits: number;
	price_cents: number;
	available: boolean;
};

export type TCreditPackStatus = 'pending' | 'active' | 'refunded';

export type TCreditPack = {
	id: string;
	pack_key: string;
	credits_amount: number;
	price_cents: number;
	currency: string;
	status: TCreditPackStatus;
	purchased_at: string | null;
	created_at: string;
};

export type TCheckoutCreditPackDto = {
	pack_key: string;
};

export type TCheckoutCreditPackResult = { credit_pack: TCreditPack; checkout_url: string };

// ─── Overage ─────────────────────────────────────────────────

export type TCreditOverage = {
	available: boolean;
	enabled: boolean;
	limit: number | null;
	effective_limit: number | null;
	maximum_limit: number | null;
	credits_used: number;
	credits_remaining: number | null;
	credit_value_usd: number;
};

export type TUpdateCreditOverageDto = {
	enabled: boolean;
	limit?: number | null;
};

// ─── Credit notifications ───────────────────────────────────────

export type TCreditNotifications = {
	out_of_credits_enabled: boolean;
	thresholds: number[];
	is_default: boolean;
	default_thresholds: number[];
	maximum_thresholds: number;
};

export type TUpdateCreditNotificationsDto = {
	out_of_credits_enabled?: boolean;
	thresholds?: number[] | null;
};

// ─── Credit ledger ───────────────────────────────────────────
export type TCreditTransaction = {
	id: string;
	source_type: string;
	source_id: string;
	credits: number;
	topup_credits: number;
	overage_credits: number;
	reason: string | null;
	created_at: string;
};

// ─── Ported from the old frontend ────────────────────────────
// The billing UI copied over from `agent-1o1` talks to the old
// pack-catalog / portal endpoints. These shapes are the old
// backend's; the new contract above supersedes them once the
// pages are rewired.

export type TCreditPackCatalogItem = {
	key: string;
	label: string;
	credits: number;
	price_cents: number;
	available: boolean;
};

export type TBuyCreditsDto = {
	pack_key: string;
};

export type TBillingUrlResponse = {
	url: string;
};
