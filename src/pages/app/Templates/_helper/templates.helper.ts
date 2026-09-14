// ============================================================
// Template helpers
// ------------------------------------------------------------
// A workflow template ships its `graph` but no "required
// credentials" list. The node catalog does carry, per node type,
// the category it belongs to and whether it needs a connector —
// and a node's category slug is the connector key (see
// ConnectorSeeder). So the connectors a template needs are derived
// from its graph against the catalog rather than read off a field
// the API does not return.
// ============================================================
import type { TBuiltinNode, TNode } from '@/types/node.type';

type TGraphNode = { type?: unknown };

const isBuiltin = (node: TNode): node is TBuiltinNode => 'requires_connector' in node;

export const requiredConnectorsForGraph = (
	graph: { nodes?: unknown[] } | null | undefined,
	catalog: TNode[] | undefined,
): string[] => {
	if (!graph?.nodes?.length || !catalog?.length) return [];

	const connectorByType = new Map<string, string>();
	for (const node of catalog) {
		if (isBuiltin(node) && node.requires_connector && node.category) {
			connectorByType.set(node.type, node.category);
		} else if (!isBuiltin(node) && node.credential_type) {
			connectorByType.set(node.type, node.credential_type);
		}
	}

	const connectors = new Set<string>();
	for (const raw of graph.nodes) {
		const type = (raw as TGraphNode)?.type;
		if (typeof type !== 'string') continue;
		const connector = connectorByType.get(type);
		if (connector) connectors.add(connector);
	}

	return [...connectors];
};
