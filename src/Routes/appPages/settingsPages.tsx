import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router';
import SettingsLayout from '@/layouts/Settings.layout';
import pages, { relativeTo, relativeToWorkspace, settingsRedirects } from '@/Routes/pages';
import WorkspaceRedirect from '@/Routes/redirects';

const settingsPages = pages.settings.subPages!;
const billingPages = settingsPages.billing.subPages!;

/** Children are relative to `/:workspaceId/settings`, which the parent route owns. */
const rel = (to: string) => relativeTo(pages.settings.to, to);

const BillingLayout = lazy(() => import('@/pages/settings/Billing/_layouts/Billing.layout'));
const BillingOverviewPage = lazy(() => import('@/pages/settings/Billing/Overview.page'));
const BillingPlansPage = lazy(() => import('@/pages/settings/Billing/Plans.page'));
const BillingCreditsPage = lazy(() => import('@/pages/settings/Billing/Credits.page'));
const BillingUsagePage = lazy(() => import('@/pages/settings/Billing/Usage.page'));

const WorkspacePage = lazy(() => import('@/pages/settings/Workspace/Workspace.page'));
const ProfilePage = lazy(() => import('@/pages/settings/Profile/Profile.page'));
const MembersPage = lazy(() => import('@/pages/settings/Members/Members.page'));
const ApiKeysPage = lazy(() => import('@/pages/settings/ApiKeys/ApiKeys.page'));
const NotificationsPage = lazy(() => import('@/pages/settings/Notifications/Notifications.page'));
const NotificationChannelsPage = lazy(
	() => import('@/pages/settings/NotificationChannels/NotificationChannels.page'),
);

/** Registered as a child of the `/:workspaceId` guard, alongside the core-app shell. */
const SettingsPages: RouteObject[] = [
	{
		path: relativeToWorkspace(pages.settings.to),
		element: <SettingsLayout />,
		children: [
			{
				index: true,
				element: <Navigate to={rel(settingsPages.profile.to)} replace />,
			},
			{ path: rel(settingsPages.profile.to), element: <ProfilePage /> },
			{ path: rel(settingsPages.notifications.to), element: <NotificationsPage /> },
			{ path: rel(settingsPages.workspace.to), element: <WorkspacePage /> },
			{ path: rel(settingsPages.members.to), element: <MembersPage /> },
			{ path: rel(settingsPages.apiKeys.to), element: <ApiKeysPage /> },
			{
				path: rel(settingsPages.notificationChannels.to),
				element: <NotificationChannelsPage />,
			},
			{
				path: rel(settingsPages.billing.to),
				element: <BillingLayout />,
				children: [
					{ index: true, element: <BillingOverviewPage /> },
					{
						path: relativeTo(settingsPages.billing.to, billingPages.plans.to),
						element: <BillingPlansPage />,
					},
					{
						path: relativeTo(settingsPages.billing.to, billingPages.credits.to),
						element: <BillingCreditsPage />,
					},
					{
						path: relativeTo(settingsPages.billing.to, billingPages.usage.to),
						element: <BillingUsagePage />,
					},
				],
			},
			// Pre-reshuffle URLs, kept so existing bookmarks and emailed links resolve.
			...settingsRedirects.map(({ from, to }) => ({
				path: rel(from),
				element: <WorkspaceRedirect to={to} />,
			})),
		],
	},
];

export default SettingsPages;
