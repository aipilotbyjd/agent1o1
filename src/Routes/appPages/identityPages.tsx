import pages from '@/Routes/pages';
import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/identity/Login/Login.page'));
const SignupPage = lazy(() => import('@/pages/identity/Signup/Signup.page'));
const ForgotPasswordPage = lazy(
	() => import('@/pages/identity/ForgotPassword/ForgotPassword.page'),
);
const ResetPasswordPage = lazy(() => import('@/pages/identity/ResetPassword/ResetPassword.page'));
const VerifyEmailPage = lazy(() => import('@/pages/identity/VerifyEmail/VerifyEmail.page'));
const OAuthCallbackPage = lazy(() => import('@/pages/identity/OAuthCallback/OAuthCallback.page'));
// Lives with Apps rather than identity, but has to be routed outside the
// workspace tree: it runs in a popup with no workspace in its URL.
const ConnectorOAuthCompletePage = lazy(() => import('@/pages/coreapp/Apps/OAuthComplete.page'));

const IdentityPages = [
	{
		path: pages.identity.login.to,
		element: <LoginPage />,
	},
	{
		path: pages.identity.signup.to,
		element: <SignupPage />,
	},
	{
		path: pages.identity.forgotPassword.to,
		element: <ForgotPasswordPage />,
	},
	{
		path: pages.identity.resetPassword.to,
		element: <ResetPasswordPage />,
	},
	{
		path: pages.identity.verifyEmail.to,
		element: <VerifyEmailPage />,
	},
	{
		path: pages.identity.oauthCallback.to,
		element: <OAuthCallbackPage />,
	},
	{
		path: pages.identity.connectorOAuthComplete.to,
		element: <ConnectorOAuthCompletePage />,
	},
];

export default IdentityPages;
