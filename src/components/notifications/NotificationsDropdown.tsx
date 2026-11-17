import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Bell, CheckCheck, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import {
	useArchiveNotifications,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotificationSummary,
	useNotifications,
} from '@/api/modules/notifications';
import { useWorkspaceContext } from '@/context/workspace';
import paths from '@/Routes/paths';
import type { TNotificationListParams } from '@/types/notification.type';
import NotificationRow from './NotificationRow';
import { groupByDay, useOpenNotification, useWorkspaceNames } from './useOpenNotification';

type TTab = 'all' | 'needs_action' | 'unread';

const TAB_PARAMS: Record<TTab, TNotificationListParams> = {
	all: { per_page: 20 },
	needs_action: { needs_action: true, per_page: 20 },
	unread: { status: 'unread', per_page: 20 },
};

const NotificationsDropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [tab, setTab] = useState<TTab>('all');
	const navigate = useNavigate();
	const { workspaces, activeWorkspaceId } = useWorkspaceContext();

	const { data: summary } = useNotificationSummary();
	const { data, isLoading } = useNotifications(TAB_PARAMS[tab]);

	const markRead = useMarkNotificationRead();
	const markAllRead = useMarkAllNotificationsRead();
	const archive = useArchiveNotifications();
	const close = useCallback(() => setIsOpen(false), []);
	const openNotification = useOpenNotification(close);
	const workspaceNames = useWorkspaceNames();

	const unreadCount = summary?.unread ?? 0;
	const needsActionCount = summary?.needs_action ?? 0;
	const notifications = useMemo(() => data?.pages[0]?.items ?? [], [data]);
	const hasMore = (data?.pages[0]?.meta.total ?? 0) > notifications.length;
	const groups = useMemo(() => groupByDay(notifications), [notifications]);

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

	const emptyCopy: Record<TTab, [string, string]> = {
		all: [
			'No notifications yet',
			'Alerts about your runs, agents, billing and team, and news from us, will show up here.',
		],
		needs_action: ['Nothing needs you', 'Approvals and problems to fix will show up here.'],
		unread: ["You're all caught up", 'New alerts and messages will show up here.'],
	};

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
						<span
							className={`pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
								needsActionCount > 0
									? 'bg-rose-500 text-white'
									: 'bg-primary-400 text-primary-950'
							}`}>
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
										close();
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
					<div role='tablist' className='inline-flex rounded-xl bg-zinc-500/10 p-1'>
						<button
							type='button'
							role='tab'
							aria-selected={tab === 'all'}
							className={tabClass(tab === 'all')}
							onClick={() => setTab('all')}>
							All
						</button>
						<button
							type='button'
							role='tab'
							aria-selected={tab === 'needs_action'}
							className={tabClass(tab === 'needs_action')}
							onClick={() => setTab('needs_action')}>
							Needs action{needsActionCount > 0 ? ` · ${needsActionCount}` : ''}
						</button>
						<button
							type='button'
							role='tab'
							aria-selected={tab === 'unread'}
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
											activeWorkspaceId={activeWorkspaceId || null}
											onOpen={(n) => void openNotification(n)}
											onMarkRead={(id) => markRead.mutate(id)}
											onArchive={(id) => archive.mutate([id])}
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
								{emptyCopy[tab][0]}
							</p>
							<p className='max-w-[260px] text-[12px] leading-[17px] text-zinc-400 dark:text-zinc-500'>
								{emptyCopy[tab][1]}
							</p>
						</div>
					)}
				</div>

				{settingsWorkspaceId && (
					<button
						type='button'
						onClick={() => {
							close();
							navigate(paths.notifications(settingsWorkspaceId));
						}}
						className='text-primary-600 dark:text-primary-400 flex w-full items-center justify-center gap-1 border-t border-zinc-500/10 py-2.5 text-[12px] font-bold transition hover:bg-zinc-500/[0.07]'>
						{hasMore ? 'See all notifications' : 'Open inbox'}
						<ArrowRight size={12} />
					</button>
				)}
			</DropdownMenu>
		</Dropdown>
	);
};

export default NotificationsDropdown;
