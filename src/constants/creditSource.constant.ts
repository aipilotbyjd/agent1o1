import type { TCreditGrantSource } from '@/types/billing.type';

/** How each kind of wallet credit is named on the billing pages. */
export const CREDIT_SOURCE_LABELS: Record<TCreditGrantSource, string> = {
	plan: 'Plan',
	free: 'Free',
	trial: 'Trial',
	rollover: 'Rolled over',
	topup: 'Top-up',
	promo: 'Promo',
	referral: 'Referral',
	admin: 'Bonus',
	migration: 'Top-up',
};
