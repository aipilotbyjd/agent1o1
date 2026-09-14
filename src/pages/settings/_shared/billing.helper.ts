// ============================================================
// Billing helper
// ------------------------------------------------------------
// A view over @/api/modules/billing in the vocabulary the settings
// screens already speak. Every call below hits a real endpoint on
// routes/api/internal/billing.php — nothing here fabricates data.
//
// Two notes on what changed underneath:
//   * There is no separate credit-balance endpoint any more; the
//     numbers come from GET /billing/overview's usage_period.
//   * There is no usage-snapshot endpoint; the daily credit series
//     comes from the dashboard's credit-usage report instead.
// ============================================================
import { useMemo } from 'react';
import {
	useBillingOverview,
	usePlans as useApiPlans,
	useSubscription as useApiSubscription,
	useCredits,
	useCreditPacks as useApiCreditPackOffers,
	usePurchasedCreditPacks,
	useCheckoutCreditPack,
	useCheckoutSubscription,
	useCreateBillingPortalSession,
	useCancelSubscription,
	useResumeSubscription,
} from '@/api/modules/billing';
import { useCreditUsage } from '@/api/modules/dashboard';
import type { TPlan, TSubscription } from '@/types/billing.type';
import type {
	TCreditBalance,
	TCreditTransaction,
	TCreditTransactionFilters,
	TCreditTransactionType,
	TPlanFeatures,
	TPlanLimits,
	TSubscriptionStatus,
	TUsageSnapshot,
	TViewPlan,
	TViewSubscription,
} from './billing.types';

const FEATURE_KEYS: (keyof TPlanFeatures)[] = [
	'webhook_triggers',
	'schedule_triggers',
	'import_export',
	'custom_variables',
	'ai_generation',
	'ai_autofix',
	'deterministic_replay',
	'execution_debugger',
	'priority_execution',
	'environments',
	'approval_workflows',
	'connector_metrics',
	'overage_protection',
	'audit_logs',
	'sso_saml',
	'annual_rollover',
	'credit_packs',
];

/** The API sends `null` for "unlimited"; these screens read `-1`. */
const limitValue = (limits: Record<string, number | null> | null, key: string, fallback = -1) => {
	const raw = limits?.[key];
	if (raw === undefined) return fallback;
	return raw === null ? -1 : raw;
};

export const toPlanLimits = (plan: TPlan | null | undefined): TPlanLimits => ({
	active_workflows: limitValue(plan?.limits ?? null, 'active_workflows'),
	members: limitValue(plan?.limits ?? null, 'members'),
	credits_monthly: plan?.credits_monthly ?? limitValue(plan?.limits ?? null, 'credits_monthly'),
	min_schedule_interval_minutes: plan?.limits?.min_schedule_interval_minutes ?? null,
	max_execution_time_seconds: limitValue(plan?.limits ?? null, 'max_execution_time_seconds'),
	execution_log_retention_days: limitValue(
		plan?.limits ?? null,
		'execution_log_retention_days',
		0,
	),
	api_rate_limit_per_minute: limitValue(plan?.limits ?? null, 'api_rate_limit_per_minute'),
});

export const toPlanFeatures = (plan: TPlan | null | undefined): TPlanFeatures => {
	const enabled = new Set(plan?.features ?? []);
	return Object.fromEntries(
		FEATURE_KEYS.map((key) => [key, enabled.has(key)]),
	) as TPlanFeatures;
};

export const toViewPlan = (plan: TPlan | null | undefined): TViewPlan | null =>
	plan
		? {
				id: plan.id,
				name: plan.name,
				slug: plan.slug,
				description: plan.description,
				price_monthly: plan.price_monthly,
				price_yearly: plan.price_yearly,
				credits_monthly: plan.credits_monthly,
				limits: toPlanLimits(plan),
				features: toPlanFeatures(plan),
			}
		: null;

/** Cashier's `stripe_status` maps onto the old status vocabulary. */
const toStatus = (stripeStatus: string | undefined): TSubscriptionStatus => {
	switch (stripeStatus) {
		case 'trialing':
			return 'trialing';
		case 'past_due':
		case 'unpaid':
			return 'past_due';
		case 'canceled':
			return 'canceled';
		case 'incomplete_expired':
			return 'expired';
		default:
			return 'active';
	}
};

