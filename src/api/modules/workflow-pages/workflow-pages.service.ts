import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TCreateWorkflowPageDto,
	TPageSubmissionRecord,
	TPageSubmissionResult,
	TPageBlock,
	TPageComment,
	TPageGeneration,
	TPageInsights,
	TPageVersion,
	TPageSection,
	TPageSubmissionFilters,
	TPageSubmissionPage,
	TPageVariant,
	TPageView,
	TUpdateWorkflowPageDto,
	TWorkflowPage,
} from '@/types/workflow-page.type';
import { PageSectionEndpoints as S, WorkflowPageEndpoints as E } from './workflow-pages.endpoints';

type TPageResponse = TApiResponse<{ page: TWorkflowPage }>;

const submissionParams = (filters: TPageSubmissionFilters) => ({
	...filters,
	include_tests: filters.include_tests === undefined ? undefined : filters.include_tests ? 1 : 0,
});

export const PageSectionService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sections: TPageSection[] }>>(S.list(ws), { signal })
			.then(unwrapKey<TPageSection[]>('sections')),

	create: (ws: string, payload: { name: string; block: TPageBlock }) =>
		axiosClient
			.post<TApiResponse<{ section: TPageSection }>>(S.create(ws), payload)
			.then(unwrapKey<TPageSection>('section')),

	rename: (ws: string, id: string, name: string) =>
		axiosClient
			.patch<TApiResponse<{ section: TPageSection }>>(S.update(ws, id), { name })
			.then(unwrapKey<TPageSection>('section')),

	remove: (ws: string, id: string) => axiosClient.delete(S.delete(ws, id)).then(() => undefined),
};

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

	/** One page of submissions matching the filters, with how many there are. */
	submissionsPage: (ws: string, id: string, filters: TPageSubmissionFilters, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TPageSubmissionPage>>(E.submissions(ws, id), {
				params: submissionParams(filters),
				signal,
			})
			.then((res) => res.data.data),

	/** Every submission matching the filters, as a CSV file for the browser to save. */
	exportSubmissions: (ws: string, id: string, filters: TPageSubmissionFilters) =>
		axiosClient
			.get<Blob>(E.exportSubmissions(ws, id), { params: submissionParams(filters), responseType: 'blob' })
			.then((res) => {
				const name = /filename="?([^";]+)"?/.exec(res.headers['content-disposition'] ?? '')?.[1] ?? 'submissions.csv';
				const url = URL.createObjectURL(res.data);
				const link = document.createElement('a');
				link.href = url;
				link.download = name;
				link.click();
				URL.revokeObjectURL(url);
			}),

	insights: (ws: string, id: string, params: { days: number; include_tests: boolean }, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ insights: TPageInsights }>>(E.insights(ws, id), {
				params: { days: params.days, include_tests: params.include_tests ? 1 : 0 },
				signal,
			})
			.then(unwrapKey<TPageInsights>('insights')),

	/** A member started filling in the published page. */
	started: (ws: string, id: string) =>
		axiosClient.post(E.events(ws, id), { type: 'start' }).then(() => undefined),

	versions: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ versions: TPageVersion[] }>>(E.versions(ws, id), { signal })
			.then(unwrapKey<TPageVersion[]>('versions')),

	version: (ws: string, id: string, versionId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ version: TPageVersion }>>(E.version(ws, id, versionId), { signal })
			.then(unwrapKey<TPageVersion>('version')),

	saveVersion: (ws: string, id: string, payload: { label?: string | null; kind?: 'saved' | 'before_generation' }) =>
		axiosClient
			.post<TApiResponse<{ version: TPageVersion }>>(E.versions(ws, id), payload)
			.then(unwrapKey<TPageVersion>('version')),

	restoreVersion: (ws: string, id: string, versionId: string) =>
		axiosClient.post<TPageResponse>(E.restoreVersion(ws, id, versionId)).then(unwrapKey<TWorkflowPage>('page')),

	comments: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ comments: TPageComment[] }>>(E.comments(ws, id), { signal })
			.then(unwrapKey<TPageComment[]>('comments')),

	addComment: (ws: string, id: string, payload: { body: string; block_id?: string | null; parent_id?: string | null }) =>
		axiosClient
			.post<TApiResponse<{ comment: TPageComment }>>(E.comments(ws, id), payload)
			.then(unwrapKey<TPageComment>('comment')),

	updateComment: (ws: string, id: string, commentId: string, payload: { body?: string; resolved?: boolean }) =>
		axiosClient
			.patch<TApiResponse<{ comment: TPageComment }>>(E.comment(ws, id, commentId), payload)
			.then(unwrapKey<TPageComment>('comment')),

	deleteComment: (ws: string, id: string, commentId: string) =>
		axiosClient.delete(E.comment(ws, id, commentId)).then(() => undefined),

	generate: (ws: string, id: string, payload: { prompt: string; variant: TPageVariant; keep_theme: boolean }) =>
		axiosClient
			.post<TApiResponse<{ generation: TPageGeneration }>>(E.generations(ws, id), payload)
			.then(unwrapKey<TPageGeneration>('generation')),

	generation: (ws: string, id: string, generationId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ generation: TPageGeneration }>>(E.generation(ws, id, generationId), { signal })
			.then(unwrapKey<TPageGeneration>('generation')),

	createVariant: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.variant(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	removeVariant: (ws: string, id: string) =>
		axiosClient.delete<TPageResponse>(E.variant(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	promoteVariant: (ws: string, id: string) =>
		axiosClient.post<TPageResponse>(E.promoteVariant(ws, id)).then(unwrapKey<TWorkflowPage>('page')),

	/** `test` runs the draft from the builder and doesn't count toward the daily limit. */
	/** `variant` picks the draft a test run uses. */
	submit: (ws: string, id: string, input: Record<string, unknown>, test = false, variant: TPageVariant = 'a') =>
		axiosClient
			.post<TApiResponse<{ submission: TPageSubmissionResult }>>(E.submissions(ws, id), {
				input,
				test,
				...(test ? { variant } : {}),
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
