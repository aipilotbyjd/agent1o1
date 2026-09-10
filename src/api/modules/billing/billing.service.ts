import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TCursorPaginationMeta } from '@/api/core';
import type {
	TBillingOverview,
	TPlan,
	TSubscription,
	TCheckoutSubscriptionDto,
	TCheckoutSubscriptionResult,
	TPreviewSubscriptionSwapDto,
	TInvoice,
	TCreditPackOffer,
	TCreditPack,
	TCheckoutCreditPackDto,
	TCheckoutCreditPackResult,
	TCreditTransaction,
} from '@/types/billing.type';
import { BillingEndpoints as E } from './billing.endpoints';

export const BillingService = {
	overview: (ws: string, signal?: AbortSignal) =>
		axiosClient.get<TApiResponse<TBillingOverview>>(E.overview(ws), { signal }).then((r) => r.data.data),

	plans: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ plans: TPlan[] }>>(E.plans(ws), { signal })
			.then(unwrapKey<TPlan[]>('plans')),

	// `null` when the workspace has never subscribed.
	subscription: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ subscription: TSubscription | null }>>(E.subscription(ws), { signal })
			.then(unwrapKey<TSubscription | null>('subscription')),

	// Starts a brand-new subscription (or a lifetime grant) with a Stripe
	// checkout URL; if a recurring subscription already exists, swaps the
	// plan in place and returns the updated subscription instead.
	checkoutSubscription: (ws: string, payload: TCheckoutSubscriptionDto) =>
		axiosClient
			.post<TApiResponse<TCheckoutSubscriptionResult>>(E.subscriptionCheckout(ws), payload)
			.then((r) => r.data.data),

	previewSubscriptionSwap: (ws: string, payload: TPreviewSubscriptionSwapDto, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ invoice: TInvoice | null }>>(E.subscriptionPreview(ws), {
				params: payload,
				signal,
			})
			.then(unwrapKey<TInvoice | null>('invoice')),

	cancelSubscription: (ws: string) =>
		axiosClient
			.post<TApiResponse<{ subscription: TSubscription }>>(E.subscriptionCancel(ws))
			.then(unwrapKey<TSubscription>('subscription')),

	resumeSubscription: (ws: string) =>
		axiosClient
			.post<TApiResponse<{ subscription: TSubscription }>>(E.subscriptionResume(ws))
			.then(unwrapKey<TSubscription>('subscription')),

	creditPacks: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ packs: TCreditPackOffer[] }>>(E.creditPacks(ws), { signal })
			.then(unwrapKey<TCreditPackOffer[]>('packs')),

	creditPacksPurchased: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ credit_packs: TCreditPack[] }>>(E.creditPacksPurchased(ws), { signal })
			.then(unwrapKey<TCreditPack[]>('credit_packs')),

	checkoutCreditPack: (ws: string, payload: TCheckoutCreditPackDto) =>
		axiosClient
			.post<TApiResponse<TCheckoutCreditPackResult>>(E.creditPacksCheckout(ws), payload)
			.then((r) => r.data.data),

	// The workspace's credit ledger — paginates internally.
	credits: (ws: string, params?: { page?: number; per_page?: number }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCreditTransaction[]>>(E.credits(ws), { params, signal })
			.then((r) => r.data.data),

	// Cursor-paginated — Stripe's list API has no total count or offset.
	invoices: (ws: string, params?: { per_page?: number; cursor?: string }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TInvoice[]> & { meta: TCursorPaginationMeta }>(E.invoices(ws), {
				params,
				signal,
			})
			.then((r) => ({ invoices: r.data.data, meta: r.data.meta })),

	invoicesUpcoming: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ invoice: TInvoice | null }>>(E.invoicesUpcoming(ws), { signal })
			.then(unwrapKey<TInvoice | null>('invoice')),

	invoice: (ws: string, invoiceId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ invoice: TInvoice }>>(E.invoice(ws, invoiceId), { signal })
			.then(unwrapKey<TInvoice>('invoice')),

	createPortalSession: (ws: string) =>
		axiosClient
			.post<TApiResponse<{ portal_url: string }>>(E.portal(ws))
			.then(unwrapKey<string>('portal_url')),
};
