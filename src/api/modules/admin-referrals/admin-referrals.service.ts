import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAdminAuditLog,
	TAdminReferral,
	TAdminReferralCode,
	TAdminReferralReward,
	TAdminReferralStats,
	TBlockedDomain,
	TManualReferralRewardDto,
	TReferralProgram,
	TReferralProgramDto,
	TReferralRule,
	TReferralRuleDto,
	TSimulateReferralDto,
	TSimulationResult,
	TUpdateAdminReferralCodeDto,
} from '@/types/admin-referral.type';
import { AdminReferralEndpoints as E } from './admin-referrals.endpoints';

export type TAdminListParams = Record<string, string | number | undefined>;

const paged =
	<T>() =>
	(r: { data: TApiResponse<T[]> & { meta: TPaginationMeta } }) => ({
		items: r.data.data,
		meta: r.data.meta,
	});

export const AdminReferralService = {
	stats: (days: number, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAdminReferralStats>>(E.stats, { params: { days }, signal })
			.then(unwrap<TAdminReferralStats>),

	// ─── Programs ─────────────────────────────────────────────
	programs: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ programs: TReferralProgram[] }>>(E.programs, { signal })
			.then(unwrapKey<TReferralProgram[]>('programs')),

	program: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ program: TReferralProgram }>>(E.program(id), { signal })
			.then(unwrapKey<TReferralProgram>('program')),

	createProgram: (payload: TReferralProgramDto) =>
		axiosClient
			.post<TApiResponse<{ program: TReferralProgram }>>(E.programs, payload)
			.then(unwrapKey<TReferralProgram>('program')),

	updateProgram: (id: string, payload: TReferralProgramDto) =>
		axiosClient
			.patch<TApiResponse<{ program: TReferralProgram }>>(E.program(id), payload)
			.then(unwrapKey<TReferralProgram>('program')),

	deleteProgram: (id: string) => axiosClient.delete(E.program(id)).then(() => undefined),

	makeDefault: (id: string) =>
		axiosClient
			.post<TApiResponse<{ program: TReferralProgram }>>(E.makeDefault(id))
			.then(unwrapKey<TReferralProgram>('program')),

	duplicate: (id: string) =>
		axiosClient
			.post<TApiResponse<{ program: TReferralProgram }>>(E.duplicate(id))
			.then(unwrapKey<TReferralProgram>('program')),

	/** Dry run — nothing is written. */
	simulate: (id: string, payload: TSimulateReferralDto) =>
		axiosClient
			.post<TApiResponse<{ results: TSimulationResult[] }>>(E.simulate(id), payload)
			.then(unwrapKey<TSimulationResult[]>('results')),

	// ─── Rules ────────────────────────────────────────────────
	createRule: (programId: string, payload: TReferralRuleDto) =>
		axiosClient
			.post<TApiResponse<{ rule: TReferralRule }>>(E.rules(programId), payload)
			.then(unwrapKey<TReferralRule>('rule')),

	updateRule: (id: string, payload: TReferralRuleDto) =>
		axiosClient
			.patch<TApiResponse<{ rule: TReferralRule }>>(E.rule(id), payload)
			.then(unwrapKey<TReferralRule>('rule')),

	deleteRule: (id: string) => axiosClient.delete(E.rule(id)).then(() => undefined),

	toggleRule: (id: string) =>
		axiosClient
			.post<TApiResponse<{ rule: TReferralRule }>>(E.toggleRule(id))
			.then(unwrapKey<TReferralRule>('rule')),

	reorderRules: (programId: string, ruleIds: string[]) =>
		axiosClient
			.patch<TApiResponse<{ rules: TReferralRule[] }>>(E.reorderRules(programId), {
				rule_ids: ruleIds,
			})
			.then(unwrapKey<TReferralRule[]>('rules')),

	// ─── Codes ────────────────────────────────────────────────
	codes: (params?: TAdminListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAdminReferralCode[]> & { meta: TPaginationMeta }>(E.codes, {
				params,
				signal,
			})
			.then(paged<TAdminReferralCode>()),

	updateCode: (id: string, payload: TUpdateAdminReferralCodeDto) =>
		axiosClient
			.patch<TApiResponse<{ code: TAdminReferralCode }>>(E.code(id), payload)
			.then(unwrapKey<TAdminReferralCode>('code')),

	// ─── Referrals ────────────────────────────────────────────
	referrals: (params?: TAdminListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAdminReferral[]> & { meta: TPaginationMeta }>(E.referrals, {
				params,
				signal,
			})
			.then(paged<TAdminReferral>()),

	rejectReferral: (id: string, reason: string) =>
		axiosClient
			.post<TApiResponse<{ referral: TAdminReferral }>>(E.rejectReferral(id), { reason })
			.then(unwrapKey<TAdminReferral>('referral')),

	restoreReferral: (id: string) =>
		axiosClient
			.post<TApiResponse<{ referral: TAdminReferral }>>(E.restoreReferral(id))
			.then(unwrapKey<TAdminReferral>('referral')),

	// ─── Rewards ──────────────────────────────────────────────
	rewards: (params?: TAdminListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAdminReferralReward[]> & { meta: TPaginationMeta }>(E.rewards, {
				params,
				signal,
			})
			.then(paged<TAdminReferralReward>()),

	approveReward: (id: string) =>
		axiosClient
			.post<TApiResponse<{ reward: TAdminReferralReward }>>(E.approveReward(id))
			.then(unwrapKey<TAdminReferralReward>('reward')),

	grantRewardNow: (id: string) =>
		axiosClient
			.post<TApiResponse<{ reward: TAdminReferralReward }>>(E.grantRewardNow(id))
			.then(unwrapKey<TAdminReferralReward>('reward')),

	revokeReward: (id: string, reason: string) =>
		axiosClient
			.post<TApiResponse<{ reward: TAdminReferralReward }>>(E.revokeReward(id), { reason })
			.then(unwrapKey<TAdminReferralReward>('reward')),

	grantManualReward: (payload: TManualReferralRewardDto) =>
		axiosClient
			.post<TApiResponse<{ reward: TAdminReferralReward }>>(E.manualReward, payload)
			.then(unwrapKey<TAdminReferralReward>('reward')),

	// ─── Blocked domains ──────────────────────────────────────
	blockedDomains: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ domains: TBlockedDomain[] }>>(E.blockedDomains, { signal })
			.then(unwrapKey<TBlockedDomain[]>('domains')),

	blockDomain: (payload: { domain: string; reason?: string }) =>
		axiosClient
			.post<TApiResponse<{ domain: TBlockedDomain }>>(E.blockedDomains, payload)
			.then(unwrapKey<TBlockedDomain>('domain')),

	unblockDomain: (id: string) => axiosClient.delete(E.blockedDomain(id)).then(() => undefined),

	// ─── Audit log ────────────────────────────────────────────
	auditLog: (params?: TAdminListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAdminAuditLog[]> & { meta: TPaginationMeta }>(E.auditLog, {
				params,
				signal,
			})
			.then(paged<TAdminAuditLog>()),
};
