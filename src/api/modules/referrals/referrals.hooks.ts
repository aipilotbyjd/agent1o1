import { useMutation } from '@tanstack/react-query';
import type { TClaimReferralDto } from '@/types/referral.type';
import { ReferralService } from './referrals.service';

export const useClaimReferral = () =>
	useMutation({
		mutationFn: (payload: TClaimReferralDto) => ReferralService.claim(payload),
	});
