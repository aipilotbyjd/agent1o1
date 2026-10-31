import type { TOnboardingStep as TOnboardingStepState } from '@/types/onboarding.type';
import { ONBOARDING_STEP_KEYS } from './onboarding.constants';
import type { TOnboardingStep } from '../_types/onboarding.type';

export const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const parseEmails = (value: string) =>
	value
		.split(/[\n,]+/)
		.map((e) => e.trim())
		.filter(Boolean);

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStepCompleted = (steps: TOnboardingStepState[], index: number) =>
	steps.find((step) => step.key === ONBOARDING_STEP_KEYS[index])?.completed === true;

/** The nearest step in `direction` from `from` that is not completed, or `null` if none is left. */
export const findPendingStep = (
	steps: TOnboardingStepState[],
	from: number,
	direction: 1 | -1,
): TOnboardingStep | null => {
	for (let i = from + direction; i >= 0 && i < ONBOARDING_STEP_KEYS.length; i += direction) {
		if (!isStepCompleted(steps, i)) return i as TOnboardingStep;
	}
	return null;
};

/**
 * Where the wizard opens: the requested step, else the saved one, but never a
 * step that is already completed. A completed target moves on to the next
 * pending step, then to the earliest pending one.
 */
export const resolveStartStep = (
	steps: TOnboardingStepState[],
	requestedKey: string | null,
	savedKey: string,
): TOnboardingStep => {
	const requested = ONBOARDING_STEP_KEYS.findIndex((key) => key === requestedKey);
	const saved = Math.max(
		ONBOARDING_STEP_KEYS.findIndex((key) => key === savedKey),
		0,
	);
	const target = requested >= 0 ? requested : saved;

	if (!isStepCompleted(steps, target)) return target as TOnboardingStep;
	return (
		findPendingStep(steps, target, 1) ??
		findPendingStep(steps, -1, 1) ??
		(target as TOnboardingStep)
	);
};
