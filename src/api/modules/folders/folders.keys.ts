import type { TFolderType } from '@/types/folder.type';

export const folderKeys = {
	all: (ws: string) => ['folders', ws] as const,
	lists: (ws: string) => ['folders', ws, 'list'] as const,
	/** `type` is part of the identity — the endpoint returns one tree per
	 *  type, defaulting to `workflow` when the param is omitted. */
	list: (ws: string, type: TFolderType = 'workflow') => ['folders', ws, 'list', type] as const,
};
