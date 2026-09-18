import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TPlan, TSubscription } from '@/types/billing.type';
import type { TUsageSnapshots } from '@/types/credit.type';
import { PlanEndpoints as E } from './plans.endpoints';

export const PlanService = {
	list: (signal?: AbortSignal) =>
		axiosClient.get<TApiResponse<TPlan[]>>(E.list(), { signal }).then(unwrap<TPlan[]>),

	subscription: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TSubscription>>(E.subscription(ws), { signal })
			.then(unwrap<TSubscription>),

	cancelSubscription: (ws: string) =>
		axiosClient
			.post<TApiResponse<TSubscription>>(E.cancelSubscription(ws))
			.then(unwrap<TSubscription>),

	resumeSubscription: (ws: string) =>
		axiosClient
			.post<TApiResponse<TSubscription>>(E.resumeSubscription(ws))
			.then(unwrap<TSubscription>),

	usageSnapshots: (ws: string, params?: { from?: string; to?: string }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TUsageSnapshots>>(E.usageSnapshots(ws), { params, signal })
			.then(unwrap<TUsageSnapshots>),
};
