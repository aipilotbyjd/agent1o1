import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/api/core';
import type {
	TCheckoutSubscriptionDto,
	TPreviewSubscriptionSwapDto,
	TCheckoutCreditPackDto,
	TUpdateCreditOverageDto,
	TUpdateCreditNotificationsDto,
	TBuyCreditsDto,
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
		mutationFn: (payload: TCheckoutSubscriptionDto) =>
			BillingService.checkoutSubscription(ws, payload),
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
		mutationFn: (payload: TCheckoutCreditPackDto) =>
			BillingService.checkoutCreditPack(ws, payload),
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

export const useCreditOverage = (ws: string) =>
	useQuery({
		queryKey: billingKeys.overage(ws),
		queryFn: ({ signal }) => BillingService.overage(ws, signal),
		enabled: !!ws,
	});

export const useUpdateCreditOverage = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateCreditOverageDto) => BillingService.updateOverage(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.overage(ws) }),
		meta: { errorMessage: 'Failed to update credit overage settings' },
	});
};

export const useCreditNotifications = (ws: string) =>
	useQuery({
		queryKey: billingKeys.creditNotifications(ws),
		queryFn: ({ signal }) => BillingService.creditNotifications(ws, signal),
		enabled: !!ws,
	});

export const useUpdateCreditNotifications = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateCreditNotificationsDto) =>
			BillingService.updateCreditNotifications(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.creditNotifications(ws) }),
		meta: { errorMessage: 'Failed to update credit notification preferences' },
	});
};

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

// ─── Ported from the old frontend ──────────────────────────
// Copied verbatim from `agent-1o1`'s billing module so the ported
// billing screens run unchanged. They sit on the old backend's
// pack-catalog and portal endpoints; the hooks above are the new
// contract the screens should move onto.

export const usePackCatalog = (ws: string) =>
	useQuery({
		queryKey: billingKeys.packCatalog(ws),
		queryFn: ({ signal }) => BillingService.packCatalog(ws, signal),
		enabled: !!ws,
		staleTime: 5 * 60_000,
	});

export const useBuyCredits = (ws: string) =>
	useMutation({
		mutationFn: (body: TBuyCreditsDto) => BillingService.buyCredits(ws, body),
		onSuccess: ({ url }) => {
			window.location.href = url;
		},
		onError: notify.fromError('Failed to start credit purchase'),
	});

export const useBillingPortal = (ws: string) =>
	useMutation({
		mutationFn: () => BillingService.portal(ws),
		onSuccess: ({ url }) => {
			window.location.href = url;
		},
		onError: notify.fromError('Failed to open billing portal'),
	});
