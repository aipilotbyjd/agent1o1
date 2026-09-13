import { useNavigate } from 'react-router';
import classNames from 'classnames';
import dayjs from 'dayjs';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Skeleton from '@/components/ui/Skeleton';
import Icon from '@/components/icon/Icon';
import EmptyState from '@/components/common/EmptyState';
import {
	useNotifications,
	useUnreadNotificationCount,
	useMarkNotificationRead,
	useMarkAllNotificationsRead,
	useDeleteNotification,
} from '@/api/modules/notifications';
import { formatRelative } from '@/utils/format.util';
import type { TNotification } from '@/types/notification.type';

// ============================================================
// Notifications
// ------------------------------------------------------------
// Account-level notifications — Laravel database notifications,
// not workspace-scoped, so the bell keeps showing them across a
// workspace switch.
//
// The unread count polls on its own (`useUnreadNotificationCount`,
// 60s) while the list is only fetched when the dropdown is open —
// a badge is cheap, twenty rows of body text are not.
// ============================================================

/** How many rows fit the dropdown before scrolling stops being useful. */
const PER_PAGE = 10;

/** Notifications can carry a run id, which is the one thing worth
 *  deep-linking to — anything else stays a plain read-and-dismiss row. */
const targetPath = (notification: TNotification): string | null => {
	const runId = notification.data?.run_id;
	return typeof runId === 'string' || typeof runId === 'number' ? `/runs/${runId}` : null;
};

const NotificationsTemplate = () => {
	const navigate = useNavigate();
	const { data: unread } = useUnreadNotificationCount();
	const { data: notifications, isLoading } = useNotifications({ per_page: PER_PAGE });

	const markRead = useMarkNotificationRead();
	const markAllRead = useMarkAllNotificationsRead();
	const remove = useDeleteNotification();

	const unreadCount = unread?.unread ?? 0;

	const onOpen = (notification: TNotification) => {
		if (!notification.read_at) markRead.mutate(notification.id);
		const path = targetPath(notification);
		if (path) navigate(path);
	};

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<div className='flex items-center'>
					<Tooltip text='View notifications'>
						<Button
							aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
							icon='Notification03'
							variant='link'
							className='relative !p-0'>
							{unreadCount > 0 && (
								<span className='absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 font-semibold text-white'>
									{unreadCount > 9 ? '9+' : unreadCount}
								</span>
							)}
						</Button>
					</Tooltip>
				</div>
			</DropdownToggle>

			<DropdownMenu placement='bottom-end' className='w-80 !gap-0 !p-0'>
				<div className='flex items-center gap-2 border-b border-zinc-500/25 p-2'>
					<span className='grow px-1 font-semibold'>Notifications</span>
					{unreadCount > 0 && (
						<Button
							variant='link'
							dimension='sm'
							isDisable={markAllRead.isPending}
							onClick={() => markAllRead.mutate()}>
							Mark all read
						</Button>
					)}
				</div>

				<div className='max-h-96 divide-y divide-zinc-500/10 overflow-auto'>
					{isLoading && (
						<div className='flex flex-col gap-2 p-3'>
							<Skeleton className='h-10 w-full' />
							<Skeleton className='h-10 w-full' />
						</div>
					)}

					{!isLoading && !notifications?.length && (
						<EmptyState
							icon='Notification03'
							title='All caught up'
							description='Run failures, approvals and invites land here.'
						/>
					)}

					{!isLoading &&
						notifications?.map((notification) => (
							<div
								key={notification.id}
								className={classNames('group/item relative flex gap-2 p-3', {
									'bg-zinc-500/10': !notification.read_at,
								})}>
								<div className='flex w-2 shrink-0 justify-center pt-2'>
									{!notification.read_at && (
										<span className='size-2 rounded-full bg-blue-500' />
									)}
								</div>

								<button
									type='button'
									className='min-w-0 grow cursor-pointer text-start'
									onClick={() => onOpen(notification)}>
									<div className='text-xs text-zinc-500'>
										<Tooltip text={dayjs(notification.created_at).format('LLL')}>
											<span>{formatRelative(notification.created_at)}</span>
										</Tooltip>
									</div>
									{notification.title && (
										<div className='truncate font-semibold'>
											{notification.title}
										</div>
									)}
									{notification.body && (
										<div className='text-sm text-zinc-500'>{notification.body}</div>
									)}
								</button>

								<button
									type='button'
									aria-label='Delete notification'
									className='invisible absolute top-2 right-2 cursor-pointer text-zinc-500 group-hover/item:visible'
									onClick={() => remove.mutate(notification.id)}>
									<Icon icon='Delete02' />
								</button>
							</div>
						))}
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default NotificationsTemplate;
