/**
 * Security headers for the Netlify-hosted app, written to `build/_headers` at build
 * time (see vite.config.mts). The Content-Security-Policy is built from the same
 * VITE_* values the app reads, so it allows exactly the hosts this deploy talks to.
 *
 * The CSP is sent as Report-Only (violations are logged in the browser console, nothing
 * is blocked) unless CSP_MODE=enforce is set in the build environment.
 */

/** @param {string | undefined} value */
const originOf = (value) => {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
	} catch {
		return null;
	}
};

/** @param {Record<string, string | undefined>} env */
const reverbOrigin = (env) => {
	if (!env.VITE_REVERB_APP_KEY) return null;
	const host =
		env.VITE_REVERB_HOST || (originOf(env.VITE_API_URL) && new URL(env.VITE_API_URL).hostname);
	if (!host) return null;
	const secure = (env.VITE_REVERB_SCHEME || 'https') === 'https';
	const port = env.VITE_REVERB_PORT || '443';
	const defaultPort = secure ? '443' : '80';
	return `${secure ? 'wss' : 'ws'}://${host}${port === defaultPort ? '' : `:${port}`}`;
};

/**
 * PostHog loads its replay and survey code from a sibling assets host
 * (us.i.posthog.com → us-assets.i.posthog.com). A self-hosted proxy serves both itself.
 *
 * @param {Record<string, string | undefined>} env
 */
const postHogOrigins = (env) => {
	if (!env.VITE_POSTHOG_PROJECT_TOKEN) return [];
	const api = originOf(env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com');
	if (!api) return [];
	const assets = api.replace(
		/^https:\/\/(\w+)\.i\.posthog\.com$/,
		'https://$1-assets.i.posthog.com',
	);
	return assets === api ? [api] : [api, assets];
};

/** @param {string[]} sources */
const unique = (sources) => [...new Set(sources.filter(Boolean))];

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, string>}
 */
export const buildSecurityHeaders = (env) => {
	const enforce = env.CSP_MODE === 'enforce';
	const postHog = postHogOrigins(env);

	const directives = {
		'default-src': ["'self'"],
		'script-src': unique(["'self'", ...postHog]),
		// Charts, animations and the preview iframe inject <style>; page themes load Google Fonts.
		'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
		'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
		// Page blocks show images and videos from any URL the author pastes.
		'img-src': ["'self'", 'data:', 'blob:', 'https:'],
		'media-src': ["'self'", 'blob:', 'https:'],
		'connect-src': unique([
			"'self'",
			originOf(env.VITE_API_URL),
			reverbOrigin(env),
			...postHog,
			originOf(env.VITE_SENTRY_DSN),
		]),
		// Page embed blocks (YouTube, Vimeo, Loom, Calendly, Typeform, ...) take any https URL.
		'frame-src': ["'self'", 'https:'],
		'worker-src': ["'self'", 'blob:'],
		'manifest-src': ["'self'"],
		'object-src': ["'none'"],
		'base-uri': ["'self'"],
		'form-action': ["'self'"],
		'frame-ancestors': ["'self'"],
	};

	const policy = Object.entries(directives)
		.map(([name, sources]) => `${name} ${sources.join(' ')}`)
		// Browsers ignore upgrade-insecure-requests in a Report-Only policy and warn about it.
		.concat(enforce ? ['upgrade-insecure-requests'] : [])
		.join('; ');

	return {
		[enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only']: policy,
		// Enforced even while the CSP only reports: frame-ancestors does nothing in Report-Only.
		'X-Frame-Options': 'SAMEORIGIN',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Strict-Transport-Security': 'max-age=31536000',
		// The assistant's voice input needs the microphone; nothing uses the rest.
		'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()',
	};
};

/**
 * @param {Record<string, string>} headers
 * @returns {string} The contents of a Netlify `_headers` file applying them to every path.
 */
export const toNetlifyHeaders = (headers) =>
	`/*\n${Object.entries(headers)
		.map(([name, value]) => `  ${name}: ${value}`)
		.join('\n')}\n`;
