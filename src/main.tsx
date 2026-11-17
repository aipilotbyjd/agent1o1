import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import './i18n';
import { PostHogProvider } from '@posthog/react';
import { initPostHog, isPostHogEnabled, posthog } from './utils/posthog.util';
import { initSentry, isSentryEnabled, Sentry } from './utils/sentry.util';

initSentry();
initPostHog();

// React 19 reports render errors through these hooks; without a DSN React keeps its defaults.
const rootOptions = isSentryEnabled
	? {
			onUncaughtError: Sentry.reactErrorHandler(),
			onCaughtError: Sentry.reactErrorHandler(),
			onRecoverableError: Sentry.reactErrorHandler(),
		}
	: undefined;

createRoot(document.getElementById('root')!, rootOptions).render(
	<StrictMode>
		{isPostHogEnabled ? (
			<PostHogProvider client={posthog}>
				<App />
			</PostHogProvider>
		) : (
			<App />
		)}
	</StrictMode>,
);
