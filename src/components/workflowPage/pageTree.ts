import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageBlock, TPageViewBlock, TPageViewFieldBlock } from '@/types/workflow-page.type';

/** Every block in a page's tree, parents before their children, in reading order. */
export const flattenBlocks = (blocks: TPageBlock[]): TPageBlock[] =>
	blocks.flatMap((block) =>
		'children' in block ? [block, ...flattenBlocks(block.children)] : [block],
	);

/** The interface fields a page's view asks for, wherever their blocks sit. */
export const viewFields = (blocks: TPageViewBlock[]): TWorkflowInterfaceField[] =>
	flattenBlocks(blocks as TPageBlock[]).flatMap((block) =>
		block.type === 'field' && 'field' in block ? [(block as TPageViewFieldBlock).field] : [],
	);
