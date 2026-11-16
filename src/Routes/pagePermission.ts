import { matchRoutes } from 'react-router';
import pages, { TPage } from '@/Routes/pages';

const flattenPage = (page: TPage): TPage[] => [
	page,
	...Object.values(page.subPages ?? {}).flatMap(flattenPage),
];

/** Everything under `/:workspaceId`, which is where the permission gate sits. */
const workspaceScopedPages = [
	pages.workspace,
	pages.playbookEditor,
	pages.agentEditor,
	pages.pageEditor,
	pages.settings,
].flatMap(flattenPage);

/** Every page is a candidate, so a specific URL like `playbooks/new` is never read as `playbooks/:workflowId`. */
const pageRoutes = workspaceScopedPages.map((page) => ({ id: page.id, path: page.to }));

/** The page definition the URL belongs to, if any. */
export const findPageByPathname = (pathname: string): TPage | undefined => {
	const [match] = matchRoutes(pageRoutes, pathname) ?? [];
	return match && workspaceScopedPages.find((page) => page.id === match.route.id);
};
