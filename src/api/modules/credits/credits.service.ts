import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse, TPaginatedResponse } from '@/api/core';
import type {
	TCreditBalance,
	TCreditTransaction,
	TCreditTransactionFilters,
} from '@/types/credit.type';
import type { TCreditPack } from '@/types/credit.type';
import { CreditEndpoints as E } from './credits.endpoints';

export const CreditService = {
	balance: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCreditBalance>>(E.balance(ws), { signal })
			.then(unwrap<TCreditBalance>),

	transactions: (ws: string, filters?: TCreditTransactionFilters, signal?: AbortSignal) =>
		axiosClient
			.get<TPaginatedResponse<TCreditTransaction>>(E.transactions(ws), {
				params: filters,
				signal,
			})
			.then((r) => r.data),

	packs: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCreditPack[]>>(E.packs(ws), { signal })
			.then(unwrap<TCreditPack[]>),
};
