// ============================================================
// Onboarding Types
// ------------------------------------------------------------
// Every onboarding action (invite team, select role/plan, submit
// discovery, complete, dismiss) returns the same `TOnboardingState`
// snapshot except `dismiss`, which returns nothing — see
// `OnboardingService::state()`.
// ============================================================
import type { TPlan } from './billing.type';

export type TOnboardingStepKey =
	| 'profile_picture'
	| 'create_workspace'
	| 'invite_team'
	| 'role_selection'
	| 'choose_plan'
	| 'discovery_survey';

export type TOnboardingStep = {
	key: TOnboardingStepKey;
	label: string;
	description: string;
	completed: boolean;
};

export type TJobRole = string;
export type TDiscoverySource = string;

export type TOnboardingStateMeta = {
	workspace_slug_suggestion: string;
	plans: TPlan[];
	job_roles: Array<{ value: TJobRole; label: string; description: string }>;
	discovery_sources: Array<{ value: TDiscoverySource; label: string }>;
	credential_types: unknown[];
};

export type TOnboardingState = {
	dismissed: boolean;
	completed: boolean;
	percent: number;
	current_step: TOnboardingStepKey;
	steps: TOnboardingStep[];
	meta: TOnboardingStateMeta;
};

export type TInviteTeamDto = {
	emails: string[];
	role: string;
	personal_note?: string | null;
};

export type TSelectRoleDto = {
	job_role: TJobRole;
};

export type TSelectPlanDto = {
	plan_slug: string;
};

export type TSubmitDiscoveryDto = {
	discovery_source: TDiscoverySource;
};