const toViewSubscription = (
	subscription: TSubscription | null | undefined,
	period?: { starts_at: string; ends_at: string } | null,
): TViewSubscription | null =>
	subscription
		? {
				id: subscription.id,
				status: toStatus(subscription.stripe_status),
				// The subscription record does not carry its interval; monthly
				// is what the plan's own credits allowance is expressed in.
				billing_interval: 'monthly',
				is_lifetime: false,
				credits_monthly: subscription.plan?.credits_monthly ?? 0,
				current_period_start: period?.starts_at ?? null,
				current_period_end: period?.ends_at ?? subscription.ends_at,
				trial_ends_at: subscription.trial_ends_at,
				canceled_at: subscription.ends_at,
				plan: toViewPlan(subscription.plan),
			}
		: null;

// ─── Hooks ───────────────────────────────────────────────────

export const useCreditBalance = (ws: string) => {
	const query = useBillingOverview(ws);

	const data = useMemo<TCreditBalance | undefined>(() => {
		if (!query.data) return undefined;
		const { current_plan, usage_period, topup_credits, credits_available } = query.data;
		return {
			workspace_id: ws,
			plan: { name: current_plan?.name ?? null, slug: current_plan?.slug ?? null },
			billing_interval: current_plan ? 'monthly' : null,
			credits: {
				limit: usage_period.credits_limit,
				used: usage_period.credits_used,
				remaining: credits_available ?? usage_period.credits_remaining,
				from_packs: topup_credits,
				// Rollover is not reported separately by the API.
				rolled_over: null,
			},
			period: { start: usage_period.starts_at, end: usage_period.ends_at },
		};
	}, [query.data, ws]);

	return { ...query, data };
};

export const useSubscription = (ws: string) => {
	const query = useApiSubscription(ws);
	const { data: overview } = useBillingOverview(ws);

	const data = useMemo(
		() => toViewSubscription(query.data, overview?.usage_period),
		[query.data, overview?.usage_period],
	);

	return { ...query, data };
};

/** Plan catalog in the keyed limits/features shape the screens render. */
export const usePlanCatalog = (ws: string) => {
	const query = useApiPlans(ws);
	const data = useMemo(
		() => query.data?.map((plan) => toViewPlan(plan)!).filter(Boolean),
		[query.data],
	);
	return { ...query, data };
};

const TX_DESCRIPTIONS: Record<TCreditTransactionType, string> = {
	node_run: 'Workflow node run',
	agent_step: 'Agent step',
	eval_case: 'Evaluation case',
	session_evaluation: 'Session evaluation',
};

export const useCreditTransactions = (ws: string, filters?: TCreditTransactionFilters) => {
	const query = useCredits(ws, filters);

	const data = useMemo(() => {
		if (!query.data) return undefined;
		const transactions: TCreditTransaction[] = query.data.transactions.map((tx) => {
			const type = tx.source_type as TCreditTransactionType;
			return {
				id: tx.id,
				type,
				credits: tx.credits,
				description: tx.reason ?? TX_DESCRIPTIONS[type] ?? 'Credit usage',
				created_at: tx.created_at,
			};
		});
		return { data: transactions, meta: query.data.meta };
	}, [query.data]);

	return { ...query, data };
};

/**
 * Daily credit spend over the dashboard's window — the closest thing the API
 * offers to the old per-day usage snapshots.
 */
export const useUsageSnapshots = (ws: string, params?: { days?: number }) => {
	const query = useCreditUsage(ws, params);

	const data = useMemo(() => {
		if (!query.data) return undefined;
		const snapshots: TUsageSnapshot[] = query.data.series.map((point) => ({
			date: point.date,
			credits_used: point.credits,
		}));
		return { from: query.data.window.starts_at, to: query.data.window.ends_at, snapshots };
	}, [query.data]);

	return { ...query, data };
};

// ─── Pass-throughs under the old names ───────────────────────

export { useCancelSubscription, useResumeSubscription };

export const usePlans = usePlanCatalog;
export const usePackCatalog = useApiCreditPackOffers;
export const useCreditPacks = usePurchasedCreditPacks;
export const useBuyCredits = useCheckoutCreditPack;
export const useBillingCheckout = useCheckoutSubscription;
export const useBillingPortal = useCreateBillingPortalSession;
