import type {
	TOnboardingState,
	TOnboardingStep,
	TOnboardingStepKey,
} from '@/types/onboarding.type';

export const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isOpen = (step: TOnboardingStep) => !step.completed;

/**
 * Where the wizard opens: the requested step (`?step=`, from the dashboard),
 * else the saved one. A finished step is never shown again, so a target that
 * is done moves on to the next open step, then back to the earliest open
 * one. `null` means every step is done.
 */
export const resolveStartStep = (
	state: TOnboardingState,
	requested: string | null,
): TOnboardingStepKey | null => {
	const { steps } = state;
	const requestedIndex = steps.findIndex((step) => step.key === requested);
	const savedIndex = Math.max(
		steps.findIndex((step) => step.key === state.current_step),
		0,
	);
	const from = requestedIndex >= 0 ? requestedIndex : savedIndex;

	const target = steps.slice(from).find(isOpen) ?? steps.slice(0, from).find(isOpen) ?? null;

	return target?.key ?? null;
};

/** The step after `key` that still needs doing, or `null` when it was the last. */
export const nextOpenStep = (
	steps: TOnboardingStep[],
	key: TOnboardingStepKey,
): TOnboardingStepKey | null => {
	const index = steps.findIndex((step) => step.key === key);
	return steps.slice(index + 1).find(isOpen)?.key ?? null;
};

/** A step key as people read it in a progress list: `send_email` → "Send email". */
export const humanizeKey = (key: string) => {
	const words = key.replace(/[_-]+/g, ' ').trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
};
