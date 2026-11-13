import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import './i18n';
import { PostHogProvider } from '@posthog/react';
import { initPostHog, isPostHogEnabled, posthog } from './utils/posthog.util';

initPostHog();

createRoot(document.getElementById('root')!).render(
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
