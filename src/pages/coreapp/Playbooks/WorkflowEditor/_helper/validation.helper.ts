import { getNodeDefinition } from './nodeCatalog.constants';
import type { TCanvasEdge, TCanvasNode } from '../_types/canvas.type';
import type { TNodeField } from '../_types/node.type';
import type { TApiIssue } from '@/api/core';

export type TValidationIssue = {
	id: string;
	nodeId?: string;
	/** The config field it's about, so the checklist can jump to it. */
	fieldKey?: string;
	message: string;
	severity: 'error' | 'warning';
	/** Publishing is refused until it's fixed; otherwise it's only a suggestion. */
	blocksPublish?: boolean;
};

/**
 * A required field the author still has to fill in: nothing, or blank text,
 * and not fed by a connection from another step (a dynamic input) — the same
 * rule the server applies when publishing. Drafts save without it.
 */
export const isMissingRequiredValue = (
	field: TNodeField,
	value: unknown,
	dynamicInputKeys: string[] = [],
) =>
	!!field.required &&
	!dynamicInputKeys.includes(field.key) &&
	(value === undefined || value === null || (typeof value === 'string' && value.trim() === ''));

export const validateWorkflow = (
	nodes: TCanvasNode[],
	edges: TCanvasEdge[],
): TValidationIssue[] => {
	const issues: TValidationIssue[] = [];
	const nodeIds = new Set(nodes.map((node) => node.id));

	edges.forEach((edge) => {
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
			issues.push({
				id: `edge:${edge.id}`,
				message: 'A connection points to a missing node.',
				severity: 'error',
			});
		}
	});

	nodes.forEach((node) => {
		const def = getNodeDefinition(node.data.defKey, node.data.definition);
		if (!def) {
			issues.push({
				id: `node:${node.id}:definition`,
				nodeId: node.id,
				message: 'Node definition is missing.',
				severity: 'error',
			});
			return;
		}
		def.fields
			.filter((field) =>
				isMissingRequiredValue(
					field,
					node.data.values[field.key],
					node.data.dynamicInputKeys,
				),
			)
			.forEach((field) => {
				issues.push({
					id: `node:${node.id}:${field.key}`,
					nodeId: node.id,
					fieldKey: field.key,
					message: `${field.label} is required.`,
					severity: 'warning',
					blocksPublish: true,
				});
			});
	});

	if (
		!nodes.some(
			(node) =>
				getNodeDefinition(node.data.defKey, node.data.definition)?.category === 'output',
		)
	) {
		issues.push({
			id: 'workflow:output',
			message: 'Add an Output node so the workflow returns a result.',
			severity: 'warning',
		});
	}

	return issues;
};

/**
 * Everything to fix before publishing: what the editor can see for itself,
 * plus what the server refused the last publish for (some rules — a
 * subflow's target, a missing account — only it can check). One entry per
 * step and field, live checks first.
 */
export const issuesToFix = (
	nodes: TCanvasNode[],
	edges: TCanvasEdge[],
	serverIssues: TApiIssue[],
): TValidationIssue[] => {
	const live = validateWorkflow(nodes, edges);
	const nodeIds = new Set(nodes.map((node) => node.id));
	const seen = new Set(live.map((issue) => `${issue.nodeId ?? ''}:${issue.fieldKey ?? ''}`));

	const fromServer = serverIssues
		.filter((issue) => issue.node_key === null || nodeIds.has(issue.node_key))
		.filter((issue) => !seen.has(`${issue.node_key ?? ''}:${issue.field ?? ''}`))
		.map(
			(issue, index): TValidationIssue => ({
				id: `server:${index}:${issue.node_key ?? ''}:${issue.field ?? ''}`,
				nodeId: issue.node_key ?? undefined,
				fieldKey: issue.field ?? undefined,
				message: issue.message,
				severity: 'error',
				blocksPublish: true,
			}),
		);

	return [...live, ...fromServer];
};
