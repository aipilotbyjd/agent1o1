import { CATEGORY_META } from './builder.constants';
import { NODE_CATALOG } from './nodeCatalog.constants';

export const NODE_GROUPS = Object.keys(CATEGORY_META).map((category) => ({
	category: category as keyof typeof CATEGORY_META,
	meta: CATEGORY_META[category as keyof typeof CATEGORY_META],
	nodes: NODE_CATALOG.filter((node) => node.category === category),
}));
