import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
	AlertTriangle,
	Bell,
	CheckCheck,
	CheckCircle2,
	CreditCard,
	Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useDeleteNotification,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
	useUnreadNotificationCount,
} from '@/api/modules/notifications';
import type { TNotification } from '@/types/notification.type';

type TTab = 'all' | 'unread';

const isUnread = (n: TNotification) => !(n.is_read ?? !!n.read_at);

const relativeTime = (iso: string): string => {
	try {
		return formatDistanceToNow(new Date(iso), { addSuffix: true });
	} catch {
		return '';
	}
};

const TypeIcon = ({ type }: { type: string }) => {
	if (type.startsWith('execution.failed')) {
		return <AlertTriangle size={16} className='text-red-500' />;
	}
	if (type.startsWith('execution.')) {
		return <CheckCircle2 size={16} className='text-emerald-500' />;
	}
	if (type.startsWith('billing.')) {
		return <CreditCard size={16} className='text-amber-500' />;
	}
	return <Bell size={16} className='text-zinc-400' />;
};

const NotificationRow = ({
	notification,
	onRead,
	onDelete,
}: {
	notification: TNotification;
	onRead: (id: string) => void;
	onDelete: (id: string) => void;
}) => {
	const unread = isUnread(notification);

	return (
		<div
			className={`group/item relative flex gap-3 px-3 py-3 transition ${
				unread ? 'bg-primary-400/5' : ''
			} hover:bg-zinc-500/10`}>
			<div className='flex items-start gap-2'>
				<span className='mt-1.5 flex w-2 justify-center'>
					<span
						className={`size-2 rounded-full ${unread ? 'bg-primary-400' : 'invisible'}`}
					/>
				</span>
				<span className='mt-0.5 shrink-0'>
					<TypeIcon type={notification.type} />
				</span>
			</div>

			<button
				type='button'
				onClick={() => unread && onRead(notification.id)}
				className='min-w-0 grow text-left'>
				<div className='truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
					{notification.title}
				</div>
				{notification.body && (
					<div className='mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'>
						{notification.body}
					</div>
				)}
				<div className='mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500'>
					{relativeTime(notification.created_at)}
				</div>
			</button>

			<button
				type='button'
				aria-label='Delete notification'
				onClick={() => onDelete(notification.id)}
				className='invisible absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition group-hover/item:visible hover:bg-zinc-200 hover:text-red-500 dark:hover:bg-zinc-700'>
				<Trash2 size={14} />
			</button>
		</div>
	);
};

const NotificationsDropdown = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const [tab, setTab] = useState<TTab>('all');

	const { data: unreadData } = useUnreadNotificationCount(activeWorkspaceId);
	const { data, isLoading } = useNotifications(
		activeWorkspaceId,
		tab === 'unread' ? { unread: true } : undefined,
	);

	const markRead = useMarkNotificationRead(activeWorkspaceId);
	const markAllRead = useMarkAllNotificationsRead(activeWorkspaceId);
	const deleteNotification = useDeleteNotification(activeWorkspaceId);

	const unreadCount = unreadData?.count ?? 0;
	const notifications = data?.data ?? [];

	const tabClass = (active: boolean) =>
		`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
			active
				? 'bg-primary-400 text-primary-950'
				: 'text-zinc-500 hover:bg-zinc-500/10 dark:text-zinc-400'
		}`;

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<div className='relative flex items-center'>
					<Tooltip text='View notifications'>
						<Button
							aria-label='Notifications'
							icon='Notification03'
							variant='link'
							className='!p-0 text-zinc-500 hover:text-zinc-800 dark:!text-white dark:hover:!text-primary-400'
						/>
					</Tooltip>
					{unreadCount > 0 && (
						<span className='pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-400 px-1 text-[10px] font-bold text-primary-950'>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</div>
			</DropdownToggle>

			<DropdownMenu placement='bottom-end' className='w-80 !gap-0 !p-0'>
				<div className='flex items-center justify-between gap-2 border-b border-zinc-500/10 p-2'>
					<div className='flex gap-1'>
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
							Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
						</button>
					</div>
				</div>

				<div className='max-h-96 divide-y divide-zinc-500/10 overflow-auto'>
					{isLoading ? (
						<div className='space-y-2 p-3'>
							{[...Array(4)].map((_, i) => (
								<div
									key={i}
									className='h-14 animate-pulse rounded-lg bg-zinc-500/10'
								/>
							))}
						</div>
					) : notifications.length > 0 ? (
						notifications.map((n) => (
							<NotificationRow
								key={n.id}
								notification={n}
								onRead={(id) => markRead.mutate(id)}
								onDelete={(id) => deleteNotification.mutate(id)}
							/>
						))
					) : (
						<div className='flex flex-col items-center justify-center gap-2 px-4 py-12 text-center'>
							<Bell size={28} className='text-zinc-300 dark:text-zinc-600' />
							<p className='text-sm font-semibold text-zinc-400 dark:text-zinc-500'>
								{tab === 'unread'
									? "You're all caught up"
									: 'No notifications yet'}
							</p>
						</div>
					)}
				</div>

				{notifications.length > 0 && (
					<div className='flex items-center justify-center border-t border-zinc-500/10 p-1'>
						<button
							type='button'
							onClick={() => markAllRead.mutate()}
							disabled={markAllRead.isPending || unreadCount === 0}
							className='flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-500/10 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200'>
							<CheckCheck size={15} />
							Mark all as read
						</button>
					</div>
				)}
			</DropdownMenu>
		</Dropdown>
	);
};

export default NotificationsDropdown;
