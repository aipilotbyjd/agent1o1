import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCheckoutSubscriptionDto,
	TPreviewSubscriptionSwapDto,
	TCheckoutCreditPackDto,
} from '@/types/billing.type';
import { BillingService } from './billing.service';
import { billingKeys } from './billing.keys';

export const useBillingOverview = (ws: string) =>
	useQuery({
		queryKey: billingKeys.overview(ws),
		queryFn: ({ signal }) => BillingService.overview(ws, signal),
		enabled: !!ws,
	});

export const usePlans = (ws: string) =>
	useQuery({
		queryKey: billingKeys.plans(ws),
		queryFn: ({ signal }) => BillingService.plans(ws, signal),
		enabled: !!ws,
		staleTime: 30 * 60_000,
	});

export const useSubscription = (ws: string) =>
	useQuery({
		queryKey: billingKeys.subscription(ws),
		queryFn: ({ signal }) => BillingService.subscription(ws, signal),
		enabled: !!ws,
	});

export const usePreviewSubscriptionSwap = (ws: string, payload: TPreviewSubscriptionSwapDto) =>
	useQuery({
		queryKey: billingKeys.subscriptionPreview(ws, payload.plan_id, payload.interval),
		queryFn: ({ signal }) => BillingService.previewSubscriptionSwap(ws, payload, signal),
		enabled: !!ws && !!payload.plan_id,
	});

const invalidateBilling = (qc: ReturnType<typeof useQueryClient>, ws: string) => {
	qc.invalidateQueries({ queryKey: billingKeys.overview(ws) });
	qc.invalidateQueries({ queryKey: billingKeys.subscription(ws) });
};

export const useCheckoutSubscription = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCheckoutSubscriptionDto) => BillingService.checkoutSubscription(ws, payload),
		onSuccess: () => invalidateBilling(qc, ws),
		meta: { errorMessage: 'Failed to start checkout' },
	});
};

export const useCancelSubscription = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => BillingService.cancelSubscription(ws),
		onSuccess: () => invalidateBilling(qc, ws),
		meta: { errorMessage: 'Failed to cancel subscription' },
	});
};

export const useResumeSubscription = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => BillingService.resumeSubscription(ws),
		onSuccess: () => invalidateBilling(qc, ws),
		meta: { errorMessage: 'Failed to resume subscription' },
	});
};

export const useCreditPacks = (ws: string) =>
	useQuery({
		queryKey: billingKeys.creditPacks(ws),
		queryFn: ({ signal }) => BillingService.creditPacks(ws, signal),
		enabled: !!ws,
	});

export const usePurchasedCreditPacks = (ws: string) =>
	useQuery({
		queryKey: billingKeys.creditPacksPurchased(ws),
		queryFn: ({ signal }) => BillingService.creditPacksPurchased(ws, signal),
		enabled: !!ws,
	});

export const useCheckoutCreditPack = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCheckoutCreditPackDto) => BillingService.checkoutCreditPack(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.creditPacksPurchased(ws) }),
		meta: { errorMessage: 'Failed to start pack checkout' },
	});
};

export const useCredits = (ws: string, params?: { page?: number; per_page?: number }) =>
	useQuery({
		queryKey: billingKeys.credits(ws, params),
		queryFn: ({ signal }) => BillingService.credits(ws, params, signal),
		enabled: !!ws,
	});

export const useInvoices = (ws: string, params?: { per_page?: number; cursor?: string }) =>
	useQuery({
		queryKey: billingKeys.invoices(ws, params),
		queryFn: ({ signal }) => BillingService.invoices(ws, params, signal),
		enabled: !!ws,
	});

export const useUpcomingInvoice = (ws: string) =>
	useQuery({
		queryKey: billingKeys.invoicesUpcoming(ws),
		queryFn: ({ signal }) => BillingService.invoicesUpcoming(ws, signal),
		enabled: !!ws,
	});

export const useInvoice = (ws: string, invoiceId: string) =>
	useQuery({
		queryKey: billingKeys.invoice(ws, invoiceId),
		queryFn: ({ signal }) => BillingService.invoice(ws, invoiceId, signal),
		enabled: !!ws && !!invoiceId,
	});

export const useCreateBillingPortalSession = (ws: string) =>
	useMutation({
		mutationFn: () => BillingService.createPortalSession(ws),
		meta: { errorMessage: 'Failed to open billing portal' },
	});
