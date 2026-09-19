import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { lazy } from 'react';
import Root from '@/Root';
import Providers from '@/Providers/Providers';
import Page404Page from '@/pages/Page404.page';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import IdentityPages from '@/Routes/appPages/identityPages';
import WelcomePages from '@/Routes/appPages/welcomePages';
import CoreAppPages from '@/Routes/appPages/coreappPages';
import SettingsPages from '@/Routes/appPages/settingsPages';
import pages from '@/Routes/pages';

const WorkspaceListPage = lazy(() => import('@/pages/choose/WorkspaceList.page'));
const BillingSuccessPage = lazy(() => import('@/pages/billing/BillingSuccess.page'));
const BillingCancelPage = lazy(() => import('@/pages/billing/BillingCancel.page'));

const router = createBrowserRouter([
	{
		path: '/',
		element: <Providers />,
		children: [
			{
				path: '/',
				element: <Root />,
				children: [
					{
						index: true,
						element: <Navigate to={pages.identity.login.to} replace />,
					},
					...IdentityPages,
					{
						path: pages.choose.to,
						element: <WorkspaceListPage />,
					},
					...WelcomePages,
					...CoreAppPages,
					...SettingsPages,
					{
						path: '/under-construction',
						element: <UnderConstructionPage />,
					},
					{
						path: '/billing/success',
						element: <BillingSuccessPage />,
					},
					{
						path: '/billing/cancel',
						element: <BillingCancelPage />,
					},
					{
						path: '*',
						element: <Page404Page />,
					},
				],
			},
		],
	},
]);

const Routes = () => {
	return <RouterProvider router={router} />;
};

export default Routes;
