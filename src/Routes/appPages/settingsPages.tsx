import { lazy } from 'react';
import { Navigate, useParams } from 'react-router';
import SettingsLayout from '@/layouts/Settings.layout';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import pages, { TPages } from '@/Routes/pages';

const workspaceSettingsPages = pages.workspaceSettings.subPages as TPages;
const billingPlansPath = (workspaceSettingsPages.billing.subPages as TPages).plans.to;

const RedirectToBillingPlans = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	return <Navigate to={billingPlansPath.replace(':workspaceId', workspaceId!)} replace />;
};

const BillingLayout = lazy(() => import('@/pages/settings/Billing/_layouts/Billing.layout'));
const BillingOverviewPage = lazy(() => import('@/pages/settings/Billing/Overview.page'));
const BillingPlansPage = lazy(() => import('@/pages/settings/Billing/plans.page'));
const BillingCreditsPage = lazy(() => import('@/pages/settings/Billing/credits.page'));
const BillingHistoryPage = lazy(() => import('@/pages/settings/Billing/history.page'));

const WorkspacePage = lazy(() => import('@/pages/settings/Workspace/Workspace.page'));
const ProfilePage = lazy(() => import('@/pages/settings/Profile/Profile.page'));
const MembersPage = lazy(() => import('@/pages/settings/Members/Members.page'));

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
				path: workspaceSettingsPages.legacyPlan.to,
				element: <RedirectToBillingPlans />,
			},
			{
				path: (workspaceSettingsPages.legacyPlan.subPages as TPages).upgrade.to,
				element: <RedirectToBillingPlans />,
			},
			{
				path: workspaceSettingsPages.billing.to,
				element: <BillingLayout />,
				children: [
					{
						index: true,
						element: <BillingOverviewPage />,
					},
					{
						path: 'plans',
						element: <BillingPlansPage />,
					},
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
