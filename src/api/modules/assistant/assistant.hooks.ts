import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	TSaveTriggerDto,
	TInbox,
	TInboxProvider,
	TInboxSettings,
	TSaveInboxLabelDto,
	TSituation,
	TUpdateBriefingConfigDto,
	TAssistantDecision,
	TAssistantFeedbackRating,
	TAssistantStyleKind,
	TAssistantToolRuleUpdate,
	TCreateAssistantSessionDto,
	TUpdateAssistantDto,
	TUpdateAssistantSessionDto,
} from '@/types/assistant.type';
import {
	AssistantBriefingService,
	AssistantChannelService,
	AssistantInboxService,
	AssistantTriggerService,
	AssistantMemoryService,
	AssistantService,
	AssistantSettingsService,
	AssistantSessionService,
} from './assistant.service';
import { assistantKeys } from './assistant.keys';

export const useAssistant = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.home(ws),
		queryFn: ({ signal }) => AssistantService.show(ws, signal),
		enabled: !!ws,
	});

export const useUpdateAssistant = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateAssistantDto) => AssistantService.update(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.home(ws) }),
		meta: { errorMessage: 'Failed to update your assistant' },
	});
};

export const useAssistantSessions = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.sessions(ws),
		queryFn: ({ signal }) => AssistantSessionService.list(ws, signal),
		enabled: !!ws,
	});

export const useAssistantSession = (ws: string, id: string) =>
	useQuery({
		queryKey: assistantKeys.session(ws, id),
		queryFn: ({ signal }) => AssistantSessionService.detail(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useAssistantMessages = (ws: string, id: string) =>
	useQuery({
		queryKey: assistantKeys.messages(ws, id),
		queryFn: ({ signal }) =>
			AssistantSessionService.messages(ws, id, { per_page: 200 }, signal),
		enabled: !!ws && !!id,
	});

export const useCreateAssistantSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload?: TCreateAssistantSessionDto) =>
			AssistantSessionService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) }),
		meta: { errorMessage: 'Failed to start a conversation' },
	});
};

export const useUpdateAssistantSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAssistantSessionDto }) =>
			AssistantSessionService.update(ws, id, body),
		onSuccess: (_session, { id }) => {
			qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) });
			qc.invalidateQueries({ queryKey: assistantKeys.session(ws, id) });
		},
		meta: { errorMessage: 'Failed to update the conversation' },
	});
};

export const useDeleteAssistantSession = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AssistantSessionService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) }),
		meta: { errorMessage: 'Failed to delete the conversation' },
	});
};

export const useSendAssistantMessage = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
			AssistantSessionService.send(ws, sessionId, content),
		onSuccess: (_result, { sessionId }) => {
			qc.invalidateQueries({ queryKey: assistantKeys.messages(ws, sessionId) });
			qc.invalidateQueries({ queryKey: assistantKeys.session(ws, sessionId) });
			qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) });
		},
		meta: { errorMessage: 'Failed to send your message' },
	});
};

export const useCancelAssistantTurn = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ sessionId, turnId }: { sessionId: string; turnId: string }) =>
			AssistantSessionService.cancel(ws, sessionId, turnId),
		onSuccess: (_turn, { sessionId }) =>
			qc.invalidateQueries({ queryKey: assistantKeys.session(ws, sessionId) }),
		meta: { errorMessage: 'Failed to stop' },
	});
};

export const useDecideAssistantActions = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			sessionId,
			turnId,
			decisions,
		}: {
			sessionId: string;
			turnId: string;
			decisions: TAssistantDecision[];
		}) => AssistantSessionService.decide(ws, sessionId, turnId, decisions),
		onSuccess: (_turn, { sessionId }) =>
			qc.invalidateQueries({ queryKey: assistantKeys.session(ws, sessionId) }),
		meta: { errorMessage: 'Failed to record your decision' },
	});
};

