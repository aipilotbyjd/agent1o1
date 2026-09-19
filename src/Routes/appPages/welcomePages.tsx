import { lazy } from 'react';
import pages, { TPages } from '@/Routes/pages';

const OnboardingLayout = lazy(() => import('@/layouts/Onboarding.layout'));
const OnboardingPage = lazy(() => import('@/pages/welcome/Onboarding.page'));
const CreateWorkspacePage = lazy(() => import('@/pages/welcome/standalone/CreateWorkspace.page'));
const InviteTeamPage = lazy(() => import('@/pages/welcome/standalone/InviteTeam.page'));

/** `/onboarding` plus its steps. `/pricing` is public and lives in `Routes/index.tsx`. */
const welcomeSubPages = pages.welcome.subPages as TPages;

const WelcomePages = [
	{
		element: <OnboardingLayout />,
		children: [
			{
				path: pages.welcome.to,
				element: <OnboardingPage />,
			},
			{
				path: welcomeSubPages.createWorkspace.to,
				element: <CreateWorkspacePage />,
			},
			{
				path: welcomeSubPages.inviteTeam.to,
				element: <InviteTeamPage />,
			},
		],
	},
];

export default WelcomePages;
