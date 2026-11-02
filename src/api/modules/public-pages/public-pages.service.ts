import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TPageEventType,
	TPageSubmission,
	TPublicPage,
	TSubmitPageDto,
	TSubmitPageResult,
	TUnlockPageResult,
} from '@/types/public-page.type';
import { getPageVisitorId } from '@/utils/pageVisitor.util';
import { PublicPageEndpoints as E, PublicPageHeaders as H } from './public-pages.endpoints';

const headers = (accessToken?: string | null, extra?: Record<string, string>) => ({
	[H.visitor]: getPageVisitorId(),
	...(accessToken ? { [H.access]: accessToken } : {}),
	...extra,
});

export const PublicPageService = {
	show: (token: string, accessToken?: string | null, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ page: TPublicPage }>>(E.show(token), {
				headers: headers(accessToken),
				signal,
			})
			.then(unwrapKey<TPublicPage>('page')),

	event: (token: string, type: TPageEventType) =>
		axiosClient.post(E.events(token), { type }, { headers: headers() }).then(() => undefined),

	unlock: (token: string, password: string) =>
		axiosClient
			.post<
				TApiResponse<TUnlockPageResult>
			>(E.unlock(token), { password }, { headers: headers() })
			.then(unwrap<TUnlockPageResult>),

	submit: (token: string, body: TSubmitPageDto, accessToken?: string | null) =>
		axiosClient
			.post<
				TApiResponse<TSubmitPageResult>
			>(E.submit(token), body, { headers: headers(accessToken) })
			.then(unwrap<TSubmitPageResult>),

	result: (token: string, submissionId: string, secret: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ submission: TPageSubmission }>>(E.result(token, submissionId), {
				headers: headers(null, { [H.submissionSecret]: secret }),
				signal,
			})
			.then(unwrapKey<TPageSubmission>('submission')),
};
