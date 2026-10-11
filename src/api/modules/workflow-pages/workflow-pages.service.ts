import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TCreateWorkflowPageDto,
	TPageSubmissionRecord,
	TPageSubmissionResult,
	TPageView,
	TUpdateWorkflowPageDto,
	TWorkflowPage,
} from '@/types/workflow-page.type';
import { WorkflowPageEndpoints as E } from './workflow-pages.endpoints';

type TPageResponse = TApiResponse<{ page: TWorkflowPage }>;

export const WorkflowPageService = {
	list: (ws: string, params?: { workflow_id?: string }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ pages: TWorkflowPage[] }>>(E.list(ws), { params, signal })
			.then(unwrapKey<TWorkflowPage[]>('pages')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient.get<TPageResponse>(E.detail(ws, id), { signal }).then(unwrapKey<TWorkflowPage>('page')),

	create: (ws: string, payload: TCreateWorkflowPageDto) =>
		axiosClient.post<TPageResponse>(E.create(ws), payload).then(unwrapKey<TWorkflowPage>('page')),

	update: (ws: string, id: string, payload: TUpdateWorkflowPageDto) =>
		axiosClient.patch<TPageResponse>(E.update(ws, id), payload).then(unwrapKey<TWorkflowPage>('page')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	duplicate: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.duplicate(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	/** Refused with a 422 listing what to fix when the draft has errors. */
	publish: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.publish(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	unpublish: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.unpublish(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	rotateLink: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.rotateLink(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	/** The published page as a member uses it; `draft` serves the draft. */
	view: (ws: string, id: string, draft = false, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ view: TPageView }>>(E.view(ws, id), {
				params: draft ? { draft: 1 } : undefined,
				signal,
			})
			.then(unwrapKey<TPageView>('view')),

	submissions: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ submissions: TPageSubmissionRecord[] }>>(E.submissions(ws, id), { signal })
			.then(unwrapKey<TPageSubmissionRecord[]>('submissions')),

	/** `test` runs the draft from the builder and doesn't count toward the daily limit. */
	submit: (ws: string, id: string, input: Record<string, unknown>, test = false) =>
		axiosClient
			.post<TApiResponse<{ submission: TPageSubmissionResult }>>(E.submissions(ws, id), {
				input,
				test,
			})
			.then(unwrapKey<TPageSubmissionResult>('submission')),

	submission: (ws: string, id: string, submissionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ submission: TPageSubmissionResult }>>(
				E.submission(ws, id, submissionId),
				{ signal },
			)
			.then(unwrapKey<TPageSubmissionResult>('submission')),
};
