import { axiosClient } from '@/api/client';
import type { TApiResponse } from '@/api/core';
import type { TPageSubmissionResult, TPageView } from '@/types/workflow-page.type';
import { PublicPageEndpoints as E } from './workflow-pages.endpoints';

/** Sent back on every request once a password page is unlocked. */
const ACCESS_HEADER = 'X-Page-Access';
/** Reads a submission's result; returned only to whoever submitted it. */
const SECRET_HEADER = 'X-Submission-Secret';

const accessHeaders = (accessToken?: string | null) =>
	accessToken ? { [ACCESS_HEADER]: accessToken } : undefined;

export const PublicPageService = {
	show: (token: string, accessToken?: string | null, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ page: TPageView }>>(E.show(token), {
				headers: accessHeaders(accessToken),
				signal,
			})
			.then((res) => res.data.data.page),

	unlock: (token: string, password: string) =>
		axiosClient
			.post<TApiResponse<{ access_token: string; page: TPageView }>>(E.unlock(token), {
				password,
			})
			.then((res) => res.data.data),

	submit: (token: string, input: Record<string, unknown>, accessToken?: string | null) =>
		axiosClient
			.post<TApiResponse<{ submission: TPageSubmissionResult; secret: string }>>(
				E.submit(token),
				{ input },
				{ headers: accessHeaders(accessToken) },
			)
			.then((res) => res.data.data),

	result: (token: string, submissionId: string, secret: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ submission: TPageSubmissionResult }>>(E.result(token, submissionId), {
				headers: { [SECRET_HEADER]: secret },
				signal,
			})
			.then((res) => res.data.data.submission),
};
