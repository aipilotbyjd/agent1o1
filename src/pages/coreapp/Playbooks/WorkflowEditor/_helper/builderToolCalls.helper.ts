import {
	CirclePlus,
	FlaskConical,
	GitBranch,
	Link2,
	Pencil,
	Search,
	ShieldCheck,
	Trash2,
	Unlink,
	Wrench,
} from 'lucide-react';
import type { TCanvasNode } from '../_types/canvas.type';

export const prettify = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const nodeLabel = (nodes: TCanvasNode[], id: unknown): string => {
	if (typeof id !== 'string' || !id) return 'node';
	return nodes.find((n) => n.id === id)?.data.label || id;
};

/**
 * Icon + dynamic present-tense caption for a live tool call, built from that
 * call's actual arguments (not a generic per-tool label): Gumloop-style.
 * `toolName` is the builder tool's `name()` (`App\Ai\Tools\WorkflowBuilder\*`).
 */
export const describeToolCall = (
	toolName: string,
	args: Record<string, unknown>,
	nodes: TCanvasNode[],
): { Icon: typeof Search; text: string } => {
	const str = (value: unknown) => (typeof value === 'string' ? value : '');

	switch (toolName) {
		case 'add_node':
			return {
				Icon: CirclePlus,
				text: `Add ${prettify(str(args.type) || 'node')} node${args.key ? ` “${str(args.key)}”` : ''}`,
			};
		case 'update_node':
			return { Icon: Pencil, text: `Update ${nodeLabel(nodes, args.key)}` };
		case 'remove_node':
			return { Icon: Trash2, text: `Remove ${nodeLabel(nodes, args.key)}` };
		case 'connect_nodes': {
			const condition = str(args.condition);
			return {
				Icon: condition ? GitBranch : Link2,
				text: `Connect ${nodeLabel(nodes, args.from)} → ${nodeLabel(nodes, args.to)}${
					condition ? ` (${condition === 'error' ? 'on error' : condition})` : ''
				}`,
			};
		}
		case 'disconnect_nodes':
			return {
				Icon: Unlink,
				text: `Disconnect ${nodeLabel(nodes, args.from)} → ${nodeLabel(nodes, args.to)}`,
			};
		case 'read_draft':
			return { Icon: Search, text: 'Read the current draft' };
		case 'list_available_nodes':
			return { Icon: Search, text: 'Look up available nodes' };
		case 'inspect_node_schema':
			return {
				Icon: Search,
				text: `Check settings for ${prettify(str(args.type) || 'node')}`,
			};
		case 'inspect_node_output':
			return {
				Icon: Search,
				text: `Check what ${args.key ? nodeLabel(nodes, args.key) : prettify(str(args.type) || 'node')} outputs`,
			};
		case 'list_workflows':
			return { Icon: Search, text: 'Look up workflows it can call' };
		case 'list_connected_accounts':
			return { Icon: Search, text: 'Look up connected accounts' };
		case 'validate_workflow':
			return { Icon: ShieldCheck, text: 'Validate the workflow' };
		case 'dry_run_workflow':
			return { Icon: FlaskConical, text: 'Dry-run the workflow' };
		default:
			return { Icon: Wrench, text: prettify(toolName) };
	}
};
