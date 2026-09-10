import type { Edge, Node } from '@xyflow/react';
import type { TCanvasNodeData } from './node.type';

export type TCanvasPosition = {
	x: number;
	y: number;
};

export type TCanvasNodeType = 'base' | 'input' | 'output' | 'note' | 'trigger';

export type TCanvasNode = Node<TCanvasNodeData, TCanvasNodeType>;

export type TCanvasEdge = Edge<Record<string, unknown>, 'workflow'>;

export type TCanvasSnapshot = {
	nodes: TCanvasNode[];
	edges: TCanvasEdge[];
};
