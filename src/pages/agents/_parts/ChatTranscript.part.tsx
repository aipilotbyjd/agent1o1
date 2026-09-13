import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/common/EmptyState';
import { formatRelative } from '@/utils/format.util';
import type { TAgentMessage, TAgentMessageRole } from '@/types/agent.type';

// ============================================================
// Chat Transcript
// ------------------------------------------------------------
// The persisted messages plus whatever the current turn has
// streamed so far. The in-flight pair is passed in separately
// rather than being pushed into the transcript: it isn't saved
// yet, and once the turn ends the refetched transcript is the
// version that should win.
//
// `content` is typed `unknown` (the column is longText and the
// resource passes it through untouched), so anything that isn't a
// string is shown as JSON rather than rendered as `[object Object]`.
// ============================================================

const renderContent = (content: unknown): string => {
	if (typeof content === 'string') return content;
	if (content === null || content === undefined) return '';
	try {
		return JSON.stringify(content, null, 2);
	} catch {
		return String(content);
	}
};

const ROLE_STYLES: Record<TAgentMessageRole, { label: string; className: string }> = {
	user: { label: 'You', className: 'bg-primary-500/15' },
	assistant: { label: 'Agent', className: 'bg-zinc-500/10' },
	tool: { label: 'Tool', className: 'bg-violet-500/10' },
	system: { label: 'System', className: 'bg-amber-500/10' },
};

interface IBubbleProps {
	role: TAgentMessageRole;
	content: unknown;
	timestamp?: string | null;
	isStreaming?: boolean;
}

const Bubble: FC<IBubbleProps> = ({ role, content, timestamp, isStreaming }) => {
	const style = ROLE_STYLES[role] ?? ROLE_STYLES.assistant;
	const isUser = role === 'user';

	return (
		<div className={classNames('flex gap-3', { 'flex-row-reverse': isUser })}>
			<span
				className={classNames(
					'flex size-8 shrink-0 items-center justify-center rounded-lg',
					style.className,
				)}>
				<Icon icon={isUser ? 'User' : role === 'tool' ? 'Wrench01' : 'Bot'} />
			</span>
			<div className={classNames('max-w-[80ch] min-w-0', { 'text-end': isUser })}>
				<div className='mb-1 flex items-center gap-2 text-xs text-zinc-500'>
					<span>{style.label}</span>
					{timestamp && <span>· {formatRelative(timestamp)}</span>}
				</div>
				<div
					className={classNames(
						'inline-block rounded-2xl px-3 py-2 text-start whitespace-pre-wrap',
						style.className,
					)}>
					{renderContent(content)}
					{isStreaming && (
						<span className='ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-zinc-500 align-text-bottom' />
					)}
				</div>
			</div>
		</div>
	);
};

interface IChatTranscriptProps {
	messages?: TAgentMessage[];
	isLoading?: boolean;
	/** The user's message for the turn in flight — not yet persisted. */
	pendingUserMessage?: string | null;
	/** Concatenated `delta` events for the turn in flight. */
	streamedText?: string;
	isStreaming?: boolean;
	toolCalls?: { id: string; name: string }[];
	errorMessage?: string | null;
}

const ChatTranscriptPart: FC<IChatTranscriptProps> = ({
	messages,
	isLoading = false,
	pendingUserMessage,
	streamedText = '',
	isStreaming = false,
	toolCalls = [],
	errorMessage,
}) => {
	const bottomRef = useRef<HTMLDivElement | null>(null);

	// Follow the newest content, including every streamed chunk — a reply
	// that grows off the bottom of the viewport is unreadable.
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [messages, streamedText, pendingUserMessage]);

	const isEmpty = !isLoading && !messages?.length && !pendingUserMessage;

	return (
		<div className='flex flex-col gap-5'>
			{isLoading && (
				<>
					<Skeleton className='h-16 w-2/3' />
					<Skeleton className='ml-auto h-16 w-1/2' />
				</>
			)}

			{isEmpty && (
				<EmptyState
					icon='Message02'
					title='Say something to start'
					description='Messages in this session are kept, so you can come back to the thread later.'
				/>
			)}

			{messages?.map((message) => (
				<Bubble
					key={message.id}
					role={message.role}
					content={message.content}
					timestamp={message.created_at}
				/>
			))}

			{pendingUserMessage && <Bubble role='user' content={pendingUserMessage} />}

			{toolCalls.length > 0 && (
				<div className='flex flex-wrap items-center gap-2 text-xs text-zinc-500'>
					<Icon icon='Wrench01' />
					{toolCalls.map((call) => (
						<span
							key={call.id}
							className='rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-500'>
							{call.name}
						</span>
					))}
				</div>
			)}

			{(isStreaming || streamedText) && (
				<Bubble role='assistant' content={streamedText} isStreaming={isStreaming} />
			)}

			{errorMessage && (
				<Alert color='red' variant='soft'>
					{errorMessage}
				</Alert>
			)}

			<div ref={bottomRef} />
		</div>
	);
};

export default ChatTranscriptPart;
