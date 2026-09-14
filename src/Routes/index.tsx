import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { lazy } from 'react';
import LoginPage from '@/pages/auth/Login.page';
import RegisterPage from '@/pages/auth/Register.page';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword.page';
import ResetPasswordPage from '@/pages/auth/ResetPassword.page';
import VerifyEmailPage from '@/pages/auth/VerifyEmail.page';
import TwoFactorPage from '@/pages/auth/TwoFactor.page';
import TwoFactorSetupPage from '@/pages/auth/TwoFactorSetup.page';
import MagicLinkPage from '@/pages/auth/MagicLink.page';
import OAuthCallbackPage from '@/pages/auth/OAuthCallback.page';
import OAuthCompletePage from '@/pages/app/Apps/OAuthComplete.page';
import AccountLockedPage from '@/pages/auth/AccountLocked.page';
import SessionExpiredPage from '@/pages/auth/SessionExpired.page';
import Protected from '@/Protected/Protected';
import Root from '@/Root';
import Providers from '@/Providers/Providers';
import pages from './pages';
import Page404Page from '@/pages/Page404.page';
import UnderConstructionPage from '@/pages/UnderConstruction.page';
import AppLayout from '@/layouts/App.layout';
import SettingsLayout from '@/layouts/Settings.layout';
import SettingsPages from './agent1o1Pages/settingsPages';
import AppPages from './agent1o1Pages/appPages';
import AgentLayout from '@/layouts/Agent.layout';
import AgentPages from './agent1o1Pages/agentPages';
import EditorLayout from '@/layouts/Editor.layout';
import EditorPages from './agent1o1Pages/editorPages';
import OnboardingLayout from '@/layouts/Onboarding.layout';

// Lazily loaded components for routes
const BillingSuccessPage = lazy(() => import('@/pages/billing/BillingSuccess.page'));
const BillingCancelPage = lazy(() => import('@/pages/billing/BillingCancel.page'));
const PricingPage = lazy(() => import('@/pages/onboarding/Pricing.page'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/Onboarding.page'));
const CreateWorkspacePage = lazy(
	() => import('@/pages/onboarding/standalone/CreateWorkspace.page'),
);
const InviteTeamPage = lazy(() => import('@/pages/onboarding/standalone/InviteTeam.page'));
const WorkspacesPage = lazy(() => import('@/pages/settings/Workspaces/Workspaces.page'));
const WorkspaceListPage = lazy(() => import('@/pages/settings/Workspaces/WorkspaceList.page'));

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
						path: '/',
						element: <Navigate to={pages.app.subPages.dashboard.to} replace />,
					},
					// Public routes
					{
						path: pages.pagesExamples.login.to,
						element: <LoginPage />,
					},
					{
						path: pages.pagesExamples.signup.to,
						element: <RegisterPage />,
					},
					{
						path: pages.auth.forgotPassword.to,
						element: <ForgotPasswordPage />,
					},
					{
						path: pages.auth.resetPassword.to,
						element: <ResetPasswordPage />,
					},
					{
						path: pages.auth.verifyEmail.to,
						element: <VerifyEmailPage />,
					},
					{
						path: '/email-verified',
						element: <VerifyEmailPage />,
					},
					{
						path: pages.auth.twoFactor.to,
						element: <TwoFactorPage />,
					},
					{
						path: pages.auth.twoFactorSetup.to,
						element: <TwoFactorSetupPage />,
					},
					{
						path: pages.auth.magicLink.to,
						element: <MagicLinkPage />,
					},
					{
						path: pages.auth.oauthCallback.to,
						element: <OAuthCallbackPage />,
					},
					{
						path: pages.auth.oauthComplete.to,
						element: <OAuthCompletePage />,
					},
					{
						path: '/credentials',
						element: <OAuthCompletePage />,
					},
					{
						path: pages.auth.accountLocked.to,
						element: <AccountLockedPage />,
					},
					{
						path: pages.auth.sessionExpired.to,
						element: <SessionExpiredPage />,
					},
					{
						element: <OnboardingLayout />,
						children: [
							{
								path: pages.onboarding.subPages.pricing.to,
								element: <PricingPage />,
							},
							{
								path: pages.onboarding.to,
								element: <OnboardingPage />,
							},
							{
								path: pages.onboarding.subPages.createWorkspace.to,
								element: <CreateWorkspacePage />,
							},
							{
								path: pages.onboarding.subPages.inviteTeam.to,
								element: <InviteTeamPage />,
							},
							{
								path: '/workspaces',
								element: <WorkspacesPage />,
							},
							{
								path: '/workspace-list',
								element: <WorkspaceListPage />,
							},
						],
					},

					{
						path: pages.pagesExamples.underConstruction.to,
						element: <UnderConstructionPage />,
					},
					// Stripe callback pages (full-screen, no layout)
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
					// Protected routes
					{
						element: <Protected role='admin' />,
						children: [
							// App routes
							{
								element: <AppLayout />,
								children: AppPages,
							},
							// Settings routes
							{
								element: <SettingsLayout />,
								children: SettingsPages,
							},
							// Agent routes
							{
								element: <AgentLayout />,
								children: AgentPages,
							},
							// Editor routes
							{
								element: <EditorLayout />,
								children: EditorPages,
							},
						],
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
