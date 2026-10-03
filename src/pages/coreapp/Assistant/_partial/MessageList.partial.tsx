import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wrench } from 'lucide-react';
import AssistantMarkdown from '@/components/assistant/AssistantMarkdown';
import BrandMark from '@/components/assistant/BrandMark';
import type { TAssistantFeedbackRating, TAssistantMessage } from '@/types/assistant.type';
import MessageFeedbackPartial from './MessageFeedback.partial';
import MessageFilesPartial from './MessageFiles.partial';
import CodeRunsPartial from './CodeRuns.partial';
import type { TToolActivity } from '../_hooks/useAssistantConversation.hook';

interface IMessageListProps {
	messages: TAssistantMessage[];
	isWorking: boolean;
	draft: string;
	tools: TToolActivity[];
	isLoading?: boolean;
	workspaceId?: string;
	onRate?: (messageId: string, rating: TAssistantFeedbackRating, comment?: string) => void;
}

const MessageListPartial = ({
	messages,
	isWorking,
	draft,
	tools,
	isLoading = false,
	workspaceId,
	onRate,
}: IMessageListProps) => {
	const { t } = useTranslation();

	if (isLoading) return null;

	if (messages.length === 0 && !isWorking) {
		return (
			<p className='py-10 text-center text-sm text-zinc-500'>
				{t('assistant.emptyMessages')}
			</p>
		);
	}

	const running = tools.filter((activity) => activity.phase === 'started');

	return (
		<div className='flex flex-col gap-4'>
			{messages.map((message, index) => (
				<Fragment key={message.id}>
					{message.compacted === false && messages[index - 1]?.compacted === true && (
						<p className='flex items-center gap-3 text-[11px] text-zinc-400'>
							<span className='h-px flex-1 bg-zinc-200 dark:bg-white/10' />
							{t('assistant.summarizedAbove')}
							<span className='h-px flex-1 bg-zinc-200 dark:bg-white/10' />
						</p>
					)}
					{message.role === 'user' ? (
						<div className='bg-assistant max-w-[80%] self-end rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap text-white'>
							{message.content}
						</div>
					) : (
						<div className='flex max-w-[90%] gap-3 self-start'>
							<BrandMark size='sm' className='mt-1' />
							<div className='min-w-0 text-sm text-zinc-800 dark:text-zinc-100'>
								{message.tool_calls.length > 0 && (
									<p className='mb-1 flex items-center gap-1 text-xs text-zinc-400'>
										<Wrench className='h-3 w-3' />
										{t('assistant.usedTools', {
											tools: [
												...new Set(
													message.tool_calls.map((call) => call.name),
												),
											].join(', '),
										})}
									</p>
								)}
								{message.code_runs && message.code_runs.length > 0 && (
									<CodeRunsPartial runs={message.code_runs} />
								)}
								{message.content && <AssistantMarkdown text={message.content} />}
								{workspaceId && message.files && message.files.length > 0 && (
									<MessageFilesPartial
										workspaceId={workspaceId}
										files={message.files}
									/>
								)}
								{onRate && message.content && (
									<MessageFeedbackPartial
										feedback={message.feedback}
										onRate={(rating, comment) =>
											onRate(message.id, rating, comment)
										}
									/>
								)}
							</div>
						</div>
					)}
				</Fragment>
			))}

			{isWorking && (
				<div className='flex max-w-[90%] gap-3 self-start'>
					<BrandMark size='sm' className='mt-1' />
					<div className='min-w-0 text-sm text-zinc-800 dark:text-zinc-100'>
						{draft && <AssistantMarkdown text={draft} />}
						<p className='flex items-center gap-2 text-xs text-zinc-400'>
							<Loader2 className='h-3 w-3 animate-spin' />
							{running.length > 0
								? t('assistant.usingTool', {
										tool: running[running.length - 1].tool,
									})
								: t('assistant.thinking')}
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default MessageListPartial;
