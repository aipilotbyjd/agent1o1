import pages from '@/Routes/pages';
import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router';

const RedirectToPlan = ({ tab }: { tab: string }) => {
	const location = useLocation();
	return (
		<Navigate
			to={`/settings/plan?tab=${tab}${location.search ? `&${location.search.slice(1)}` : ''}`}
			replace
		/>
	);
};

// ── Billing ───────────────────────────────────────────────────────────────────
const BillingLayout = lazy(() => import('@/pages/settings/Billing/_layouts/Billing.layout'));
const BillingCreditsPage = lazy(() => import('@/pages/settings/Billing/credits.page'));
const BillingHistoryPage = lazy(() => import('@/pages/settings/Billing/history.page'));

// ── Plan ──────────────────────────────────────────────────────────────────────
const PlanLayout = lazy(() => import('@/pages/settings/Plan/_layouts/Plan.layout'));
const PlanPage = lazy(() => import('@/pages/settings/Plan/Plan.page'));
const PlanUpgradePage = lazy(() => import('@/pages/settings/Plan/PlanUpgrade.page'));

// ── Usage ─────────────────────────────────────────────────────────────────────

// ── Other settings ────────────────────────────────────────────────────────────
const ProfileLayout = lazy(() => import('@/pages/settings/Profile/_layouts/Profile.layout'));
const ProfilePage = lazy(() => import('@/pages/settings/Profile/Profile.page'));

const WorkspaceLayout = lazy(() => import('@/pages/settings/Workspace/_layouts/Workspace.layout'));
const WorkspacePage = lazy(() => import('@/pages/settings/Workspace/Workspace.page'));

const MembersLayout = lazy(() => import('@/pages/settings/Members/_layouts/Members.layout'));
const MembersPage = lazy(() => import('@/pages/settings/Members/Members.page'));

const SecurityLayout = lazy(() => import('@/pages/settings/Security/_layouts/Security.layout'));
const SecurityPage = lazy(() => import('@/pages/settings/Security/Security.page'));

const SecretsLayout = lazy(() => import('@/pages/settings/Secrets/_layouts/Secrets.layout'));
const SecretsPage = lazy(() => import('@/pages/settings/Secrets/Secrets.page'));

const NotificationsLayout = lazy(
	() => import('@/pages/settings/Notifications/_layouts/Notifications.layout'),
);
const NotificationsPage = lazy(() => import('@/pages/settings/Notifications/Notifications.page'));

const NotificationChannelsLayout = lazy(
	() => import('@/pages/settings/NotificationChannels/_layouts/NotificationChannels.layout'),
);
const NotificationChannelsPage = lazy(
	() => import('@/pages/settings/NotificationChannels/NotificationChannels.page'),
);

// ── Routes ────────────────────────────────────────────────────────────────────

const SettingsPages = [
	// /settings/plan + /settings/plan/upgrade
	{
		path: pages.settings.subPages.plan.to,
		element: <PlanLayout />,
		children: [
			{ index: true, element: <PlanPage /> },
			{
				path: pages.settings.subPages.plan.subPages.upgrade.to,
				element: <PlanUpgradePage />,
			},
		],
	},

	// /settings/usage (redirects to /settings/plan?tab=usage)
	{
		path: '/settings/usage',
		element: <RedirectToPlan tab='usage' />,
	},

	// /settings/billing (redirects to /settings/plan?tab=billing, keeps subpages active)
	{
		path: '/settings/billing',
		element: <BillingLayout />,
		children: [
			{ index: true, element: <RedirectToPlan tab='billing' /> },
			{
				path: 'credits',
				element: <BillingCreditsPage />,
			},
			{
				path: 'history',
				element: <BillingHistoryPage />,
			},
		],
	},

	// /settings/profile
	{
		path: pages.settings.subPages.profile.to,
		element: <ProfileLayout />,
		children: [{ index: true, element: <ProfilePage /> }],
	},

	// /settings/workspace
	{
		path: pages.settings.subPages.workspace.to,
		element: <WorkspaceLayout />,
		children: [{ index: true, element: <WorkspacePage /> }],
	},

	// /settings/members
	{
		path: pages.settings.subPages.members.to,
		element: <MembersLayout />,
		children: [{ index: true, element: <MembersPage /> }],
	},

	// /settings/security
	{
		path: pages.settings.subPages.security.to,
		element: <SecurityLayout />,
		children: [{ index: true, element: <SecurityPage /> }],
	},

	// /settings/secrets
	{
		path: pages.settings.subPages.secrets.to,
		element: <SecretsLayout />,
		children: [{ index: true, element: <SecretsPage /> }],
	},

	// /settings/notifications
	{
		path: pages.settings.subPages.notifications.to,
		element: <NotificationsLayout />,
		children: [
			{ index: true, element: <NotificationsPage /> },
		],
	},

	// /settings/notification-channels
	{
		path: pages.settings.subPages.notificationChannels.to,
		element: <NotificationChannelsLayout />,
		children: [
			{
				index: true,
				element: <NotificationChannelsPage />,
			},
		],
	},

];

export default SettingsPages;
