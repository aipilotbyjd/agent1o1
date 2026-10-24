// The link card for a shared page: what WhatsApp, Slack, LinkedIn, X and
// the rest show when the link is pasted. Their crawlers don't run the app,
// so the page's own title, description and image have to be in the HTML.

export type TPageMeta = {
	title: string;
	description: string;
	image_url: string | null;
	theme_color: string;
	site_name: string;
};

const TIMEOUT_MS = 1500;

/** The page's card from the API, or null when it can't be had in time. */
export const fetchPageMeta = async (apiUrl: string, token: string): Promise<TPageMeta | null> => {
	try {
		const response = await fetch(
			`${apiUrl.replace(/\/$/, '')}/p/${encodeURIComponent(token)}/meta`,
			{
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(TIMEOUT_MS),
			},
		);
		if (!response.ok) return null;
		const body = (await response.json()) as { data?: { meta?: TPageMeta } };
		return body.data?.meta ?? null;
	} catch {
		return null;
	}
};

const escape = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

/** Replaces the app's generic title and card tags with the page's own. */
export const injectPageMeta = (html: string, meta: TPageMeta, pageUrl: string) => {
	const fallbackImage = new URL('/logo512.png', pageUrl).toString();
	const image = meta.image_url ?? fallbackImage;
	const tags = [
		`<title>${escape(meta.title)}</title>`,
		`<meta name="description" content="${escape(meta.description)}" />`,
		`<meta name="theme-color" content="${escape(meta.theme_color)}" />`,
		`<link rel="canonical" href="${escape(pageUrl)}" />`,
		`<meta property="og:type" content="website" />`,
		`<meta property="og:site_name" content="${escape(meta.site_name)}" />`,
		`<meta property="og:title" content="${escape(meta.title)}" />`,
		`<meta property="og:description" content="${escape(meta.description)}" />`,
		`<meta property="og:url" content="${escape(pageUrl)}" />`,
		`<meta property="og:image" content="${escape(image)}" />`,
		`<meta property="og:image:alt" content="${escape(meta.title)}" />`,
		`<meta name="twitter:card" content="${meta.image_url ? 'summary_large_image' : 'summary'}" />`,
		`<meta name="twitter:title" content="${escape(meta.title)}" />`,
		`<meta name="twitter:description" content="${escape(meta.description)}" />`,
		`<meta name="twitter:image" content="${escape(image)}" />`,
	].join('\n\t\t');

	return html
		.replace(/<title>[\s\S]*?<\/title>\s*/i, '')
		.replace(
			/<meta\s+(?:name|property)="(?:description|theme-color|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi,
			'',
		)
		.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
		.replace(/<\/head>/i, `\t${tags}\n\t</head>`);
};
