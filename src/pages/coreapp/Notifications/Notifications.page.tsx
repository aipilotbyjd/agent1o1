import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { OutletContextType } from './_layouts/Notifications.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import Spinner from '@/components/ui/Spinner';
import NotificationRow from '@/components/notifications/NotificationRow';
import { categoryIcon } from '@/components/notifications/notificationMeta';
import {
	groupByDay,
	useOpenNotification,
	useWorkspaceNames,
} from '@/components/notifications/useOpenNotification';
import {
	useArchiveNotifications,
	useMarkNotificationRead,
	useMarkNotificationsRead,
	useNotificationCatalog,
	useNotificationSummary,
	useNotifications,
	useUnarchiveNotifications,
} from '@/api/modules/notifications';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import type {
	TNotificationCategoryKey,
	TNotificationListParams,
	TNotificationStatusFilter,
} from '@/types/notification.type';

type TView = TNotificationStatusFilter | 'needs_action';

const VIEWS: { value: TView; label: string }[] = [
	{ value: 'inbox', label: 'All' },
	{ value: 'needs_action', label: 'Needs action' },
	{ value: 'unread', label: 'Unread' },
	{ value: 'archived', label: 'Archived' },
];

const chipClass = (active: boolean) =>
	`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold transition-colors ${
		active
			? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
			: 'bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
	}`;

/**
 * The whole inbox, across workspaces: what the bell shows, with filters by
 * status, category and workspace, archiving, and every page of history.
 */
const NotificationsPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { activeWorkspaceId, workspaces } = useWorkspaceContext();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.notifications }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [view, setView] = useState<TView>('inbox');
	const [category, setCategory] = useState<TNotificationCategoryKey | ''>('');
	const [workspaceFilter, setWorkspaceFilter] = useState('');

	const params: TNotificationListParams = {
		status: view === 'needs_action' ? 'inbox' : view,
		needs_action: view === 'needs_action' || undefined,
		category: category || undefined,
		workspace_id: workspaceFilter || undefined,
		per_page: 30,
	};

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useNotifications(params);
	const { data: summary } = useNotificationSummary();
	const { data: catalog } = useNotificationCatalog();
	const markRead = useMarkNotificationRead();
	const markManyRead = useMarkNotificationsRead();
	const archive = useArchiveNotifications();
	const unarchive = useUnarchiveNotifications();
	const openNotification = useOpenNotification();
	const workspaceNames = useWorkspaceNames();

	const notifications = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
	const groups = useMemo(() => groupByDay(notifications), [notifications]);
	const unreadInFilter = category
		? (summary?.by_category[category] ?? 0)
		: (summary?.unread ?? 0);

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] dark:bg-zinc-950'>
			<div className='mx-auto w-full max-w-3xl py-4'>
				<div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
					<div>
						<h1 className='flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
							<Bell size={22} className='text-primary-500' /> Notifications
						</h1>
						<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
							Everything that needed your attention, across all your workspaces.
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={() =>
								markManyRead.mutate({
									all: true,
									category: category || undefined,
									workspace_id: workspaceFilter || undefined,
								})
							}
							disabled={
								markManyRead.isPending ||
								unreadInFilter === 0 ||
								workspaceFilter === 'none'
							}
							className='inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'>
							<CheckCheck size={16} /> Mark all read
						</button>
						{activeWorkspaceId && (
							<Link
								to={paths.notificationSettings(activeWorkspaceId)}
								aria-label='Notification settings'
								className='inline-flex min-h-10 items-center rounded-xl border border-zinc-200 bg-white px-3 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
								<Settings size={16} />
							</Link>
						)}
					</div>
				</div>

				<div
					role='tablist'
					aria-label='Notification status'
					className='mb-3 flex flex-wrap gap-1.5'>
					{VIEWS.map((option) => (
						<button
							key={option.value}
							type='button'
							role='tab'
							aria-selected={view === option.value}
							onClick={() => setView(option.value)}
							className={chipClass(view === option.value)}>
							{option.label}
							{option.value === 'needs_action' &&
								(summary?.needs_action ?? 0) > 0 && (
									<span className='rounded-full bg-rose-500 px-1.5 text-[10px] leading-4 text-white'>
										{summary?.needs_action}
									</span>
								)}
							{option.value === 'unread' && (summary?.unread ?? 0) > 0 && (
								<span className='opacity-70'>{summary?.unread}</span>
							)}
						</button>
					))}
				</div>

				<div className='mb-5 flex flex-wrap items-center gap-1.5'>
					<button
						type='button'
						onClick={() => setCategory('')}
						className={chipClass(category === '')}>
						Every category
					</button>
					{(catalog?.categories ?? []).map((entry) => {
						const Icon = categoryIcon(entry.key);
						const unread = summary?.by_category[entry.key] ?? 0;
						return (
							<button
								key={entry.key}
								type='button'
								onClick={() => setCategory(entry.key)}
								className={chipClass(category === entry.key)}>
								<Icon size={13} />
								{entry.label}
								{unread > 0 && <span className='opacity-70'>{unread}</span>}
							</button>
						);
					})}
					{workspaces.length > 1 && (
						<select
							aria-label='Filter by workspace'
							value={workspaceFilter}
							onChange={(event) => setWorkspaceFilter(event.target.value)}
							className='ml-auto min-h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[12.5px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'>
							<option value=''>All workspaces</option>
							{workspaces.map((workspace) => (
								<option key={workspace.id} value={workspace.id}>
									{workspace.name}
								</option>
							))}
							<option value='none'>Account only</option>
						</select>
					)}
				</div>

				<div className='rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900'>
					{isLoading ? (
						<div className='flex justify-center py-16'>
							<Spinner />
						</div>
					) : notifications.length === 0 ? (
						<div className='flex flex-col items-center justify-center gap-2 px-4 py-16 text-center'>
							<span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10'>
								<Bell size={22} className='text-zinc-400' />
							</span>
							<p className='text-[14px] font-bold text-zinc-700 dark:text-zinc-200'>
								{view === 'archived' ? 'Nothing archived' : "You're all caught up"}
							</p>
							<p className='max-w-[300px] text-[12px] leading-[17px] text-zinc-400 dark:text-zinc-500'>
								Nothing matches these filters.
							</p>
						</div>
					) : (
						groups.map(([day, items]) => (
							<section key={day}>
								<h2 className='px-3 pt-3 pb-1.5 text-[11px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									{day}
								</h2>
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
											onUnarchive={(id) => unarchive.mutate([id])}
										/>
									))}
								</div>
							</section>
						))
					)}

					{hasNextPage && (
						<div className='flex justify-center p-3'>
							<button
								type='button'
								onClick={() => void fetchNextPage()}
								disabled={isFetchingNextPage}
								className='min-h-9 rounded-xl px-4 text-[12.5px] font-bold text-zinc-600 transition hover:bg-zinc-500/10 disabled:opacity-50 dark:text-zinc-300'>
								{isFetchingNextPage ? 'Loading…' : 'Show older'}
							</button>
						</div>
					)}
				</div>
			</div>
		</Container>
	);
};

export default NotificationsPage;
