import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { isToday, isYesterday } from 'date-fns';
import { ArrowRight, Bell, CheckCheck, Settings, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import {
	useDeleteNotification,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
	useUnreadNotificationCount,
} from '@/api/modules/notifications';
import { useWorkspaceContext } from '@/context/workspace';
import paths from '@/Routes/paths';
import relativeTime from '@/utils/relativeTime.util';
import type { TNotification } from '@/types/notification.type';
import { TONE_CLASSES, notificationHref, notificationMeta } from './notificationMeta';

type TTab = 'all' | 'unread';

const isUnread = (n: TNotification) => !n.read_at;

const dayGroup = (iso: string): string => {
	const date = new Date(iso);
	if (isToday(date)) return 'Today';
	if (isYesterday(date)) return 'Yesterday';
	return 'Earlier';
};

const NotificationRow = ({
	notification,
	workspaceName,
	onOpen,
	onMarkRead,
	onDelete,
}: {
	notification: TNotification;
	workspaceName: string | null;
	onOpen: (notification: TNotification) => void;
	onMarkRead: (id: string) => void;
	onDelete: (id: string) => void;
}) => {
	const unread = isUnread(notification);
	const meta = notificationMeta(notification.type);
	const Icon = meta.icon;
	const hasTarget = notificationHref(notification) !== null;

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
				</p>
				{notification.body && (
					<p className='mt-1 line-clamp-2 text-[12px] leading-[17px] text-zinc-500 dark:text-zinc-400'>
						{notification.body}
					</p>
				)}
				<div className='mt-2 flex items-center gap-1.5 text-[11px] leading-4 whitespace-nowrap text-zinc-400 dark:text-zinc-500'>
					<span title={new Date(notification.created_at).toLocaleString()}>
						{relativeTime(notification.created_at) ?? ''}
					</span>
					{workspaceName && (
						<>
							<span aria-hidden>·</span>
							<span className='min-w-0 truncate'>{workspaceName}</span>
						</>
					)}
					{hasTarget && meta.action && (
						<span className='text-primary-600 dark:text-primary-400 ml-auto inline-flex shrink-0 items-center gap-0.5 pl-2 font-semibold opacity-0 transition-opacity group-hover/item:opacity-100'>
							{meta.action}
							<ArrowRight size={11} />
						</span>
					)}
				</div>
			</button>

			<div className='absolute top-3 right-3 flex items-center gap-0.5'>
				<button
					type='button'
					aria-label='Delete notification'
					title='Delete'
					onClick={() => onDelete(notification.id)}
					className='invisible flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition group-hover/item:visible hover:bg-zinc-500/15 hover:text-rose-500'>
					<Trash2 size={13} />
				</button>
				{unread && (
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

const NotificationsDropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [tab, setTab] = useState<TTab>('all');
	const navigate = useNavigate();
	const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceContext();

	const { data: unreadData } = useUnreadNotificationCount();
	const { data, isLoading } = useNotifications(tab === 'unread' ? { unread: true } : undefined);

	const markRead = useMarkNotificationRead();
	const markAllRead = useMarkAllNotificationsRead();
	const deleteNotification = useDeleteNotification();

	const unreadCount = unreadData?.unread ?? 0;
	const notifications = useMemo(() => data ?? [], [data]);

	// Only worth naming the workspace when there's more than one it could be.
	const workspaceNames = useMemo(
		() =>
			workspaces.length > 1
				? new Map(workspaces.map((workspace) => [workspace.id, workspace.name]))
				: null,
		[workspaces],
	);

	const groups = useMemo(() => {
		const byDay = new Map<string, TNotification[]>();
		notifications.forEach((notification) => {
			const day = dayGroup(notification.created_at);
			byDay.set(day, [...(byDay.get(day) ?? []), notification]);
		});
		return Array.from(byDay.entries());
	}, [notifications]);

	const openNotification = async (notification: TNotification) => {
		if (isUnread(notification)) markRead.mutate(notification.id);

		const href = notificationHref(notification);
		if (!href) return;

		setIsOpen(false);
		if (notification.workspace_id && notification.workspace_id !== activeWorkspaceId) {
			await switchWorkspace(notification.workspace_id);
		}
		navigate(href);
	};

	const settingsWorkspaceId = activeWorkspaceId || workspaces[0]?.id;

	const tabClass = (active: boolean) =>
		`rounded-lg px-3 py-1 text-[12px] leading-4 font-bold transition ${
			active
				? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
				: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
		}`;

	const bellButton = (
		<Button
			aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
			icon='Notification03'
			variant='link'
			className='!text-primary-400 hover:!text-primary-500 dark:!text-primary-400 dark:hover:!text-primary-300 !p-0'
		/>
	);

	return (
		<Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
			<DropdownToggle hasIcon={false}>
				<div className='relative flex items-center'>
					{isOpen ? (
						bellButton
					) : (
						<Tooltip text='View notifications'>{bellButton}</Tooltip>
					)}
					{unreadCount > 0 && (
						<span className='bg-primary-400 text-primary-950 pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold'>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</div>
			</DropdownToggle>

			<DropdownMenu
				placement='bottom-end'
				className='w-[400px] max-w-[calc(100vw_-_24px)] !gap-0 overflow-hidden !p-0'>
				<div className='flex items-center justify-between gap-2 px-4 pt-4 pb-3'>
					<div className='flex items-center gap-2'>
						<h3 className='text-[15px] font-black text-zinc-900 dark:text-white'>
							Notifications
						</h3>
						{unreadCount > 0 && (
							<span className='bg-primary-400 text-primary-950 rounded-full px-2 py-0.5 text-[11px] leading-4 font-black'>
								{unreadCount > 99 ? '99+' : unreadCount} new
							</span>
						)}
					</div>
					<div className='flex items-center gap-0.5'>
						<Tooltip text='Mark all as read'>
							<button
								type='button'
								aria-label='Mark all as read'
								onClick={() => markAllRead.mutate()}
								disabled={markAllRead.isPending || unreadCount === 0}
								className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-500/10 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white'>
								<CheckCheck size={16} />
							</button>
						</Tooltip>
						{settingsWorkspaceId && (
							<Tooltip text='Notification settings'>
								<button
									type='button'
									aria-label='Notification settings'
									onClick={() => {
										setIsOpen(false);
										navigate(paths.notificationSettings(settingsWorkspaceId));
									}}
									className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-500/10 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'>
									<Settings size={16} />
								</button>
							</Tooltip>
						)}
					</div>
				</div>

				<div className='px-4 pb-3'>
					<div className='inline-flex rounded-xl bg-zinc-500/10 p-1'>
						<button
							type='button'
							className={tabClass(tab === 'all')}
							onClick={() => setTab('all')}>
							All
						</button>
						<button
							type='button'
							className={tabClass(tab === 'unread')}
							onClick={() => setTab('unread')}>
							Unread{unreadCount > 0 ? ` · ${unreadCount}` : ''}
						</button>
					</div>
				</div>

				<div className='max-h-[min(460px,70vh)] space-y-1 overflow-y-auto border-t border-zinc-500/10 px-2 pt-1 pb-2'>
					{isLoading ? (
						<div className='space-y-2 p-2'>
							{[...Array(4)].map((_, i) => (
								<div
									key={i}
									className='h-16 animate-pulse rounded-xl bg-zinc-500/10'
								/>
							))}
						</div>
					) : notifications.length > 0 ? (
						groups.map(([day, items]) => (
							<section key={day}>
								<h4 className='sticky top-0 z-10 bg-white/95 px-3 pt-3 pb-1.5 text-[11px] font-black tracking-wider text-zinc-400 uppercase backdrop-blur dark:bg-zinc-900/95 dark:text-zinc-500'>
									{day}
								</h4>
								<div className='space-y-1'>
									{items.map((notification) => (
										<NotificationRow
											key={notification.id}
											notification={notification}
											workspaceName={
												(notification.workspace_id &&
													workspaceNames?.get(
														notification.workspace_id,
													)) ||
												null
											}
											onOpen={(n) => void openNotification(n)}
											onMarkRead={(id) => markRead.mutate(id)}
											onDelete={(id) => deleteNotification.mutate(id)}
										/>
									))}
								</div>
							</section>
						))
					) : (
						<div className='flex flex-col items-center justify-center gap-2 px-4 py-14 text-center'>
							<span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10'>
								<Bell size={22} className='text-zinc-400' />
							</span>
							<p className='text-[14px] font-bold text-zinc-700 dark:text-zinc-200'>
								{tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
							</p>
							<p className='max-w-[260px] text-[12px] leading-[17px] text-zinc-400 dark:text-zinc-500'>
								{tab === 'unread'
									? 'New alerts about runs, agents and billing will show up here.'
									: 'Failed runs, agent reviews, billing and team changes will show up here.'}
							</p>
						</div>
					)}
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default NotificationsDropdown;
