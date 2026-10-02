import { useEffect, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { EyeOff, Mail, Plus } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import BrandMark from '@/components/assistant/BrandMark';
import pages from '@/Routes/pages';
import { useAuth } from '@/context/auth';
import { useBrand } from '@/context/brand';
import { useConfirm } from '@/context/confirm';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useAssistant,
	useAssistantSessions,
	useCancelAssistantTurn,
	useCreateAssistantSession,
	useDecideAssistantActions,
	useDeleteAssistantSession,
	useSendAssistantMessage,
	useTranscribeAudio,
	useRateAssistantMessage,
} from '@/api/modules/assistant';
import { notify } from '@/api/core';
import type { TAssistantSession } from '@/types/assistant.type';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { OutletContextType } from './_layouts/Assistant.layout';
import SessionListPartial from './_partial/SessionList.partial';
import ComposerPartial from './_partial/Composer.partial';
import FeatureTabsPartial from './_partial/FeatureTabs.partial';
import MessageListPartial from './_partial/MessageList.partial';
import ContextMeterPartial from './_partial/ContextMeter.partial';
import ApprovalCardPartial from './_partial/ApprovalCard.partial';
import MemoriesPanelPartial from './_partial/MemoriesPanel.partial';
import AppsPanelPartial from './_partial/AppsPanel.partial';
import PermissionsModalPartial from './_partial/PermissionsModal.partial';
import PersonalizationModalPartial from './_partial/PersonalizationModal.partial';
import { useAssistantConversation } from './_hooks/useAssistantConversation.hook';

const SESSION_PARAM = 'session';

/**
 * The personal assistant's home: conversations on the left, the chat box and
 * background features in the middle. Its name, colour and icon all come from
 * the server brand (`useBrand`), never from this file.
 */
