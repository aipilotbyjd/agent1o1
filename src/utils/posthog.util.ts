import posthog from 'posthog-js';

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

/** PostHog only runs when a project token is configured, so local and CI builds stay silent. */
export const isPostHogEnabled = Boolean(projectToken);

let isInitialized = false;

/**
 * Starts PostHog once, before React renders (events captured earlier are dropped).
 *
 * - `person_profiles: 'identified_only'` keeps anonymous visitors off the paid
 *   person-profile quota until they sign in.
 * - Replays mask every input. Add the `ph-no-capture` class to any element whose
 *   content (agent chats, secrets, credentials) must never be recorded.
 * - Pageviews follow react-router history changes through `defaults`.
 */
export const initPostHog = (): void => {
	if (!isPostHogEnabled || isInitialized) return;

	posthog.init(projectToken as string, {
		api_host: apiHost,
		defaults: '2026-08-30',
		person_profiles: 'identified_only',
		session_recording: {
			maskAllInputs: true,
		},
	});

	isInitialized = true;
};

export { posthog };
