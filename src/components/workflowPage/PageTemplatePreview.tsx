import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageBlock, TPageContent } from '@/types/workflow-page.type';
import { flattenBlocks } from './pageTree';
import PageRenderer, { type TRenderBlock } from './PageRenderer';
import { PAGE_WIDTH } from './pageTheme';

/** The renderer's horizontal padding around the page, in px. */
const GUTTER = 32;

/**
 * A page template drawn by the real renderer, scaled down to fit its box.
 * Its field slots aren't bound to a workflow yet, so each is shown as a
 * sample input standing in for whichever one it will get.
 */
const PageTemplatePreview = ({
	content,
	fields,
	className = '',
}: {
	content: TPageContent;
	/** The workflow's real inputs, for a page already bound to them. */
	fields?: TWorkflowInterfaceField[];
	className?: string;
}) => {
	const boxRef = useRef<HTMLDivElement>(null);
	const [box, setBox] = useState({ width: 0, height: 0 });
	const pageWidth = PAGE_WIDTH[content.theme.width] + GUTTER;

	useLayoutEffect(() => {
		const box = boxRef.current;
		if (!box) return;
		const observer = new ResizeObserver(([entry]) =>
			setBox({ width: entry.contentRect.width, height: entry.contentRect.height }),
		);
		observer.observe(box);
		return () => observer.disconnect();
	}, []);

	const blocks = useMemo(() => {
		const fieldIds = flattenBlocks(content.blocks)
			.filter((block) => block.type === 'field')
			.map((block) => block.id);
		const sample = (list: TPageBlock[]): TRenderBlock[] =>
			list.map((block): TRenderBlock => {
				if ('children' in block)
					return { ...block, children: sample(block.children) } as TRenderBlock;
				if (block.type !== 'field') return block;
				const real = fields?.find((field) => field.key === block.props.field_key);
				if (real) return { ...block, field: real };
				const n = fieldIds.indexOf(block.id) + 1;
				return {
					...block,
					field: {
						key: block.props.field_key || `input_${n}`,
						label: block.props.label || `Workflow input ${n}`,
						type: 'string',
						help: block.props.help ?? 'Filled in from your workflow’s inputs.',
					},
				};
			});
		return sample(content.blocks);
	}, [content.blocks, fields]);

	const zoom = Math.min(1, box.width / pageWidth);

	return (
		<div ref={boxRef} aria-hidden inert className={`min-h-full overflow-hidden ${className}`}>
			{box.width > 0 && (
				// At least as tall as the box (undoing the zoom), so a short page's
				// background runs to the bottom instead of stopping partway.
				<div
					style={{ width: pageWidth, zoom, minHeight: Math.floor(box.height / zoom) }}
					className='pointer-events-none mx-auto flex flex-col select-none'>
					<PageRenderer
						theme={content.theme}
						blocks={blocks}
						mode='edit'
						className='flex-1 !py-6'
					/>
				</div>
			)}
		</div>
	);
};

export default PageTemplatePreview;
