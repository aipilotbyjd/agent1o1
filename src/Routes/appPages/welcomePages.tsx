import { lazy } from 'react';
import pages, { TPages } from '@/Routes/pages';

const OnboardingLayout = lazy(() => import('@/layouts/Onboarding.layout'));
const OnboardingPage = lazy(() => import('@/pages/welcome/Onboarding.page'));
const PricingPage = lazy(() => import('@/pages/welcome/Pricing.page'));
const CreateWorkspacePage = lazy(() => import('@/pages/welcome/standalone/CreateWorkspace.page'));
const InviteTeamPage = lazy(() => import('@/pages/welcome/standalone/InviteTeam.page'));

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
				path: welcomeSubPages.pricing.to,
				element: <PricingPage />,
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
