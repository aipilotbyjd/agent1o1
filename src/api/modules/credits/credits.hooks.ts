import { useQuery } from '@tanstack/react-query';
import type { TCreditTransactionFilters } from '@/types/credit.type';
import { CreditService } from './credits.service';
import { creditKeys } from './credits.keys';

export const useCreditBalance = (ws: string) =>
	useQuery({
		queryKey: creditKeys.balance(ws),
		queryFn: ({ signal }) => CreditService.balance(ws, signal),
		enabled: !!ws,
		staleTime: 60_000,
	});

export const useCreditTransactions = (ws: string, filters?: TCreditTransactionFilters) =>
	useQuery({
		queryKey: creditKeys.transactions(ws, filters as unknown as Record<string, unknown>),
		queryFn: ({ signal }) => CreditService.transactions(ws, filters, signal),
		enabled: !!ws,
	});

export const useCreditPacks = (ws: string) =>
	useQuery({
		queryKey: creditKeys.packs(ws),
		queryFn: ({ signal }) => CreditService.packs(ws, signal),
		enabled: !!ws,
		staleTime: 60_000,
	});
