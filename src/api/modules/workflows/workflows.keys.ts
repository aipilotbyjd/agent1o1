import { createKeys } from '@/api/core';

export const workflowKeys = createKeys('workflows');

export const workflowTrashKey = (ws: string) => [...workflowKeys.all(ws), 'trash'] as const;
