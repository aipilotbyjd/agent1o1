import { fetchPageMeta, injectPageMeta } from './lib/page-meta.ts';

declare const Netlify: { env: { get: (name: string) => string | undefined } };

type TContext = { next: () => Promise<Response> };

/**
 * Serves a shared page's HTML with its own link card in the head, so a
 * pasted `/p/{token}` link previews as that page rather than as the app.
 * Anything that goes wrong leaves the response as it was.
 */
const pageMeta = async (request: Request, context: TContext) => {
	const response = await context.next();
	const token = new URL(request.url).pathname.split('/')[2];
	const apiUrl = Netlify.env.get('VITE_API_URL');

	if (!token || !apiUrl || !response.headers.get('content-type')?.includes('text/html')) {
		return response;
	}

	const meta = await fetchPageMeta(apiUrl, token);
	if (!meta) return response;

	const headers = new Headers(response.headers);
	headers.delete('content-length');

	return new Response(injectPageMeta(await response.text(), meta, request.url), {
		status: response.status,
		headers,
	});
};

export default pageMeta;

export const config = { path: '/p/*' };
