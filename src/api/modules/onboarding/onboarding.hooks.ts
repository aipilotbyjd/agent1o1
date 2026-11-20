import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TSelectRoleDto,
	TSubmitDiscoveryDto,
	TSkipStepDto,
	TContinueStepDto,
} from '@/types/onboarding.type';
import { userKeys } from '@/api/modules/user/user.keys';
import { workspaceKeys } from '@/api/modules/workspaces/workspaces.keys';
import { OnboardingService } from './onboarding.service';
import { onboardingKeys } from './onboarding.keys';

export const useOnboardingState = () =>
	useQuery({
		queryKey: onboardingKeys.state(),
		queryFn: ({ signal }) => OnboardingService.state(signal),
	});

/**
 * Opens the wizard. A workspace may have been created for the user, so the
 * current user and the workspace list are read again.
 */
export const useStartOnboarding = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => OnboardingService.start(),
		onSuccess: async (state) => {
			qc.setQueryData(onboardingKeys.state(), state);
			await Promise.all([
				qc.invalidateQueries({ queryKey: userKeys.current() }),
				qc.invalidateQueries({ queryKey: workspaceKeys.all() }),
			]);
		},
		meta: { errorMessage: 'Could not set up your workspace' },
	});
};

export const useDismissOnboarding = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => OnboardingService.dismiss(),
		onSuccess: () => qc.invalidateQueries({ queryKey: onboardingKeys.state() }),
		meta: { errorMessage: 'Failed to dismiss onboarding' },
	});
};

export const useSelectOnboardingRole = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSelectRoleDto) => OnboardingService.selectRole(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to save role' },
	});
};

export const useSubmitOnboardingDiscovery = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSubmitDiscoveryDto) => OnboardingService.submitDiscovery(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to save discovery answer' },
	});
};

export const useContinueOnboardingStep = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TContinueStepDto) => OnboardingService.continueStep(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to save progress' },
	});
};

export const useSkipOnboardingStep = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSkipStepDto) => OnboardingService.skipStep(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to skip step' },
	});
};

export const useCompleteOnboarding = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => OnboardingService.complete(),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to complete onboarding' },
	});
};
