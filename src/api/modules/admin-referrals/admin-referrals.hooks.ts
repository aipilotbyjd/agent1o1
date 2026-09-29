import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TManualReferralRewardDto,
	TReferralProgramDto,
	TReferralRuleDto,
	TSimulateReferralDto,
	TUpdateAdminReferralCodeDto,
} from '@/types/admin-referral.type';
import { AdminReferralService as S, type TAdminListParams } from './admin-referrals.service';
import { adminReferralKeys as K } from './admin-referrals.keys';

type TQueryClient = ReturnType<typeof useQueryClient>;

/** Programs embed their rules, and the overview counts both — refetch all of it after any change. */
const invalidateAll = (qc: TQueryClient) => qc.invalidateQueries({ queryKey: K.all });

export const useAdminReferralStats = (days: number) =>
	useQuery({ queryKey: K.stats(days), queryFn: ({ signal }) => S.stats(days, signal) });

export const useAdminReferralPrograms = () =>
	useQuery({ queryKey: K.programs(), queryFn: ({ signal }) => S.programs(signal) });

export const useAdminReferralProgram = (id: string | null) =>
	useQuery({
		queryKey: K.program(id ?? ''),
		queryFn: ({ signal }) => S.program(id!, signal),
		enabled: !!id,
	});

export const useAdminReferralCodes = (params?: TAdminListParams) =>
	useQuery({ queryKey: K.codes(params), queryFn: ({ signal }) => S.codes(params, signal) });

export const useAdminReferrals = (params?: TAdminListParams) =>
	useQuery({
		queryKey: K.referrals(params),
		queryFn: ({ signal }) => S.referrals(params, signal),
	});

export const useAdminReferralRewards = (params?: TAdminListParams) =>
	useQuery({ queryKey: K.rewards(params), queryFn: ({ signal }) => S.rewards(params, signal) });

export const useAdminBlockedDomains = () =>
	useQuery({ queryKey: K.blockedDomains(), queryFn: ({ signal }) => S.blockedDomains(signal) });

export const useAdminAuditLog = (params?: TAdminListParams) =>
	useQuery({ queryKey: K.auditLog(params), queryFn: ({ signal }) => S.auditLog(params, signal) });

const useAdminMutation = <TVars, TResult>(
	mutationFn: (vars: TVars) => Promise<TResult>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn,
		onSuccess: () => invalidateAll(qc),
		meta: { errorMessage },
	});
};

export const useCreateReferralProgram = () =>
	useAdminMutation(
		(payload: TReferralProgramDto) => S.createProgram(payload),
		'Failed to create program',
	);

export const useUpdateReferralProgram = () =>
	useAdminMutation(
		({ id, body }: { id: string; body: TReferralProgramDto }) => S.updateProgram(id, body),
		'Failed to save program',
	);

export const useDeleteReferralProgram = () =>
	useAdminMutation((id: string) => S.deleteProgram(id), 'Failed to delete program');

export const useMakeDefaultReferralProgram = () =>
	useAdminMutation((id: string) => S.makeDefault(id), 'Failed to change the default program');

export const useDuplicateReferralProgram = () =>
	useAdminMutation((id: string) => S.duplicate(id), 'Failed to duplicate program');

export const useSimulateReferralProgram = () =>
	useMutation({
		mutationFn: ({ id, body }: { id: string; body: TSimulateReferralDto }) =>
			S.simulate(id, body),
		meta: { errorMessage: 'Simulation failed' },
	});

export const useCreateReferralRule = () =>
	useAdminMutation(
		({ programId, body }: { programId: string; body: TReferralRuleDto }) =>
			S.createRule(programId, body),
		'Failed to create rule',
	);

export const useUpdateReferralRule = () =>
	useAdminMutation(
		({ id, body }: { id: string; body: TReferralRuleDto }) => S.updateRule(id, body),
		'Failed to save rule',
	);

export const useDeleteReferralRule = () =>
	useAdminMutation((id: string) => S.deleteRule(id), 'Failed to delete rule');

export const useToggleReferralRule = () =>
	useAdminMutation((id: string) => S.toggleRule(id), 'Failed to switch rule');

export const useReorderReferralRules = () =>
	useAdminMutation(
		({ programId, ruleIds }: { programId: string; ruleIds: string[] }) =>
			S.reorderRules(programId, ruleIds),
		'Failed to reorder rules',
	);

export const useUpdateAdminReferralCode = () =>
	useAdminMutation(
		({ id, body }: { id: string; body: TUpdateAdminReferralCodeDto }) => S.updateCode(id, body),
		'Failed to update code',
	);

export const useRejectReferral = () =>
	useAdminMutation(
		({ id, reason }: { id: string; reason: string }) => S.rejectReferral(id, reason),
		'Failed to reject referral',
	);

export const useRestoreReferral = () =>
	useAdminMutation((id: string) => S.restoreReferral(id), 'Failed to restore referral');

export const useApproveReferralReward = () =>
	useAdminMutation((id: string) => S.approveReward(id), 'Failed to approve reward');

export const useGrantReferralRewardNow = () =>
	useAdminMutation((id: string) => S.grantRewardNow(id), 'Failed to grant reward');

export const useRevokeReferralReward = () =>
	useAdminMutation(
		({ id, reason }: { id: string; reason: string }) => S.revokeReward(id, reason),
		'Failed to revoke reward',
	);

export const useGrantManualReferralReward = () =>
	useAdminMutation(
		(payload: TManualReferralRewardDto) => S.grantManualReward(payload),
		'Failed to grant reward',
	);

export const useBlockReferralDomain = () =>
	useAdminMutation(
		(payload: { domain: string; reason?: string }) => S.blockDomain(payload),
		'Failed to block domain',
	);

export const useUnblockReferralDomain = () =>
	useAdminMutation((id: string) => S.unblockDomain(id), 'Failed to unblock domain');
