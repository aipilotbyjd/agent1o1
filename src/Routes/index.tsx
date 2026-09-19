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
const BillingSuccessPage = lazy(() => import('@/pages/settings/Billing/BillingSuccess.page'));
const BillingCancelPage = lazy(() => import('@/pages/settings/Billing/BillingCancel.page'));
const BillingReturnPage = lazy(() => import('@/pages/settings/Billing/BillingReturn.page'));
const PricingPage = lazy(() => import('@/pages/welcome/Pricing.page'));

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
					// Marketing pricing — public on purpose. It renders from static copy
					// and pulls nothing workspace-scoped, so it must stay outside the
					// onboarding auth boundary or prospects get bounced to /login.
					{
						path: pages.welcome.subPages!.pricing.to,
						element: <PricingPage />,
					},
					{
						path: pages.choose.to,
						element: <WorkspaceListPage />,
					},
					// Stripe returns here (see BillingReturn.page.tsx); must be registered
					// before the `/:workspaceId` core-app routes or it falls through.
					{
						path: '/workspaces/:workspaceSlug/billing',
						element: <BillingReturnPage />,
					},
					// Welcome / onboarding routes — must come before the workspace routes
					// below, or static paths like `/onboarding` fall through to
					// `/:workspaceId` and the core app shell renders with "onboarding"
					// as the workspace id. Auth-gated inside OnboardingLayout.
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
