import { createKeys } from '@/api/core';

export const agentKeys = createKeys('agents');

export const agentTrashKey = (ws: string) => [...agentKeys.all(ws), 'trash'] as const;
