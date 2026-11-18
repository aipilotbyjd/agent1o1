import { createKeys } from '@/api/core';

export const workflowTemplateKeys = createKeys('workflow-templates');
export const agentTemplateKeys = createKeys('agent-templates');
export const pageTemplateKeys = createKeys('page-templates');
export const templateCollectionKeys = createKeys('template-collections');

export const templateCatalogKeys = {
	all: (ws: string) => ['template-catalog', ws] as const,
	list: (ws: string, params: object) => ['template-catalog', ws, 'list', params] as const,
};
