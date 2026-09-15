import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy } from 'react';
import Root from '@/Root';
import Providers from '@/Providers/Providers';
import Page404Page from '@/pages/Page404.page';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import IdentityPages from '@/Routes/appPages/identityPages';
import CoreAppPages from '@/Routes/appPages/coreappPages';
import pages, { TPages } from '@/Routes/pages';

const WorkspaceListPage = lazy(() => import('@/pages/choose/WorkspaceList.page'));

/** `/onboarding`, plus its steps and `/pricing`. */
const onboardingPages = {
	root: pages.onboarding,
	...(pages.onboarding.subPages as TPages),
};

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
					/**
					 * Registered ahead of the workspace routes below: without these the
					 * static `/onboarding` paths fall through to `/:workspaceId` and the
					 * core app shell renders with "onboarding" as the workspace id.
					 * Placeholders until the pages land, per `coreappPages`.
					 */
					...Object.values(onboardingPages).map((page) => ({
						path: page.to,
						element: <UnderConstructionPage />,
					})),
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
