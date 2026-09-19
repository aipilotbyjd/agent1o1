import { lazy } from 'react';
import SettingsLayout from '@/layouts/Settings.layout';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import pages, { TPages } from '@/Routes/pages';

const workspaceSettingsPages = pages.workspaceSettings.subPages as TPages;

const BillingLayout = lazy(() => import('@/pages/settings/Billing/_layouts/Billing.layout'));
const BillingOverviewPage = lazy(() => import('@/pages/settings/Billing/index.page'));
const BillingCreditsPage = lazy(() => import('@/pages/settings/Billing/credits.page'));
const BillingHistoryPage = lazy(() => import('@/pages/settings/Billing/history.page'));

const WorkspacePage = lazy(() => import('@/pages/settings/Workspace/Workspace.page'));
const ProfilePage = lazy(() => import('@/pages/settings/Profile/Profile.page'));
const MembersPage = lazy(() => import('@/pages/settings/Members/Members.page'));

const PlanLayout = lazy(() => import('@/pages/settings/Plan/_layouts/Plan.layout'));
const PlanPage = lazy(() => import('@/pages/settings/Plan/Plan.page'));
const PlanUpgradePage = lazy(() => import('@/pages/settings/Plan/PlanUpgrade.page'));

const SettingsPages = [
	{
		path: pages.workspaceSettings.to,
		element: <SettingsLayout />,
		children: [
			{
				index: true,
				element: <UnderConstructionPage />,
			},
			{
				path: workspaceSettingsPages.profile.to,
				element: <ProfilePage />,
			},
			{
				path: workspaceSettingsPages.workspace.to,
				element: <WorkspacePage />,
			},
			{
				path: workspaceSettingsPages.members.to,
				element: <MembersPage />,
			},
			{
				path: workspaceSettingsPages.plan.to,
				element: <PlanLayout />,
				children: [
					{ index: true, element: <PlanPage /> },
					{
						path: (workspaceSettingsPages.plan.subPages as TPages).upgrade.to,
						element: <PlanUpgradePage />,
					},
				],
			},
			{
				path: workspaceSettingsPages.billing.to,
				element: <BillingLayout />,
				children: [
					{ index: true, element: <BillingOverviewPage /> },
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
			{
				path: workspaceSettingsPages.notificationChannels.to,
				element: <UnderConstructionPage />,
			},
			{
				path: workspaceSettingsPages.environments.to,
				element: <UnderConstructionPage />,
			},
			{
				path: workspaceSettingsPages.apiKeys.to,
				element: <UnderConstructionPage />,
			},
			{
				path: workspaceSettingsPages.notifications.to,
				element: <UnderConstructionPage />,
			},
		],
	},
];

export default SettingsPages;
