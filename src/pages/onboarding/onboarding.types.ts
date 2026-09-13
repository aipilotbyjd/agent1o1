import type { TOnboardingState } from '@/types/onboarding.type';

// ============================================================
// Onboarding Step Contract
// ------------------------------------------------------------
// Every step gets the same snapshot and the same two moves. A step
// calls its own mutation (which replaces the cached snapshot) and
// then `onNext`; the wizard itself never calls the API.
// ============================================================
export type TOnboardingStepProps = {
	state: TOnboardingState;
	onNext: () => void;
	/** Null on the first step. */
	onBack: (() => void) | null;
};
