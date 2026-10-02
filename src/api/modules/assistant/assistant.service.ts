import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAssistant,
	TAssistantApp,
	TAssistantContext,
	TAssistantFeedback,
	TAssistantFeedbackRating,
	TAssistantStyle,
	TAssistantStyleKind,
	TAssistantDecision,
	TAssistantHome,
	TAssistantMemory,
	TAssistantMessage,
	TAssistantSession,
	TAssistantSessionDetail,
	TAssistantToolDescription,
	TAssistantToolRuleUpdate,
	TAssistantTurn,
	TSendAssistantMessageResult,
	TCreateAssistantSessionDto,
	TUpdateAssistantDto,
	TUpdateAssistantSessionDto,
} from '@/types/assistant.type';
import {
	AssistantEndpoints as A,
	AssistantMemoryEndpoints as M,
	AssistantSessionEndpoints as S,
	AssistantSettingsEndpoints as X,
} from './assistant.endpoints';

export const AssistantService = {
	/** Provisions the member's assistant on first call. */
	show: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAssistantHome>>(A.show(ws), { signal })
			.then(unwrap<TAssistantHome>),

	update: (ws: string, payload: TUpdateAssistantDto) =>
		axiosClient
			.patch<TApiResponse<{ assistant: TAssistant }>>(A.update(ws), payload)
			.then(unwrapKey<TAssistant>('assistant')),
};

export const AssistantSessionService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ sessions: TAssistantSession[] }>>(S.list(ws), { signal })
			.then(unwrapKey<TAssistantSession[]>('sessions')),

	/** The session plus its turn in progress (running or waiting on approvals). */
	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAssistantSessionDetail>>(S.detail(ws, id), { signal })
			.then(unwrap<TAssistantSessionDetail>),

	create: (ws: string, payload?: TCreateAssistantSessionDto) =>
		axiosClient
			.post<TApiResponse<{ session: TAssistantSession }>>(S.create(ws), payload ?? {})
			.then(unwrapKey<TAssistantSession>('session')),

	update: (ws: string, id: string, payload: TUpdateAssistantSessionDto) =>
		axiosClient
			.patch<TApiResponse<{ session: TAssistantSession }>>(S.update(ws, id), payload)
			.then(unwrapKey<TAssistantSession>('session')),

	remove: (ws: string, id: string) => axiosClient.delete(S.delete(ws, id)).then(() => undefined),

	messages: (
		ws: string,
		id: string,
		params?: { per_page?: number; page?: number },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TAssistantMessage[]> & { meta: TPaginationMeta }>(
				S.messages(ws, id),
				{
					params,
					signal,
				},
			)
			.then((res) => ({ messages: res.data.data, meta: res.data.meta })),

	context: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ context: TAssistantContext }>>(S.context(ws, id), { signal })
			.then(unwrapKey<TAssistantContext>('context')),

	feedback: (
		ws: string,
		id: string,
		messageId: string,
		rating: TAssistantFeedbackRating,
		comment?: string | null,
	) =>
		axiosClient
			.post<TApiResponse<{ feedback: TAssistantFeedback }>>(S.feedback(ws, id, messageId), {
				rating,
				comment: comment || null,
			})
			.then(unwrapKey<TAssistantFeedback>('feedback')),

	/** Answered on the queue — the reply streams over the session channel. */
	send: (ws: string, id: string, content: string) =>
		axiosClient
			.post<TApiResponse<TSendAssistantMessageResult>>(S.send(ws, id), { content })
			.then(unwrap<TSendAssistantMessageResult>),

	cancel: (ws: string, id: string, turnId: string) =>
		axiosClient
			.post<TApiResponse<{ turn: TAssistantTurn }>>(S.cancel(ws, id, turnId))
			.then(unwrapKey<TAssistantTurn>('turn')),

	decide: (ws: string, id: string, turnId: string, decisions: TAssistantDecision[]) =>
		axiosClient
			.post<TApiResponse<{ turn: TAssistantTurn }>>(S.decide(ws, id, turnId), { decisions })
			.then(unwrapKey<TAssistantTurn>('turn')),
};

export const AssistantMemoryService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ memories: TAssistantMemory[] }>>(M.list(ws), { signal })
			.then(unwrapKey<TAssistantMemory[]>('memories')),

	remove: (ws: string, id: string) => axiosClient.delete(M.delete(ws, id)).then(() => undefined),
};

export const AssistantSettingsService = {
	apps: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ apps: TAssistantApp[] }>>(X.apps(ws), { signal })
			.then(unwrapKey<TAssistantApp[]>('apps')),

	toolRules: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ tools: TAssistantToolDescription[] }>>(X.toolRules(ws), { signal })
			.then(unwrapKey<TAssistantToolDescription[]>('tools')),

	styles: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ styles: TAssistantStyle[] }>>(X.styles(ws), { signal })
			.then(unwrapKey<TAssistantStyle[]>('styles')),

	updateStyle: (ws: string, kind: TAssistantStyleKind, notes: string | null) =>
		axiosClient
			.put<TApiResponse<{ style: TAssistantStyle }>>(X.style(ws, kind), { notes })
			.then(unwrapKey<TAssistantStyle>('style')),

	restoreStyle: (ws: string, kind: TAssistantStyleKind, revisionId: string) =>
		axiosClient
			.post<TApiResponse<{ style: TAssistantStyle }>>(X.restoreStyle(ws, kind, revisionId))
			.then(unwrapKey<TAssistantStyle>('style')),

	/** Voice input: the recording in, the transcript out. */
	transcribe: (ws: string, audio: Blob) => {
		const form = new FormData();
		const extension = audio.type.includes('mp4')
			? 'mp4'
			: audio.type.includes('ogg')
				? 'ogg'
				: 'webm';
		form.append('audio', audio, `voice.${extension}`);
		return axiosClient
			.post<TApiResponse<{ text: string }>>(X.transcribe(ws), form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})
			.then(unwrapKey<string>('text'));
	},

	updateToolRules: (ws: string, rules: TAssistantToolRuleUpdate[]) =>
		axiosClient
			.put<TApiResponse<{ tools: TAssistantToolDescription[] }>>(X.toolRules(ws), { rules })
			.then(unwrapKey<TAssistantToolDescription[]>('tools')),
};
