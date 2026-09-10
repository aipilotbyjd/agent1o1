import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TOnboardingState,
	TInviteTeamDto,
	TSelectRoleDto,
	TSelectPlanDto,
	TSubmitDiscoveryDto,
} from '@/types/onboarding.type';
import { OnboardingEndpoints as E } from './onboarding.endpoints';

export const OnboardingService = {
	state: (signal?: AbortSignal) =>
		axiosClient.get<TApiResponse<TOnboardingState>>(E.state, { signal }).then(unwrap<TOnboardingState>),

	dismiss: () => axiosClient.post(E.dismiss).then(() => undefined),

	inviteTeam: (payload: TInviteTeamDto) =>
		axiosClient
			.post<TApiResponse<TOnboardingState>>(E.inviteTeam, payload)
			.then(unwrap<TOnboardingState>),

	selectRole: (payload: TSelectRoleDto) =>
		axiosClient
			.post<TApiResponse<TOnboardingState>>(E.selectRole, payload)
			.then(unwrap<TOnboardingState>),

	selectPlan: (payload: TSelectPlanDto) =>
		axiosClient
			.post<TApiResponse<TOnboardingState>>(E.selectPlan, payload)
			.then(unwrap<TOnboardingState>),

	submitDiscovery: (payload: TSubmitDiscoveryDto) =>
		axiosClient
			.post<TApiResponse<TOnboardingState>>(E.submitDiscovery, payload)
			.then(unwrap<TOnboardingState>),

	complete: () =>
		axiosClient.post<TApiResponse<TOnboardingState>>(E.complete).then(unwrap<TOnboardingState>),
};
