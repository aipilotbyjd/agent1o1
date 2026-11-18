// ============================================================
// Onboarding Types
// ------------------------------------------------------------
// Every onboarding action (start, select role, continue, skip,
// submit discovery, complete) returns the same `TOnboardingState`
// snapshot except `dismiss`, which returns nothing: see
// `OnboardingService::state()`.
// ============================================================
import type { TRecommendedTemplate } from './dashboard.type';

/**
 * The wizard's steps, in order. The workspace is created when the wizard
 * opens and every workspace starts on Free, so neither is a step. Only
 * `connect_ai` cannot be skipped: there is no platform model.
 */
export type TOnboardingStepKey = 'role_selection' | 'connect_ai' | 'choose_template' | 'first_run';

export type TOnboardingStep = {
	key: TOnboardingStepKey;
	label: string;
	description: string;
	skippable: boolean;
	completed: boolean;
	skipped: boolean;
};

export type TJobRole = string;
export type TDiscoverySource = string;

export type TOnboardingStateMeta = {
	job_roles: Array<{ value: TJobRole; label: string; description: string }>;
	discovery_sources: Array<{ value: TDiscoverySource; label: string }>;
	/** What the template step offers first, for the user's role. */
	recommended_templates: TRecommendedTemplate[];
};

export type TOnboardingState = {
	dismissed: boolean;
	/** Whether "how did you find us" has been answered; asked after the first run, not in the wizard. */
	discovery_answered: boolean;
	completed: boolean;
	percent: number;
	current_step: TOnboardingStepKey;
	steps: TOnboardingStep[];
	meta: TOnboardingStateMeta;
};

export type TSelectRoleDto = {
	job_role: TJobRole;
};

export type TSkipStepDto = {
	step: TOnboardingStepKey;
};

export type TContinueStepDto = {
	step: TOnboardingStepKey;
};

export type TSubmitDiscoveryDto = {
	discovery_source: TDiscoverySource;
};
