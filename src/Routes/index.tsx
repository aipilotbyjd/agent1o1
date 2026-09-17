import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy } from 'react';
import Root from '@/Root';
import Providers from '@/Providers/Providers';
import Page404Page from '@/pages/Page404.page';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import IdentityPages from '@/Routes/appPages/identityPages';
import WelcomePages from '@/Routes/appPages/welcomePages';
import CoreAppPages from '@/Routes/appPages/coreappPages';
import pages from '@/Routes/pages';

const WorkspaceListPage = lazy(() => import('@/pages/choose/WorkspaceList.page'));

const router = createBrowserRouter([
	{
		path: '/',
		element: <Providers />,
		children: [
			{
				path: '/',
				element: <Root />,
				children: [
					// Public routes
					...IdentityPages,
					{
						path: pages.choose.to,
						element: <WorkspaceListPage />,
					},
					// Welcome / onboarding routes — must come before the workspace routes
					// below, or static paths like `/onboarding` fall through to
					// `/:workspaceId` and the core app shell renders with "onboarding"
					// as the workspace id. Auth-gated inside OnboardingLayout.
					...WelcomePages,
					// Workspace (core app) routes
					...CoreAppPages,
					{
						path: '/under-construction',
						element: <UnderConstructionPage />,
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