export const useAssistantMemories = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.memories(ws),
		queryFn: ({ signal }) => AssistantMemoryService.list(ws, signal),
		enabled: !!ws,
	});

export const useDeleteAssistantMemory = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AssistantMemoryService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.memories(ws) }),
		meta: { errorMessage: 'Failed to forget that' },
	});
};

export const useAssistantApps = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.apps(ws),
		queryFn: ({ signal }) => AssistantSettingsService.apps(ws, signal),
		enabled: !!ws,
	});

export const useAssistantToolRules = (ws: string, enabled = true) =>
	useQuery({
		queryKey: assistantKeys.toolRules(ws),
		queryFn: ({ signal }) => AssistantSettingsService.toolRules(ws, signal),
		enabled: !!ws && enabled,
	});

export const useUpdateAssistantToolRules = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (rules: TAssistantToolRuleUpdate[]) =>
			AssistantSettingsService.updateToolRules(ws, rules),
		onSuccess: (tools) => qc.setQueryData(assistantKeys.toolRules(ws), tools),
		meta: { errorMessage: 'Failed to update permissions' },
	});
};

export const useAssistantContext = (ws: string, id: string) =>
	useQuery({
		queryKey: assistantKeys.context(ws, id),
		queryFn: ({ signal }) => AssistantSessionService.context(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useTranscribeAudio = (ws: string) =>
	useMutation({
		mutationFn: (audio: Blob) => AssistantSettingsService.transcribe(ws, audio),
		meta: { errorMessage: 'Could not transcribe your recording' },
	});

export const useRateAssistantMessage = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			sessionId,
			messageId,
			rating,
			comment,
		}: {
			sessionId: string;
			messageId: string;
			rating: TAssistantFeedbackRating;
			comment?: string | null;
		}) => AssistantSessionService.feedback(ws, sessionId, messageId, rating, comment),
		onSuccess: (_feedback, { sessionId }) => {
			qc.invalidateQueries({ queryKey: assistantKeys.messages(ws, sessionId) });
			// A comment may update a style profile in the background.
			window.setTimeout(
				() => qc.invalidateQueries({ queryKey: assistantKeys.styles(ws) }),
				4000,
			);
		},
		meta: { errorMessage: 'Failed to save your feedback' },
	});
};

export const useAssistantStyles = (ws: string, enabled = true) =>
	useQuery({
		queryKey: assistantKeys.styles(ws),
		queryFn: ({ signal }) => AssistantSettingsService.styles(ws, signal),
		enabled: !!ws && enabled,
	});

export const useUpdateAssistantStyle = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ kind, notes }: { kind: TAssistantStyleKind; notes: string | null }) =>
			AssistantSettingsService.updateStyle(ws, kind, notes),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.styles(ws) }),
		meta: { errorMessage: 'Failed to save' },
	});
};

export const useRestoreAssistantStyle = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ kind, revisionId }: { kind: TAssistantStyleKind; revisionId: string }) =>
			AssistantSettingsService.restoreStyle(ws, kind, revisionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.styles(ws) }),
		meta: { errorMessage: 'Failed to restore' },
	});
};

export const useDailyReport = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.daily(ws),
		queryFn: ({ signal }) => AssistantBriefingService.daily(ws, signal),
		enabled: !!ws,
		// A report being written refreshes itself until it settles.
		refetchInterval: (query) =>
			query.state.data?.runs.some((run) =>
				['queued', 'collecting', 'writing'].includes(run.status),
			)
				? 3000
				: false,
		// Only while a report is being written, so it stays cheap.
		refetchIntervalInBackground: true,
	});

export const useBriefingRun = (ws: string, id: string | null) =>
	useQuery({
		queryKey: assistantKeys.briefingRun(ws, id ?? ''),
		queryFn: ({ signal }) => AssistantBriefingService.run(ws, id ?? '', signal),
		enabled: !!ws && !!id,
	});

