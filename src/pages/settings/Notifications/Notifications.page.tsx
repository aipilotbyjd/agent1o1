import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, Bot, CreditCard, Play, Plug, Users } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import { useNotificationEvents } from '@/api/modules/notifications';
import { useNotificationChannels } from '@/api/modules/notification-channels';
import {
	useNotificationPreferences,
	useUpsertNotificationPreference,
} from '@/api/modules/notification-preferences';
import Checkbox from '@/components/form/Checkbox';
import Spinner from '@/components/ui/Spinner';
import pages from '@/Routes/pages';
import type { TNotificationEventKey } from '@/types/notification.type';

type TCategory = 'workspace' | 'run' | 'connector' | 'billing' | 'agent';

const categoryConfig: Record<
	TCategory,
	{ title: string; icon: ComponentType<{ size?: number; className?: string }> }
> = {
	workspace: { title: 'Workspace', icon: Users },
	run: { title: 'Runs', icon: Play },
	connector: { title: 'Connectors', icon: Plug },
	billing: { title: 'Billing', icon: CreditCard },
	agent: { title: 'Agents', icon: Bot },
};

const categoryFromKey = (key: TNotificationEventKey): TCategory => key.split('.')[0] as TCategory;

const NotificationsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: catalog, isLoading: catalogLoading } = useNotificationEvents();
	const { data: preferences, isLoading: preferencesLoading } =
		useNotificationPreferences(activeWorkspaceId);
	const { data: channels = [] } = useNotificationChannels(activeWorkspaceId);
	const upsert = useUpsertNotificationPreference(activeWorkspaceId);

	const isLoading = catalogLoading || preferencesLoading;

	if (isLoading || !catalog) {
		return (
			<div className='mx-auto flex w-full max-w-[900px] flex-col items-center justify-center px-6 py-24 sm:px-10 lg:px-14'>
				<Spinner color='primary' className='size-8' />
				<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
					Loading notification settings...
				</p>
			</div>
		);
	}

	const preferenceFor = (key: TNotificationEventKey) =>
		preferences?.find((p) => p.event_key === key);

	const handleToggle = (
		key: TNotificationEventKey,
		field: 'in_app' | 'email',
		value: boolean,
	) => {
		const entry = catalog.find((e) => e.key === key);
		const current = preferenceFor(key);
		upsert.mutate({
			event_key: key,
			in_app:
				field === 'in_app' ? value : (current?.in_app ?? entry?.defaults.in_app ?? true),
			email: field === 'email' ? value : (current?.email ?? entry?.defaults.email ?? false),
			channel_ids: current?.channel_ids ?? null,
		});
	};

	const handleToggleChannel = (key: TNotificationEventKey, channelId: string) => {
		const entry = catalog.find((e) => e.key === key);
		const current = preferenceFor(key);
		const currentChannelIds = current?.channel_ids ?? [];
		const channelIds = currentChannelIds.includes(channelId)
			? currentChannelIds.filter((id) => id !== channelId)
			: [...currentChannelIds, channelId];

		upsert.mutate({
			event_key: key,
			in_app: current?.in_app ?? entry?.defaults.in_app ?? true,
			email: current?.email ?? entry?.defaults.email ?? false,
			channel_ids: channelIds,
		});
	};

	const categories = (Object.keys(categoryConfig) as TCategory[]).filter((category) =>
		catalog.some((entry) => categoryFromKey(entry.key) === category),
	);

	return (
		<div className='mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Notifications
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Choose how you're notified about activity in this workspace.
				</p>
			</div>

			{channels.length === 0 && (
				<Link
					to={pages.workspaceSettings.subPages!.notificationChannels.to.replace(
						':workspaceId',
						activeWorkspaceId,
					)}
					className='mb-6 flex items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-4 py-3 text-xs font-semibold text-zinc-500 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400'>
					<Plug size={14} className='shrink-0' />
					<span>
						Add a Slack, Discord, or webhook channel to route notifications there too.
					</span>
					<ArrowRight size={12} className='ml-auto shrink-0' />
				</Link>
			)}

			<div className='mb-6 flex items-center justify-end gap-8 pr-1 text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
				<span className='w-12 text-center'>In-app</span>
				<span className='w-12 text-center'>Email</span>
			</div>

			<div className='space-y-8'>
				{categories.map((category) => {
					const cfg = categoryConfig[category];
					const entries = catalog.filter(
						(entry) => categoryFromKey(entry.key) === category,
					);
					return (
						<section key={category}>
							<div className='mb-3 flex items-center gap-2'>
								<cfg.icon size={15} className='text-zinc-400 dark:text-zinc-500' />
								<h3 className='text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									{cfg.title}
								</h3>
							</div>
							<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
								{entries.map((entry, i) => {
									const pref = preferenceFor(entry.key);
									const inApp = pref?.in_app ?? entry.defaults.in_app;
									const email = pref?.email ?? entry.defaults.email;
									const selectedChannelIds = pref?.channel_ids ?? [];
									return (
										<div
											key={entry.key}
											className={`px-5 py-4 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
											<div className='flex items-center gap-4'>
												<div className='min-w-0 flex-1'>
													<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
														{entry.label}
													</p>
													<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
														{entry.description}
													</p>
												</div>
												<div className='flex w-12 justify-center'>
													<Checkbox
														variant='switch'
														checked={inApp}
														onChange={(e) =>
															handleToggle(
																entry.key,
																'in_app',
																e.target.checked,
															)
														}
														aria-label={`In-app notifications for ${entry.label}`}
													/>
												</div>
												<div className='flex w-12 justify-center'>
													<Checkbox
														variant='switch'
														checked={email}
														onChange={(e) =>
															handleToggle(
																entry.key,
																'email',
																e.target.checked,
															)
														}
														aria-label={`Email notifications for ${entry.label}`}
													/>
												</div>
											</div>
											{channels.length > 0 && (
												<div className='mt-3 flex flex-wrap items-center gap-1.5'>
													<span className='mr-1 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Also send to
													</span>
													{channels.map((channel) => {
														const selected =
															selectedChannelIds.includes(channel.id);
														return (
															<button
																key={channel.id}
																type='button'
																onClick={() =>
																	handleToggleChannel(
																		entry.key,
																		channel.id,
																	)
																}
																className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
																	selected
																		? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
																		: 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
																}`}>
																{channel.name}
															</button>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</section>
					);
				})}
			</div>

			<div className='mt-8 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-950/20 dark:bg-amber-950/10'>
				<AlertTriangle size={16} className='shrink-0 text-amber-500' />
				<p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>
					These preferences are yours alone — they don't change what other members of this
					workspace receive.
				</p>
			</div>
		</div>
	);
};

export default NotificationsPage;
