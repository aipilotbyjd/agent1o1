import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TOnboardingState,
	TSelectRoleDto,
	TSubmitDiscoveryDto,
	TSkipStepDto,
	TContinueStepDto,
} from '@/types/onboarding.type';
import { OnboardingEndpoints as E } from './onboarding.endpoints';

const post = <TBody>(url: string, payload?: TBody) =>
	axiosClient.post<TApiResponse<TOnboardingState>>(url, payload).then(unwrap<TOnboardingState>);

export const OnboardingService = {
	state: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TOnboardingState>>(E.state, { signal })
			.then(unwrap<TOnboardingState>),

	/** Opening the wizard: sets up the user's own workspace when they have none. */
	start: () => post(E.start),

	dismiss: () => axiosClient.post(E.dismiss).then(() => undefined),

	selectRole: (payload: TSelectRoleDto) => post(E.selectRole, payload),

	submitDiscovery: (payload: TSubmitDiscoveryDto) => post(E.submitDiscovery, payload),

	continueStep: (payload: TContinueStepDto) => post(E.continueStep, payload),

	skipStep: (payload: TSkipStepDto) => post(E.skip, payload),

	complete: () => post(E.complete),
};