const useDailyMutation = <TArgs>(
	ws: string,
	fn: (args: TArgs) => Promise<unknown>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.daily(ws) }),
		meta: { errorMessage },
	});
};

export const useUpdateDailyReport = (ws: string) =>
	useDailyMutation(
		ws,
		(payload: TUpdateBriefingConfigDto) => AssistantBriefingService.updateDaily(ws, payload),
		'Failed to save',
	);

export const usePauseDailyReport = (ws: string) =>
	useDailyMutation(
		ws,
		(paused: boolean) =>
			paused ? AssistantBriefingService.pause(ws) : AssistantBriefingService.resume(ws),
		'Failed to update',
	);

export const useRunDailyReportNow = (ws: string) =>
	useDailyMutation(ws, () => AssistantBriefingService.runNow(ws), 'Failed to start the report');

export const useSituations = (ws: string, status: TSituation['status'] = 'open') =>
	useQuery({
		queryKey: assistantKeys.situations(ws, status),
		queryFn: ({ signal }) => AssistantBriefingService.situations(ws, status, signal),
		enabled: !!ws,
	});

const useSituationMutation = <TArgs>(
	ws: string,
	fn: (args: TArgs) => Promise<TSituation>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['assistant', ws, 'situations'] });
			qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) });
		},
		meta: { errorMessage },
	});
};

export const useUpdateSituation = (ws: string) =>
	useSituationMutation(
		ws,
		({ id, status }: { id: string; status: TSituation['status'] }) =>
			AssistantBriefingService.updateSituation(ws, id, status),
		'Failed to update',
	);

export const useUpdateSituationStep = (ws: string) =>
	useSituationMutation(
		ws,
		({
			id,
			stepId,
			status,
		}: {
			id: string;
			stepId: string;
			status: TSituation['steps'][number]['status'];
		}) => AssistantBriefingService.updateStep(ws, id, stepId, status),
		'Failed to update',
	);

export const useSendSituation = (ws: string) =>
	useSituationMutation(
		ws,
		(id: string) => AssistantBriefingService.send(ws, id),
		'Failed to send',
	);

export const useMeetingPrep = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.meetingPrep(ws),
		queryFn: ({ signal }) => AssistantBriefingService.meetingPrep(ws, signal),
		enabled: !!ws,
	});

export const useUpdateMeetingPrep = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateBriefingConfigDto) =>
			AssistantBriefingService.updateMeetingPrep(ws, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: assistantKeys.meetingPrep(ws) });
			qc.invalidateQueries({ queryKey: assistantKeys.meetings(ws) });
		},
		meta: { errorMessage: 'Failed to save' },
	});
};

export const useMeetings = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.meetings(ws),
		queryFn: ({ signal }) => AssistantBriefingService.meetings(ws, signal),
		enabled: !!ws,
		// While a brief is being written, keep checking until it lands.
		refetchInterval: (query) =>
			query.state.data?.meetings.some((meeting) => meeting.prep_status === 'preparing')
				? 3000
				: false,
		refetchIntervalInBackground: true,
	});

export const usePrepareMeeting = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AssistantBriefingService.prepare(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.meetings(ws) }),
		meta: { errorMessage: 'Failed to start the brief' },
	});
};

export const useInbox = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.inbox(ws),
		queryFn: ({ signal }) => AssistantInboxService.show(ws, signal),
		enabled: !!ws,
		// New mail is checked every two minutes; follow along while it's on.
		refetchInterval: (query) => (query.state.data?.config.enabled ? 60_000 : false),
	});

const useInboxMutation = <TArgs>(
	ws: string,
	fn: (args: TArgs) => Promise<TInbox>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: (inbox) => qc.setQueryData(assistantKeys.inbox(ws), inbox),
		meta: { errorMessage },
	});
};

export const useToggleInbox = (ws: string) =>
	useInboxMutation(
		ws,
		(on: boolean | TInboxProvider) =>
			on === false
				? AssistantInboxService.disable(ws)
				: AssistantInboxService.enable(ws, on === true ? undefined : on),
		'Could not change Smart Inbox',
	);

