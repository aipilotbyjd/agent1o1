import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
	useAgentSessions,
	useAgentSession,
	useCreateAgentSession,
	useDeleteAgentSession,
	useStreamAgentMessage,
} from '@/api/modules/agents';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatRelative } from '@/utils/format.util';
import ChatTranscriptPart from './ChatTranscript.part';
import type { TAgentSession } from '@/types/agent.type';

// ============================================================
// Chat Panel
// ------------------------------------------------------------
// The playground: pick a session on the left, talk to the agent on
// the right. Turns stream over SSE, so the reply appears as it is
// generated rather than after the whole thing lands.
//
// The in-flight pair (the user's message and the streaming reply)
// is held in local state and rendered on top of the persisted
// transcript, then dropped once the transcript comes back longer
// than it was before the turn. Comparing lengths rather than just
// clearing on `done` avoids the flicker where the turn disappears
// in the gap before the refetch arrives.
// ============================================================

interface IChatPanelProps {
	ws: string;
	agentId: string;
}

const ChatPanelPart: FC<IChatPanelProps> = ({ ws, agentId }) => {
	const { data: sessions, isLoading: isSessionsLoading } = useAgentSessions(ws, agentId);
	const createSession = useCreateAgentSession(ws, agentId);
	const deleteSession = useDeleteAgentSession(ws, agentId);

	const [sessionId, setSessionId] = useState('');
	const [input, setInput] = useState('');
	const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<TAgentSession | null>(null);

	// The message count before the current turn started, so the optimistic
	// pair can be dropped the moment the saved transcript overtakes it.
	const countBeforeTurn = useRef(0);

	const { data: session, isLoading: isSessionLoading } = useAgentSession(ws, agentId, sessionId);
	const { send, cancel, events, isStreaming } = useStreamAgentMessage(ws, agentId, sessionId);

	// Land on the most recent session so the panel opens on something.
	useEffect(() => {
		if (sessionId || !sessions?.length) return;
		setSessionId(sessions[0].id);
	}, [sessions, sessionId]);

	const messages = session?.messages;

	useEffect(() => {
		if (!pendingUserMessage) return;
		if ((messages?.length ?? 0) > countBeforeTurn.current) setPendingUserMessage(null);
	}, [messages, pendingUserMessage]);

	const { streamedText, toolCalls, errorMessage } = useMemo(() => {
		let text = '';
		const calls: { id: string; name: string }[] = [];
		let error: string | null = null;

		for (const event of events) {
			if (event.event === 'delta') text += event.delta;
			if (event.event === 'tool-call') calls.push({ id: event.id, name: event.name });
			if (event.event === 'error') error = event.message;
		}

		return { streamedText: text, toolCalls: calls, errorMessage: error };
	}, [events]);

	const startSession = async () => {
		const created = await createSession.mutateAsync(undefined);
		setSessionId(created.id);
	};

	const onSend = async () => {
		const text = input.trim();
		if (!text || !sessionId || isStreaming) return;

		countBeforeTurn.current = messages?.length ?? 0;
		setPendingUserMessage(text);
		setInput('');
		await send({ message: text });
	};

	return (
		<>
			<div className='grid grid-cols-12 gap-4'>
				{/* ─── Sessions ────────────────────────────────── */}
				<div className='col-span-12 xl:col-span-3'>
					<Card className='h-full'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Sessions</CardTitle>
							</CardHeaderChild>
							<CardHeaderChild>
								<Button
									variant='outline'
									color='zinc'
									dimension='sm'
									icon='PlusSignCircle'
									aria-label='New session'
									isLoading={createSession.isPending}
									onClick={() => void startSession()}
								/>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='flex max-h-[70vh] flex-col gap-1 overflow-y-auto'>
							{isSessionsLoading && (
								<>
									<Skeleton className='h-12 w-full' />
									<Skeleton className='h-12 w-full' />
								</>
							)}

							{!isSessionsLoading && !sessions?.length && (
								<EmptyState
									icon='Message02'
									title='No sessions'
									description='Start one to begin a conversation.'
								/>
							)}

							{sessions?.map((item) => (
								<div
									key={item.id}
									className={`group/session flex items-center gap-1 rounded-xl px-2 ${
										item.id === sessionId
											? 'bg-zinc-500/15'
											: 'hover:bg-zinc-500/5'
									}`}>
									<button
										type='button'
										className='min-w-0 grow cursor-pointer py-2 text-start'
										onClick={() => {
											setSessionId(item.id);
											setPendingUserMessage(null);
										}}>
										<div className='truncate text-sm font-medium'>
											{item.title || 'Untitled session'}
										</div>
										<div className='truncate text-xs text-zinc-500'>
											{formatRelative(item.last_activity_at ?? item.created_at)}
										</div>
									</button>
									<button
										type='button'
										aria-label={`Delete ${item.title || 'session'}`}
										className='invisible shrink-0 cursor-pointer p-1 text-zinc-500 group-hover/session:visible'
										onClick={() => setPendingDelete(item)}>
										<Icon icon='Delete02' />
									</button>
								</div>
							))}
						</CardBody>
					</Card>
				</div>

				{/* ─── Conversation ────────────────────────────── */}
				<div className='col-span-12 xl:col-span-9'>
					<Card className='flex h-full flex-col'>
						<CardBody className='max-h-[60vh] grow overflow-y-auto'>
							{!sessionId && !isSessionsLoading && (
								<EmptyState
									icon='Message02'
									title='No session selected'
									description='Start a new session to talk to this agent.'
									action={
										<Button
											variant='solid'
											isLoading={createSession.isPending}
											onClick={() => void startSession()}>
											New session
										</Button>
									}
								/>
							)}

							{!!sessionId && (
								<ChatTranscriptPart
									messages={messages}
									isLoading={isSessionLoading && !messages}
									pendingUserMessage={pendingUserMessage}
									streamedText={streamedText}
									isStreaming={isStreaming}
									toolCalls={toolCalls}
									errorMessage={errorMessage}
								/>
							)}
						</CardBody>

						{!!sessionId && (
							<div className='border-t border-zinc-500/15 p-4'>
								<div className='flex items-end gap-2'>
									<Textarea
										name='chat-input'
										rows={2}
										value={input}
										placeholder='Message the agent — Enter to send, Shift+Enter for a new line'
										onChange={(event) => setInput(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === 'Enter' && !event.shiftKey) {
												event.preventDefault();
												void onSend();
											}
										}}
									/>
									{isStreaming ? (
										<Button
											variant='outline'
											color='red'
											icon='StopCircle'
											onClick={cancel}>
											Stop
										</Button>
									) : (
										<Button
											variant='solid'
											icon='Sent'
											isDisable={!input.trim()}
											onClick={() => void onSend()}>
											Send
										</Button>
									)}
								</div>
							</div>
						)}
					</Card>
				</div>
			</div>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Delete ${pendingDelete?.title || 'this session'}?`}
				description='The whole transcript goes with it. This cannot be undone.'
				isPending={deleteSession.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteSession.mutate(pendingDelete.id, {
						onSuccess: () => {
							// Selecting a deleted session would render a 404 pane;
							// fall back to whatever the list settles on.
							if (pendingDelete.id === sessionId) setSessionId('');
							setPendingDelete(null);
						},
					});
				}}
			/>
		</>
	);
};

export default ChatPanelPart;
