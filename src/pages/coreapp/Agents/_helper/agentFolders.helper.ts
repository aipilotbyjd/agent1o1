import type { TFolder } from '@/types/folder.type';

/** `'all'` = no folder filter, `'none'` = agents not in any folder. */
export type TAgentFolderFilter = 'all' | 'none' | string;

export const FOLDER_COLORS = ['#4f46e5', '#0EA5E9', '#10A37F', '#F59E0B', '#EC4899', '#EF4444', '#64748B'];

/** Root folders plus their one eager-loaded level of children, as one flat list. */
export const flattenFolders = (folders: TFolder[] | undefined) =>
	(folders ?? []).flatMap((f) => [
		{ ...f, label: f.name },
		...(f.children ?? []).map((c) => ({ ...c, label: `${f.name} / ${c.name}` })),
	]);

export type TFlatFolder = ReturnType<typeof flattenFolders>[number];
