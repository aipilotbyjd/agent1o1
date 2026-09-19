import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/api/core';
import type { TSubscription } from '@/types/billing.type';
import { PlanService } from './plans.service';
import { planKeys } from './plans.keys';

export const usePlans = () =>
	useQuery({
		queryKey: planKeys.list(),
		queryFn: ({ signal }) => PlanService.list(signal),
		staleTime: 5 * 60_000,
	});

export const useSubscription = (ws: string) =>
	useQuery({
		queryKey: planKeys.subscription(ws),
		queryFn: ({ signal }) => PlanService.subscription(ws, signal),
		enabled: !!ws,
		staleTime: 60_000,
	});

const useSubscriptionMutation = (
	ws: string,
	action: (ws: string) => Promise<TSubscription>,
	{ success, error }: { success: string; error: string },
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => action(ws),
		onSuccess: (data) => {
			qc.setQueryData(planKeys.subscription(ws), data);
			qc.invalidateQueries({ queryKey: planKeys.subscription(ws) });
			notify.success(success);
		},
		onError: notify.fromError(error),
	});
};

export const useCancelSubscription = (ws: string) =>
	useSubscriptionMutation(ws, PlanService.cancelSubscription, {
		success: 'Subscription canceled',
		error: 'Failed to cancel subscription',
	});

export const useResumeSubscription = (ws: string) =>
	useSubscriptionMutation(ws, PlanService.resumeSubscription, {
		success: 'Subscription resumed',
		error: 'Failed to resume subscription',
	});

export const useUsageSnapshots = (ws: string, params?: { from?: string; to?: string }) =>
	useQuery({
		queryKey: planKeys.usageSnapshots(ws, params as Record<string, string>),
		queryFn: ({ signal }) => PlanService.usageSnapshots(ws, params, signal),
		enabled: !!ws,
		staleTime: 5 * 60_000,
	});
