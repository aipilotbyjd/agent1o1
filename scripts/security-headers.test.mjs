import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSecurityHeaders, toNetlifyHeaders } from './security-headers.mjs';

const production = {
	VITE_API_URL: 'https://api.example.com/api/v1',
	VITE_REVERB_APP_KEY: 'key',
	VITE_REVERB_HOST: 'ws.example.com',
	VITE_REVERB_PORT: '443',
	VITE_REVERB_SCHEME: 'https',
	VITE_POSTHOG_PROJECT_TOKEN: 'phc_token',
	VITE_POSTHOG_HOST: 'https://eu.i.posthog.com',
	VITE_SENTRY_DSN: 'https://public@app.glitchtip.com/42',
};

/** @param {Record<string, string>} headers */
const directives = (headers) => {
	const policy =
		headers['Content-Security-Policy'] ?? headers['Content-Security-Policy-Report-Only'];
	return Object.fromEntries(
		policy.split('; ').map((directive) => {
			const [name, ...sources] = directive.split(' ');
			return [name, sources];
		}),
	);
};

test('the CSP only reports until CSP_MODE=enforce', () => {
	const reporting = buildSecurityHeaders(production);
	assert.ok(reporting['Content-Security-Policy-Report-Only']);
	assert.equal(reporting['Content-Security-Policy'], undefined);
	assert.equal(directives(reporting)['upgrade-insecure-requests'], undefined);

	const enforcing = buildSecurityHeaders({ ...production, CSP_MODE: 'enforce' });
	assert.ok(enforcing['Content-Security-Policy']);
	assert.equal(enforcing['Content-Security-Policy-Report-Only'], undefined);
	assert.deepEqual(directives(enforcing)['upgrade-insecure-requests'], []);
});

test('connect-src allows exactly the configured API, Reverb, PostHog and GlitchTip hosts', () => {
	assert.deepEqual(directives(buildSecurityHeaders(production))['connect-src'], [
		"'self'",
		'https://api.example.com',
		'wss://ws.example.com',
		'https://eu.i.posthog.com',
		'https://eu-assets.i.posthog.com',
		'https://app.glitchtip.com',
	]);
});

test('scripts load only from the app itself and PostHog', () => {
	assert.deepEqual(directives(buildSecurityHeaders(production))['script-src'], [
		"'self'",
		'https://eu.i.posthog.com',
		'https://eu-assets.i.posthog.com',
	]);
});

test('services that are switched off are left out', () => {
	const csp = directives(buildSecurityHeaders({ VITE_API_URL: production.VITE_API_URL }));
	assert.deepEqual(csp['connect-src'], ["'self'", 'https://api.example.com']);
	assert.deepEqual(csp['script-src'], ["'self'"]);
});

test('Reverb defaults to the API host and keeps a non-standard port', () => {
	const csp = directives(
		buildSecurityHeaders({
			VITE_API_URL: 'https://api.example.com/api/v1',
			VITE_REVERB_APP_KEY: 'key',
			VITE_REVERB_PORT: '8080',
		}),
	);
	assert.ok(csp['connect-src'].includes('wss://api.example.com:8080'));
});

test('a PostHog reverse proxy is allowed as a single host', () => {
	const csp = directives(
		buildSecurityHeaders({
			VITE_POSTHOG_PROJECT_TOKEN: 'phc_token',
			VITE_POSTHOG_HOST: 'https://e.example.com',
		}),
	);
	assert.deepEqual(csp['script-src'], ["'self'", 'https://e.example.com']);
});

test('the app cannot be framed by other sites and plugins are blocked', () => {
	const headers = buildSecurityHeaders(production);
	assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
	assert.deepEqual(directives(headers)['frame-ancestors'], ["'self'"]);
	assert.deepEqual(directives(headers)['object-src'], ["'none'"]);
});

test('the _headers file applies every header to every path', () => {
	assert.equal(
		toNetlifyHeaders({ 'X-Frame-Options': 'SAMEORIGIN', 'X-Content-Type-Options': 'nosniff' }),
		'/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n',
	);
});