export const useUpdateInboxSettings = (ws: string) =>
	useInboxMutation(
		ws,
		(payload: Partial<TInboxSettings>) => AssistantInboxService.update(ws, payload),
		'Failed to save',
	);

export const useCreateInboxLabel = (ws: string) =>
	useInboxMutation(
		ws,
		(payload: TSaveInboxLabelDto) => AssistantInboxService.createLabel(ws, payload),
		'Failed to add the label',
	);

export const useUpdateInboxLabel = (ws: string) =>
	useInboxMutation(
		ws,
		({ id, payload }: { id: string; payload: TSaveInboxLabelDto }) =>
			AssistantInboxService.updateLabel(ws, id, payload),
		'Failed to save the label',
	);

export const useDeleteInboxLabel = (ws: string) =>
	useInboxMutation(
		ws,
		(id: string) => AssistantInboxService.deleteLabel(ws, id),
		'Failed to delete the label',
	);

export const useAcceptInboxSuggestion = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AssistantInboxService.accept(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) }),
		meta: { errorMessage: 'Failed to open in chat' },
	});
};

export const useAssistantTriggers = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.triggers(ws),
		queryFn: ({ signal }) => AssistantTriggerService.list(ws, signal),
		enabled: !!ws,
	});

const useTriggerMutation = <TArgs, TResult>(
	ws: string,
	fn: (args: TArgs) => Promise<TResult>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: assistantKeys.triggers(ws) });
			qc.invalidateQueries({ queryKey: assistantKeys.sessions(ws) });
		},
		meta: { errorMessage },
	});
};

export const useCreateTrigger = (ws: string) =>
	useTriggerMutation(
		ws,
		(payload: TSaveTriggerDto) => AssistantTriggerService.create(ws, payload),
		'Failed to create the trigger',
	);

export const useUpdateTrigger = (ws: string) =>
	useTriggerMutation(
		ws,
		({ id, payload }: { id: string; payload: TSaveTriggerDto }) =>
			AssistantTriggerService.update(ws, id, payload),
		'Failed to update the trigger',
	);

export const useDeleteTrigger = (ws: string) =>
	useTriggerMutation(
		ws,
		(id: string) => AssistantTriggerService.remove(ws, id),
		'Failed to delete the trigger',
	);

export const useRunTriggerNow = (ws: string) =>
	useTriggerMutation(
		ws,
		(id: string) => AssistantTriggerService.runNow(ws, id),
		'Failed to run the trigger',
	);

export const useAssistantChannels = (ws: string) =>
	useQuery({
		queryKey: assistantKeys.channels(ws),
		queryFn: ({ signal }) => AssistantChannelService.list(ws, signal),
		enabled: !!ws,
	});

/** Sends the browser to Slack's "Add to Slack" screen. */
export const useInstallAssistantSlack = (ws: string) =>
	useMutation({
		mutationFn: () => AssistantChannelService.slackInstallUrl(ws),
		onSuccess: (url) => window.location.assign(url),
		meta: { errorMessage: 'Failed to start the Slack install' },
	});

const useChannelMutation = <TArgs>(
	ws: string,
	fn: (args: TArgs) => Promise<void>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.channels(ws) }),
		meta: { errorMessage },
	});
};

export const useStartSmsVerification = (ws: string) =>
	useChannelMutation(
		ws,
		(phone: string) => AssistantChannelService.smsStart(ws, phone),
		'Could not send the code',
	);

export const useConfirmSmsVerification = (ws: string) =>
	useChannelMutation(
		ws,
		(code: string) => AssistantChannelService.smsConfirm(ws, code),
		'That code did not work',
	);

export const useRemoveSmsNumber = (ws: string) =>
	useChannelMutation(
		ws,
		() => AssistantChannelService.smsRemove(ws),
		'Could not remove the number',
	);
