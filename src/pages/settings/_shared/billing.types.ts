// ============================================================
// Billing — settings-local view types
// ------------------------------------------------------------
// The settings screens (Plan, Usage, Billing) were written against
// a plan model with keyed `limits`/`features` objects and a credit
// "balance" endpoint. The current API exposes `limits` as a loose
// record, `features` as a string list, and folds balance into
// GET /billing/overview. These types name the shapes the screens
// read; `billing.helper` does the translation.
// ============================================================

export type TSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export type TBillingInterval = 'monthly' | 'yearly';

/** Numeric plan limits, keyed. `-1` means unlimited, matching the old
 *  contract; the API sends `null` for the same thing. */
export type TPlanLimits = {
	active_workflows: number;
	members: number;
	credits_monthly: number;
	min_schedule_interval_minutes: number | null;
	max_execution_time_seconds: number;
	execution_log_retention_days: number;
	api_rate_limit_per_minute: number;
};

/** Feature flags, keyed. The API ships `features` as a list of enabled
 *  feature slugs; presence in that list is what makes one true. */
export type TPlanFeatures = {
	webhook_triggers: boolean;
	schedule_triggers: boolean;
	import_export: boolean;
	custom_variables: boolean;
	ai_generation: boolean;
	ai_autofix: boolean;
	deterministic_replay: boolean;
	execution_debugger: boolean;
	priority_execution: boolean;
	environments: boolean;
	approval_workflows: boolean;
	connector_metrics: boolean;
	overage_protection: boolean;
	audit_logs: boolean;
	sso_saml: boolean;
	annual_rollover: boolean;
	credit_packs: boolean;
};

export type TViewPlan = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	price_monthly: number;
	price_yearly: number;
	credits_monthly: number;
	limits: TPlanLimits;
	features: TPlanFeatures;
};

export type TViewSubscription = {
	id: string;
	status: TSubscriptionStatus;
	billing_interval: TBillingInterval;
	is_lifetime: boolean;
	credits_monthly: number;
	current_period_start: string | null;
	current_period_end: string | null;
	trial_ends_at: string | null;
	canceled_at: string | null;
	plan: TViewPlan | null;
};

export type TCreditBalance = {
	workspace_id: string;
	plan: { name: string | null; slug: string | null };
	billing_interval: TBillingInterval | null;
	credits: {
		limit: number | null;
		used: number | null;
		remaining: number | null;
		from_packs: number | null;
		rolled_over: number | null;
	};
	period: { start: string | null; end: string | null };
};

/** `credit_transactions.source_type` — the API's own vocabulary. */
export type TCreditTransactionType =
	| 'node_run'
	| 'agent_step'
	| 'eval_case'
	| 'session_evaluation';

export type TCreditTransaction = {
	id: string;
	type: TCreditTransactionType;
	credits: number;
	description: string;
	created_at: string;
};

export type TCreditTransactionFilters = {
	page?: number;
	per_page?: number;
};

export type TUsageSnapshot = {
	date: string;
	credits_used: number;
};

/** A purchased credit pack, as the ledger reports it. The API tracks the
 *  amount bought and its status; it does not track a per-pack remaining
 *  balance or expiry — top-up credits pool at the workspace level. */
export type TCreditPack = {
	id: string;
	pack_key: string;
	credits_amount: number;
	price_cents: number;
	currency: string;
	status: 'pending' | 'active' | 'refunded';
	purchased_at: string | null;
	created_at: string;
};
