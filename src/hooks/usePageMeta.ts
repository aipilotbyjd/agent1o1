import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router';
import pages, { TPage } from '@/Routes/pages';
import themeConfig from '@/config/theme.config';
import seoConfig from '@/config/seo.config';

type TPageMeta = { path: string; title: string };

const flatten = (page: TPage): TPage[] => [
	page,
	...Object.values(page.subPages ?? {}).flatMap(flatten),
];

/**
 * First match wins, so static top-level paths (`/pricing`, `/workspaces`) come
 * before the `/:workspaceId` tree they would otherwise be swallowed by, and a
 * path already claimed (e.g. the editors' parent `playbooks`) keeps its first title.
 */
const PAGE_META: TPageMeta[] = [
	...Object.values(pages.identity),
	pages.welcome,
	pages.choose,
	pages.settings,
	pages.workspace,
	pages.playbookEditor,
	pages.agentEditor,
]
	.flatMap(flatten)
	.reduce<TPageMeta[]>((list, page) => {
		if (!list.some((item) => item.path === page.to))
			list.push({ path: page.to, title: page.text });
		return list;
	}, []);

const setLink = (rel: string, href: string) => {
	let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
	if (!el) {
		el = document.createElement('link');
		el.rel = rel;
		document.head.appendChild(el);
	}
	el.href = href;
};

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
	let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
	if (!el) {
		el = document.createElement('meta');
		el.setAttribute(attr, key);
		document.head.appendChild(el);
	}
	el.content = content;
};

/**
 * Keeps the document title, canonical URL and share tags in step with the
 * current route, so each page is indexed and shared under its own name and URL
 * rather than the single set baked into `index.html`.
 */
const usePageMeta = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		const page = PAGE_META.find((item) => matchPath(item.path, pathname));
		const title = page
			? `${page.title} | ${themeConfig.projectTitle}`
			: themeConfig.projectTitle;
		const url = `${seoConfig.siteUrl}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;

		document.title = title;
		setLink('canonical', url);
		setMeta('property', 'og:title', title);
		setMeta('property', 'og:url', url);
		setMeta('name', 'twitter:title', title);
	}, [pathname]);
};

export default usePageMeta;
