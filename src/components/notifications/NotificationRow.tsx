import { Archive, ArchiveRestore, ArrowRight, ExternalLink } from 'lucide-react';
import relativeTime from '@/utils/relativeTime.util';
import type { TNotification } from '@/types/notification.type';
import {
	ADMIN_MESSAGE_SENDER,
	TONE_CLASSES,
	isAdminMessage,
	isUnread,
	notificationMeta,
	notificationTarget,
} from './notificationMeta';

type TProps = {
	notification: TNotification;
	workspaceName: string | null;
	activeWorkspaceId: string | null;
	onOpen: (notification: TNotification) => void;
	onMarkRead: (id: string) => void;
	onArchive: (id: string) => void;
	onUnarchive?: (id: string) => void;
};

/**
 * One notification, in the bell and on the inbox page. A grouped one shows
 * how many times it happened.
 */
const NotificationRow = ({
	notification,
	workspaceName,
	activeWorkspaceId,
	onOpen,
	onMarkRead,
	onArchive,
	onUnarchive,
}: TProps) => {
	const unread = isUnread(notification);
	const archived = notification.archived_at !== null;
	const meta = notificationMeta(notification);
	const Icon = meta.icon;
	const target = notificationTarget(notification, activeWorkspaceId);
	const source = isAdminMessage(notification) ? ADMIN_MESSAGE_SENDER : workspaceName;
	const when = notification.occurred_at ?? notification.created_at;

	// Sizes are in px: the app's root font is 12px, so rem-based text classes
	// come out a size smaller than they read.
	return (
		<div className='group/item relative flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-zinc-500/[0.07]'>
			<span
				className={`mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[meta.tone]}`}>
				<Icon size={15} />
			</span>

			<button
				type='button'
				onClick={() => onOpen(notification)}
				className='min-w-0 flex-1 text-left'>
				<p
					className={`line-clamp-2 pr-12 text-[13px] leading-[18px] ${
						unread
							? 'font-bold text-zinc-900 dark:text-zinc-50'
							: 'font-semibold text-zinc-600 dark:text-zinc-300'
					}`}>
					{notification.title}
					{notification.group_count > 1 && (
						<span
							className='ml-1.5 inline-flex rounded-full bg-zinc-500/15 px-1.5 align-middle text-[11px] leading-4 font-bold text-zinc-600 dark:text-zinc-300'
							title={`Happened ${notification.group_count} times`}>
							×{notification.group_count}
						</span>
					)}
				</p>
				{notification.body && (
					<p className='mt-1 line-clamp-2 text-[12px] leading-[17px] whitespace-pre-line text-zinc-500 dark:text-zinc-400'>
						{notification.body}
					</p>
				)}
				<div className='mt-2 flex items-center gap-1.5 text-[11px] leading-4 whitespace-nowrap text-zinc-400 dark:text-zinc-500'>
					<span title={new Date(when).toLocaleString()}>{relativeTime(when) ?? ''}</span>
					{source && (
						<>
							<span aria-hidden>·</span>
							<span className='min-w-0 truncate'>{source}</span>
						</>
					)}
					{target && meta.action && (
						<span
							className={`text-primary-600 dark:text-primary-400 ml-auto inline-flex shrink-0 items-center gap-0.5 pl-2 font-semibold transition-opacity ${
								isAdminMessage(notification) || notification.needs_action
									? ''
									: 'opacity-0 group-hover/item:opacity-100'
							}`}>
							{meta.action}
							{target.external ? (
								<ExternalLink size={11} />
							) : (
								<ArrowRight size={11} />
							)}
						</span>
					)}
				</div>
			</button>

			<div className='absolute top-3 right-3 flex items-center gap-0.5'>
				{archived && onUnarchive ? (
					<button
						type='button'
						aria-label='Move back to inbox'
						title='Move back to inbox'
						onClick={() => onUnarchive(notification.id)}
						className='flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-500/15 hover:text-zinc-700 dark:hover:text-zinc-200'>
						<ArchiveRestore size={13} />
					</button>
				) : (
					<button
						type='button'
						aria-label='Archive notification'
						title='Archive'
						onClick={() => onArchive(notification.id)}
						className='invisible flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition group-hover/item:visible hover:bg-zinc-500/15 hover:text-zinc-700 focus-visible:visible dark:hover:text-zinc-200'>
						<Archive size={13} />
					</button>
				)}
				{unread && !archived && (
					<button
						type='button'
						aria-label='Mark as read'
						title='Mark as read'
						onClick={() => onMarkRead(notification.id)}
						className='flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-500/15'>
						<span className='bg-primary-400 size-2 rounded-full' />
					</button>
				)}
			</div>
		</div>
	);
};

export default NotificationRow;
