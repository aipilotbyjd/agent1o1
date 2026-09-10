import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TInviteTeamDto,
	TSelectRoleDto,
	TSelectPlanDto,
	TSubmitDiscoveryDto,
} from '@/types/onboarding.type';
import { OnboardingService } from './onboarding.service';
import { onboardingKeys } from './onboarding.keys';

export const useOnboardingState = () =>
	useQuery({
		queryKey: onboardingKeys.state(),
		queryFn: ({ signal }) => OnboardingService.state(signal),
	});

export const useDismissOnboarding = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => OnboardingService.dismiss(),
		onSuccess: () => qc.invalidateQueries({ queryKey: onboardingKeys.state() }),
		meta: { errorMessage: 'Failed to dismiss onboarding' },
	});
};

export const useInviteOnboardingTeam = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TInviteTeamDto) => OnboardingService.inviteTeam(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to send invitations' },
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

export const useSelectOnboardingPlan = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSelectPlanDto) => OnboardingService.selectPlan(payload),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to select plan' },
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

export const useCompleteOnboarding = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => OnboardingService.complete(),
		onSuccess: (state) => qc.setQueryData(onboardingKeys.state(), state),
		meta: { errorMessage: 'Failed to complete onboarding' },
	});
};
