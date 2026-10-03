import { axiosClient } from '@/api/client';
import { unwrap, unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAssistant,
	TAssistantApp,
	TAssistantChannels,
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
	TBriefingRun,
	TDailyReport,
	TAssistantTrigger,
	TSaveTriggerDto,
	TInbox,
	TInboxProvider,
	TInboxSettings,
	TSaveInboxLabelDto,
	TMeeting,
	TMeetingPrepReport,
	TMeetingsList,
	TSituation,
	TUpdateBriefingConfigDto,
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
	AssistantBriefingEndpoints as B,
	AssistantInboxEndpoints as N,
	AssistantTriggerEndpoints as T,
	AssistantChannelEndpoints as C,
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

export const AssistantBriefingService = {
	daily: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TDailyReport>>(B.daily(ws), { signal })
			.then(unwrap<TDailyReport>),

	updateDaily: (ws: string, payload: TUpdateBriefingConfigDto) =>
		axiosClient
			.put<TApiResponse<TDailyReport>>(B.daily(ws), payload)
			.then(unwrap<TDailyReport>),

	pause: (ws: string) =>
		axiosClient.post<TApiResponse<TDailyReport>>(B.pause(ws)).then(unwrap<TDailyReport>),

	resume: (ws: string) =>
		axiosClient.post<TApiResponse<TDailyReport>>(B.resume(ws)).then(unwrap<TDailyReport>),

	runNow: (ws: string) =>
		axiosClient
			.post<TApiResponse<{ run: TBriefingRun | null }>>(B.runNow(ws))
			.then(unwrapKey<TBriefingRun | null>('run')),

	run: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ run: TBriefingRun }>>(B.run(ws, id), { signal })
			.then(unwrapKey<TBriefingRun>('run')),

	meetingPrep: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TMeetingPrepReport>>(B.meetingPrep(ws), { signal })
			.then(unwrap<TMeetingPrepReport>),

	updateMeetingPrep: (ws: string, payload: TUpdateBriefingConfigDto) =>
		axiosClient
			.put<TApiResponse<TMeetingPrepReport>>(B.meetingPrep(ws), payload)
			.then(unwrap<TMeetingPrepReport>),

	meetings: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TMeetingsList>>(B.meetings(ws), { signal })
			.then(unwrap<TMeetingsList>),

	prepare: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ meeting: TMeeting }>>(B.prepare(ws, id))
			.then(unwrapKey<TMeeting>('meeting')),

	situations: (ws: string, status: string, signal?: AbortSignal) =>
		axiosClient
			.get<
				TApiResponse<{ situations: TSituation[] }>
			>(B.situations(ws), { params: { status }, signal })
			.then(unwrapKey<TSituation[]>('situations')),

	updateSituation: (ws: string, id: string, status: TSituation['status']) =>
		axiosClient
			.patch<TApiResponse<{ situation: TSituation }>>(B.situation(ws, id), { status })
			.then(unwrapKey<TSituation>('situation')),

	updateStep: (
		ws: string,
		id: string,
		stepId: string,
		status: TSituation['steps'][number]['status'],
	) =>
		axiosClient
			.patch<TApiResponse<{ situation: TSituation }>>(B.step(ws, id, stepId), { status })
			.then(unwrapKey<TSituation>('situation')),

	send: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ situation: TSituation }>>(B.send(ws, id))
			.then(unwrapKey<TSituation>('situation')),
};

export const AssistantInboxService = {
	show: (ws: string, signal?: AbortSignal) =>
		axiosClient.get<TApiResponse<TInbox>>(N.inbox(ws), { signal }).then(unwrap<TInbox>),

	update: (ws: string, payload: Partial<TInboxSettings>) =>
		axiosClient.put<TApiResponse<TInbox>>(N.inbox(ws), payload).then(unwrap<TInbox>),

	enable: (ws: string, provider?: TInboxProvider) =>
		axiosClient
			.post<TApiResponse<TInbox>>(N.enable(ws), provider ? { provider } : {})
			.then(unwrap<TInbox>),

	disable: (ws: string) =>
		axiosClient.post<TApiResponse<TInbox>>(N.disable(ws)).then(unwrap<TInbox>),

	createLabel: (ws: string, payload: TSaveInboxLabelDto) =>
		axiosClient.post<TApiResponse<TInbox>>(N.labels(ws), payload).then(unwrap<TInbox>),

	updateLabel: (ws: string, id: string, payload: TSaveInboxLabelDto) =>
		axiosClient.patch<TApiResponse<TInbox>>(N.label(ws, id), payload).then(unwrap<TInbox>),

	deleteLabel: (ws: string, id: string) =>
		axiosClient.delete<TApiResponse<TInbox>>(N.label(ws, id)).then(unwrap<TInbox>),

	accept: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ session_id: string }>>(N.accept(ws, id))
			.then(unwrapKey<string>('session_id')),
};

export const AssistantTriggerService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ triggers: TAssistantTrigger[] }>>(T.list(ws), { signal })
			.then(unwrapKey<TAssistantTrigger[]>('triggers')),

	create: (ws: string, payload: TSaveTriggerDto) =>
		axiosClient
			.post<TApiResponse<{ trigger: TAssistantTrigger }>>(T.list(ws), payload)
			.then(unwrapKey<TAssistantTrigger>('trigger')),

	update: (ws: string, id: string, payload: TSaveTriggerDto) =>
		axiosClient
			.patch<TApiResponse<{ trigger: TAssistantTrigger }>>(T.trigger(ws, id), payload)
			.then(unwrapKey<TAssistantTrigger>('trigger')),

	remove: (ws: string, id: string) => axiosClient.delete(T.trigger(ws, id)).then(() => undefined),

	runNow: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ session_id: string | null; skipped: boolean }>>(T.runNow(ws, id))
			.then(unwrap<{ session_id: string | null; skipped: boolean }>),
};

export const AssistantChannelService = {
	list: (ws: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAssistantChannels>>(C.list(ws), { signal })
			.then(unwrap<TAssistantChannels>),

	smsStart: (ws: string, phone: string) =>
		axiosClient.post(C.smsStart(ws), { phone }).then(() => undefined),

	smsConfirm: (ws: string, code: string) =>
		axiosClient.post(C.smsConfirm(ws), { code }).then(() => undefined),

	smsRemove: (ws: string) => axiosClient.delete(C.sms(ws)).then(() => undefined),

	slackInstallUrl: (ws: string) =>
		axiosClient
			.post<TApiResponse<{ url: string }>>(C.slackInstall(ws))
			.then(unwrapKey<string>('url')),
};
