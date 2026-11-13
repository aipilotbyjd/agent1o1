import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpdateReferralProfileDto } from '@/types/referral.type';
import { ReferralService } from './referrals.service';
import { referralKeys } from './referrals.keys';

export const useReferralProfile = () =>
	useQuery({
		queryKey: referralKeys.me(),
		queryFn: ({ signal }) => ReferralService.me(signal),
	});

export const useReferralProgram = () =>
	useQuery({
		queryKey: referralKeys.program(),
		queryFn: ({ signal }) => ReferralService.program(signal),
	});

export const useReferralStats = () =>
	useQuery({
		queryKey: referralKeys.stats(),
		queryFn: ({ signal }) => ReferralService.stats(signal),
	});

export const useReferrals = (params?: { page?: number; per_page?: number }) =>
	useQuery({
		queryKey: referralKeys.list(params),
		queryFn: ({ signal }) => ReferralService.list(params, signal),
	});

export const useReferralRewards = (params?: { page?: number; per_page?: number }) =>
	useQuery({
		queryKey: referralKeys.rewards(params),
		queryFn: ({ signal }) => ReferralService.rewards(params, signal),
	});

export const useUpdateReferralProfile = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateReferralProfileDto) => ReferralService.updateMe(payload),
		onSuccess: (profile) => qc.setQueryData(referralKeys.me(), profile),
		meta: { errorMessage: 'Failed to update referral settings' },
	});
};
