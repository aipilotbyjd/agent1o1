import type { TFolderType } from '@/types/folder.type';

export const folderKeys = {
	all: (ws: string) => ['folders', ws] as const,
	lists: (ws: string) => ['folders', ws, 'list'] as const,
	list: (ws: string, type: TFolderType = 'workflow') => ['folders', ws, 'list', type] as const,
};
