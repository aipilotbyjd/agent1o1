import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, Plug } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useAccountNotificationPreferences,
	useNotificationCatalog,
	useUpdateAccountNotificationPreferences,
} from '@/api/modules/notifications';
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from '@/api/modules/notification-preferences';
import Spinner from '@/components/ui/Spinner';
import pages from '@/Routes/pages';
import MarketingEmailPreference from './_partial/MarketingEmailPreference';
import PreferenceMatrix from './_partial/PreferenceMatrix';

type TTab = 'workspace' | 'account';

const tabClass = (active: boolean) =>
	`min-h-9 rounded-xl px-3 text-[12.5px] font-bold transition-colors ${
		active
			? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
			: 'bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
	}`;

/**
 * Everything the member decides about what reaches them, rendered from the
 * API's catalog: workspace events per workspace, and events about the person
 * (assistant, security, product news) on their account.
 */
const NotificationsPage = () => {
	const { activeWorkspaceId, workspaces } = useWorkspaceContext();
	const [tab, setTab] = useState<TTab>('workspace');

	const { data: catalog, isLoading: catalogLoading } = useNotificationCatalog();
	const { data: workspacePreferences, isLoading: workspaceLoading } =
		useNotificationPreferences(activeWorkspaceId);
	const { data: accountPreferences, isLoading: accountLoading } =
		useAccountNotificationPreferences();
	const updateWorkspace = useUpdateNotificationPreferences(activeWorkspaceId);
	const updateAccount = useUpdateAccountNotificationPreferences();

	const workspaceStored = useMemo(
		() =>
			new Map(
				(workspacePreferences ?? []).map((preference) => [
					preference.event_key,
					{
						in_app: preference.in_app,
						email: preference.email,
						email_digest: preference.email_digest,
					},
				]),
			),
		[workspacePreferences],
	);
	const accountStored = useMemo(
		() =>
			new Map(
				(accountPreferences ?? []).map((preference) => [
					preference.key,
					{
						in_app: preference.in_app,
						email: preference.email,
						email_digest: preference.email_digest,
					},
				]),
			),
		[accountPreferences],
	);

	if (catalogLoading || workspaceLoading || accountLoading || !catalog) {
		return (
			<div className='mx-auto flex w-full max-w-[900px] flex-col items-center justify-center px-6 py-24 sm:px-10 lg:px-14'>
				<Spinner color='primary' className='size-8' />
				<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
					Loading notification settings...
				</p>
			</div>
		);
	}

	const workspaceName = workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name;
	const workspaceCategories = catalog.categories.filter(
		(category) => category.scope === 'workspace',
	);
	// Product updates are the marketing opt-out, shown with its own wording below.
	const accountCategories = catalog.categories.filter(
		(category) => category.scope === 'account' && category.key !== 'product_updates',
	);

	return (
		<div className='mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Notifications
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Choose what reaches you, and how. Turn email to a daily digest to get one email
					a day instead of one per event.
				</p>
			</div>

			<div role='tablist' aria-label='Notification settings' className='mb-6 flex gap-1.5'>
				<button
					type='button'
					role='tab'
					aria-selected={tab === 'workspace'}
					onClick={() => setTab('workspace')}
					className={tabClass(tab === 'workspace')}>
					{workspaceName ? `In ${workspaceName}` : 'This workspace'}
				</button>
				<button
					type='button'
					role='tab'
					aria-selected={tab === 'account'}
					onClick={() => setTab('account')}
					className={tabClass(tab === 'account')}>
					Your account
				</button>
			</div>

			{tab === 'workspace' ? (
				<>
					<Link
						to={pages.settings.subPages!.notificationChannels.to.replace(
							':workspaceId',
							activeWorkspaceId,
						)}
						className='mb-6 flex items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-4 py-3 text-xs font-semibold text-zinc-500 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400'>
						<Plug size={14} className='shrink-0' />
						<span>
							Sending to Slack, Discord or a webhook is set up for the whole workspace
							under Notification channels.
						</span>
						<ArrowRight size={12} className='ml-auto shrink-0' />
					</Link>

					<PreferenceMatrix
						categories={workspaceCategories}
						stored={workspaceStored}
						disabled={updateWorkspace.isPending}
						onChange={(change) => updateWorkspace.mutate({ preferences: [change] })}
					/>

					<div className='mt-8 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-950/20 dark:bg-amber-950/10'>
						<AlertTriangle size={16} className='shrink-0 text-amber-500' />
						<p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>
							These preferences are yours alone, and only for this workspace - they
							don't change what other members receive.
						</p>
					</div>
				</>
			) : (
				<>
					<PreferenceMatrix
						categories={accountCategories}
						stored={accountStored}
						disabled={updateAccount.isPending}
						onChange={(change) => updateAccount.mutate({ preferences: [change] })}
					/>
					<MarketingEmailPreference />
				</>
			)}
		</div>
	);
};

export default NotificationsPage;
