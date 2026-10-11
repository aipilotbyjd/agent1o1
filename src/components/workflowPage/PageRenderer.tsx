import type { ReactNode } from 'react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageBlock, TPageTheme } from '@/types/workflow-page.type';
import {
	CalloutBlock,
	DividerBlock,
	FieldBlock,
	HeadingBlock,
	ImageBlock,
	OutputBlock,
	SpacerBlock,
	StatusBlock,
	SubmitBlock,
	TextBlock,
	type TPageMode,
} from './PageBlocks';
import { PAGE_BLOCK_SPAN, PAGE_WIDTH, pageThemeStyle, usePageDark } from './pageTheme';
import type { TPageRun } from './usePageRun';

/** A block as the renderer takes it: a field may carry the interface field
 *  it fills in, and has none when that input no longer exists. */
export type TRenderBlock = TPageBlock & { field?: TWorkflowInterfaceField };

type Props = {
	theme: TPageTheme;
	blocks: TRenderBlock[];
	mode: TPageMode;
	run?: TPageRun;
	/** Edit mode: wraps each drawn block, for selection and dragging. */
	wrapBlock?: (block: TRenderBlock, content: ReactNode) => ReactNode;
	/** Shown in the card when there are no blocks. */
	empty?: ReactNode;
	/** Appended inside the grid, after the last block (the builder's drop zone). */
	after?: ReactNode;
	workspaceName?: string | null;
	/** Grow to fill the container rather than sizing to the content. */
	fill?: boolean;
	/** Set when the page renders dark regardless of its own setting. */
	forceDark?: boolean;
	className?: string;
};

const renderBlock = (block: TRenderBlock, mode: TPageMode, run?: TPageRun) => {
	switch (block.type) {
		case 'heading':
			return <HeadingBlock block={block} mode={mode} />;
		case 'text':
			return <TextBlock block={block} mode={mode} />;
		case 'image':
			return <ImageBlock block={block} mode={mode} />;
		case 'divider':
			return <DividerBlock block={block} />;
		case 'spacer':
			return <SpacerBlock block={block} mode={mode} />;
		case 'callout':
			return <CalloutBlock block={block} mode={mode} />;
		case 'field':
			return <FieldBlock block={block} field={block.field} mode={mode} run={run} />;
		case 'submit':
			return <SubmitBlock block={block} mode={mode} run={run} />;
		case 'output':
			return <OutputBlock block={block} mode={mode} run={run} />;
		case 'status':
			return <StatusBlock block={block} run={run} />;
	}
};

/**
 * Draws a workflow page — the one renderer behind the builder's canvas, the
 * page a member opens in the app and the page at its public link, so what
 * the builder shows is what people get.
 */
const PageRenderer = ({
	theme,
	blocks,
	mode,
	run,
	wrapBlock,
	empty,
	after,
	workspaceName,
	fill,
	forceDark,
	className,
}: Props) => {
	const systemDark = usePageDark(theme.appearance);
	const dark = forceDark ?? systemDark;

	const grid = (
		<div className='grid grid-cols-6 gap-x-4 gap-y-5'>
			{blocks.map((block) => {
				const content = renderBlock(block, mode, run);
				return (
					<div key={block.id} className={`${PAGE_BLOCK_SPAN[block.width]} min-w-0`}>
						{wrapBlock ? wrapBlock(block, content) : content}
					</div>
				);
			})}
			{after}
		</div>
	);

	return (
		<div
			style={pageThemeStyle(theme, dark)}
			className={`w-full px-4 py-8 sm:py-12 ${fill ? 'min-h-full' : ''} ${className ?? ''}`}>
			<div className='mx-auto w-full' style={{ maxWidth: PAGE_WIDTH[theme.width] }}>
				{theme.logo_url && (
					<img src={theme.logo_url} alt='' className='mb-5 h-10 max-w-[200px] object-contain' />
				)}
				<div className='@container overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]'>
					{theme.cover_url && (
						<img src={theme.cover_url} alt='' className='h-[180px] w-full object-cover' />
					)}
					<div className='p-5 @lg:p-8'>
						{blocks.length === 0 && empty ? (
							<>
								{empty}
								{after}
							</>
						) : mode === 'live' && run ? (
							<form
								noValidate
								onSubmit={(event) => {
									event.preventDefault();
									run.submit();
								}}>
								{grid}
							</form>
						) : (
							grid
						)}
					</div>
				</div>
				{theme.show_branding && (
					<p className='mt-6 text-center text-xs text-[var(--pg-muted)]'>
						{workspaceName ? `${workspaceName} · ` : ''}Made with{' '}
						<span className='font-bold text-[var(--pg-text)]'>Agent1o1</span>
					</p>
				)}
			</div>
		</div>
	);
};

export default PageRenderer;
