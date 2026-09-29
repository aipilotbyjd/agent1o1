import type {
	TReferralRecipient,
	TReferralRewardStatus,
	TReferralRewardType,
	TReferralStatus,
	TReferralTrigger,
} from '@/types/referral.type';

export type TTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export const TONE_PILL: Record<TTone, string> = {
	success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
	warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
	danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
	info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
	neutral: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
	primary: 'bg-primary-400/15 text-primary-700 dark:text-primary-400',
};

export const REFERRAL_STATUS: Record<TReferralStatus, { label: string; tone: TTone }> = {
	pending: { label: 'Signed up', tone: 'neutral' },
	verified: { label: 'Verified', tone: 'info' },
	activated: { label: 'Active', tone: 'primary' },
	converted: { label: 'Paying', tone: 'success' },
	rejected: { label: 'Not eligible', tone: 'danger' },
};

export const REWARD_STATUS: Record<TReferralRewardStatus, { label: string; tone: TTone }> = {
	awaiting_approval: { label: 'In review', tone: 'warning' },
	pending: { label: 'On hold', tone: 'info' },
	granted: { label: 'Received', tone: 'success' },
	revoked: { label: 'Withdrawn', tone: 'danger' },
};

export const TRIGGER_LABEL: Record<TReferralTrigger, string> = {
	signup_verified: 'Signs up and verifies email',
	activated: 'Starts using the product',
	first_payment: 'First payment',
	repeat_payment: 'Later payment',
	milestone: 'Referrer milestone',
	manual: 'Granted by an admin',
};

export const RECIPIENT_LABEL: Record<TReferralRecipient, string> = {
	referrer: 'Referrer',
	referee: 'New user',
};

export const REWARD_TYPE_LABEL: Record<TReferralRewardType, string> = {
	credits: 'Bonus credits',
	plan_time: 'Free plan time',
	stripe_balance_credit: 'Invoice credit',
	trial_extension: 'Extra trial days',
};

export const formatCents = (cents: number) =>
	(cents / 100).toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
	});

export const formatNumber = (value: number) => value.toLocaleString('en-US');

export const formatPercent = (ratio: number) => `${Math.round(ratio * 1000) / 10}%`;
