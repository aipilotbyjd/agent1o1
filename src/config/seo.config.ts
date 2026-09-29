/**
 * Public origin of the deployed app, without a trailing slash. Used for the
 * canonical URL and `og:url`. The static files in `public/` (robots.txt,
 * sitemap.xml) and the absolute image URLs in `index.html` spell the same
 * origin out - update them together.
 */
const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://agent1o1.app').replace(/\/+$/, '');

const seoConfig = {
	siteUrl,
};

export default seoConfig;