const AssistantHomePage = () => {
	const { t } = useTranslation();
	const brand = useBrand();
	const { userData } = useAuth();
	const { confirm } = useConfirm();
	const { setHeaderLeft } = useOutletContext<OutletContextType>();

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const currentWorkspaceId = workspaceId || activeWorkspaceId || '';

	const [searchParams, setSearchParams] = useSearchParams();
	const activeSessionId = searchParams.get(SESSION_PARAM);

	useDocumentTitle({ name: brand.name });

	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb list={[{ ...pages.workspace.subPages!.assistant, text: brand.name }]} />,
		);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [brand.name]);

	// Provisions the assistant on first visit.
	const { data: home } = useAssistant(currentWorkspaceId);
	const transcribe = useTranscribeAudio(currentWorkspaceId);
	const { data: sessions = [], isLoading: sessionsLoading } =
		useAssistantSessions(currentWorkspaceId);
	const createSession = useCreateAssistantSession(currentWorkspaceId);
	const deleteSession = useDeleteAssistantSession(currentWorkspaceId);
	const sendMessage = useSendAssistantMessage(currentWorkspaceId);
	const cancelTurn = useCancelAssistantTurn(currentWorkspaceId);
	const decide = useDecideAssistantActions(currentWorkspaceId);

	const [permissionsOpen, setPermissionsOpen] = useState(false);
	const [personalizationOpen, setPersonalizationOpen] = useState(false);
	const rate = useRateAssistantMessage(currentWorkspaceId);

	const conversation = useAssistantConversation(currentWorkspaceId, activeSessionId ?? '');
	const { activeTurn } = conversation;

	const selectSession = (id: string | null) => {
		setSearchParams(id ? { [SESSION_PARAM]: id } : {});
	};

	const startSession = (incognito: boolean) => {
		createSession.mutate({ incognito }, { onSuccess: (session) => selectSession(session.id) });
	};

	const send = (sessionId: string, content: string) => {
		sendMessage.mutate(
			{ sessionId, content },
			{
				onSuccess: (result) => {
					if (result.queued) notify.info(t('assistant.queuedNotice'));
				},
			},
		);
	};

	/** Sending from the home screen starts a new conversation first. */
	const handleSend = (content: string) => {
		if (activeSessionId) {
			send(activeSessionId, content);
			return;
		}
		createSession.mutate(
			{},
			{
				onSuccess: (session) => {
					selectSession(session.id);
					send(session.id, content);
				},
			},
		);
	};

	const handleStop = () => {
		if (!activeSessionId || !activeTurn) return;
		cancelTurn.mutate({ sessionId: activeSessionId, turnId: activeTurn.id });
	};

	const handleDecide = (toolCallId: string, approve: boolean) => {
		if (!activeSessionId || !activeTurn) return;
		decide.mutate({
			sessionId: activeSessionId,
			turnId: activeTurn.id,
			decisions: [{ tool_call_id: toolCallId, approve }],
		});
	};

	const handleDelete = async (session: TAssistantSession) => {
		const confirmed = await confirm({
			title: t('assistant.delete'),
			message: t('assistant.deleteConfirm'),
		});
		if (!confirmed) return;
		deleteSession.mutate(session.id, {
			onSuccess: () => {
				if (session.id === activeSessionId) selectSession(null);
			},
		});
	};

	return (
		<Container className='flex min-h-0 flex-1 gap-6'>
			<aside className='hidden w-64 shrink-0 flex-col gap-3 lg:flex'>
				<div className='flex gap-2'>
					<button
						type='button'
						onClick={() => startSession(false)}
						disabled={createSession.isPending}
						className='bg-assistant inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-60'>
						<Plus className='h-4 w-4' />
						{t('assistant.newChat')}
					</button>
					<button
						type='button'
						onClick={() => startSession(true)}
						disabled={createSession.isPending}
						title={t('assistant.incognitoHint')}
						aria-label={t('assistant.newIncognitoChat')}
						className='inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5'>
						<EyeOff className='h-4 w-4' />
					</button>
				</div>
				<p className='px-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
					{t('assistant.conversations')}
				</p>
				<SessionListPartial
					sessions={sessions}
					activeId={activeSessionId}
					onSelect={selectSession}
					onDelete={handleDelete}
					isLoading={sessionsLoading}
				/>
				<div className='mt-auto border-t border-zinc-200 pt-3 dark:border-white/10'>
					<MemoriesPanelPartial workspaceId={currentWorkspaceId} />
				</div>
			</aside>

			<section className='mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 py-6'>
				{activeSessionId ? (
					<>
						<ContextMeterPartial
							workspaceId={currentWorkspaceId}
							sessionId={activeSessionId}
						/>
						<MessageListPartial
							messages={conversation.messages}
							isWorking={conversation.isWorking}
							draft={conversation.draft}
							tools={conversation.tools}
							isLoading={conversation.isLoading}
							onRate={(messageId, rating, comment) =>
								activeSessionId &&
								rate.mutate({
									sessionId: activeSessionId,
									messageId,
									rating,
									comment,
								})
							}
						/>
						{activeTurn?.status === 'awaiting_approval' && (
							<ApprovalCardPartial
								actions={activeTurn.actions ?? []}
								onDecide={handleDecide}
								isDeciding={decide.isPending}
							/>
						)}
						{activeTurn === null && conversation.lastError && (
							<p className='text-center text-xs text-red-500'>
								{conversation.lastError}
							</p>
						)}
						{conversation.queuedCount > 0 && (
							<p className='text-center text-xs text-zinc-500'>
								{t('assistant.queuedCount', { count: conversation.queuedCount })}
							</p>
						)}
					</>
				) : (
					<div className='flex flex-col items-center gap-3 pt-10 text-center'>
						<BrandMark size='lg' />
						<h1 className='text-2xl font-semibold text-zinc-900 dark:text-white'>
							{t('assistant.greeting', { userName: userData?.firstName ?? '' })}
						</h1>
						<p className='text-zinc-500'>{t('assistant.tagline')}</p>
					</div>
				)}

				<ComposerPartial
					onSend={handleSend}
					onStop={handleStop}
					isWorking={conversation.isWorking}
					isSending={sendMessage.isPending || createSession.isPending}
					onTranscribe={
						home?.features.voice ? (audio) => transcribe.mutateAsync(audio) : undefined
					}
				/>

				{!activeSessionId && <FeatureTabsPartial />}

				{brand.email && (
					<a
						href={`mailto:${brand.email}`}
						className='inline-flex items-center gap-2 self-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
						<Mail className='h-4 w-4' />
						{t('assistant.emailLabel')}: {brand.email}
					</a>
				)}
			</section>

			<aside className='hidden w-64 shrink-0 flex-col gap-6 py-2 xl:flex'>
				<button
					type='button'
					onClick={() => setPersonalizationOpen(true)}
					className='rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5'>
					{t('assistant.personalization')}
				</button>
				<AppsPanelPartial
					workspaceId={currentWorkspaceId}
					onOpenPermissions={() => setPermissionsOpen(true)}
				/>
			</aside>

			<PersonalizationModalPartial
				workspaceId={currentWorkspaceId}
				isOpen={personalizationOpen}
				onClose={() => setPersonalizationOpen(false)}
			/>

			<PermissionsModalPartial
				workspaceId={currentWorkspaceId}
				isOpen={permissionsOpen}
				onClose={() => setPermissionsOpen(false)}
			/>
		</Container>
	);
};

export default AssistantHomePage;
