import { TIcons } from '@/types/icons.type';

export type TPage = {
	id: string;
	to: string;
	text: string;
	icon: TIcons;
	subPages?: Record<string, TPage>;
	parentId?: string;
};
export type TPages = Record<string, TPage>;

/** Every core-app path hangs off the workspace id, so it is composed rather than re-spelled. */
export const WORKSPACE_ROOT = '/:workspaceId';

export const ws = (path?: string) => (path ? `${WORKSPACE_ROOT}/${path}` : WORKSPACE_ROOT);

/** Strips the workspace prefix so a page can be registered as a child route. */
export const relativeToWorkspace = (to: string) => to.replace(`${WORKSPACE_ROOT}/`, '');

/** Strips an arbitrary parent prefix so nested children stay relative. */
export const relativeTo = (parent: string, to: string) => to.replace(`${parent}/`, '');
