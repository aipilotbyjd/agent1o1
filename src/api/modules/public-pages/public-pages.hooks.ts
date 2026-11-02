import { useMutation, useQuery } from '@tanstack/react-query';
import type { TPageEventType, TSubmitPageDto } from '@/types/public-page.type';
import { PublicPageService } from './public-pages.service';
import { publicPageKeys } from './public-pages.keys';

// ============================================================
// Public Page Hooks
// ------------------------------------------------------------
// Hand-written rather than through the CRUD resource factory: the
// page is addressed by its link token, not a workspace and id.
// All `silent`: a visitor sees problems inline on the page, not as
// app toasts.
// ============================================================

/** Polling interval while a submission's run is still going. */
const RESULT_POLL_MS = 1500;

export const usePublicPage = (token: string, accessToken?: string | null) =>
	useQuery({
		queryKey: [...publicPageKeys.detail(token), accessToken ?? null],
		queryFn: ({ signal }) => PublicPageService.show(token, accessToken, signal),
		enabled: !!token,
		retry: false,
		refetchOnWindowFocus: false,
		meta: { silent: true },
	});

export const useUnlockPublicPage = (token: string) =>
	useMutation({
		mutationFn: (password: string) => PublicPageService.unlock(token, password),
		meta: { silent: true },
	});

export const useSubmitPublicPage = (token: string, accessToken?: string | null) =>
	useMutation({
		mutationFn: (body: TSubmitPageDto) => PublicPageService.submit(token, body, accessToken),
		meta: { silent: true },
	});

export const usePublicPageSubmission = (token: string, submissionId?: string, secret?: string) =>
	useQuery({
		queryKey: publicPageKeys.submission(token, submissionId ?? ''),
		queryFn: ({ signal }) => PublicPageService.result(token, submissionId!, secret!, signal),
		enabled: !!token && !!submissionId && !!secret,
		refetchInterval: (query) => {
			const state = query.state.data?.state;
			return state === 'completed' || state === 'failed' ? false : RESULT_POLL_MS;
		},
		meta: { silent: true },
	});

/** Fire-and-forget: an insights event must never break the page. */
export const trackPublicPageEvent = (token: string, type: TPageEventType) => {
	PublicPageService.event(token, type).catch(() => undefined);
};
