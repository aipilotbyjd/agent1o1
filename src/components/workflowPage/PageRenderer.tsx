import { createContext, useContext } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type {
	TPageBlock,
	TPageBlockOf,
	TPageColumnLayout,
	TPageTheme,
} from '@/types/workflow-page.type';
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
import {
	ButtonBlock,
	CountdownBlock,
	FaqBlock,
	FeaturesBlock,
	LogosBlock,
	StatsBlock,
	StepsBlock,
	TabsBlock,
	TestimonialBlock,
	VideoBlock,
} from './PageContentBlocks';
import {
	CodeBlock,
	CompareBlock,
	EmbedBlock,
	GalleryBlock,
	PricingBlock,
	ProgressBlock,
	SocialBlock,
	TimelineBlock,
} from './PageMoreBlocks';
import { DARK, PAGE_BLOCK_SPAN, PAGE_WIDTH, pageThemeStyle, usePageDark, usePageFonts } from './pageTheme';
import type { TPageRun } from './usePageRun';

/** A block as the renderer takes it: a field may carry the interface field
 *  it fills in, and has none when that input no longer exists. */
export type TRenderBlock = TPageBlock & { field?: TWorkflowInterfaceField };

type TContainer = TPageBlockOf<'section'> | TPageBlockOf<'column'>;

type Props = {
	theme: TPageTheme;
	blocks: TRenderBlock[];
	mode: TPageMode;
	run?: TPageRun;
	/** Edit mode: wraps each drawn block, at any depth, for selection and dragging. */
	wrapBlock?: (block: TRenderBlock, content: ReactNode) => ReactNode;
	/** Shown in the card when there are no blocks. */
	empty?: ReactNode;
	/** Appended inside the grid, after the last block (the builder's drop zone). */
	after?: ReactNode;
	/** Appended inside a section or column, after its blocks (the builder's drop zones). */
	containerEnd?: (container: TContainer) => ReactNode;
	workspaceName?: string | null;
	/** Public page: where the "Made with Agent1o1" badge links (signup with the creator's referral code). */
	brandingUrl?: string | null;
	onBrandingClick?: () => void;
	/** Grow to fill the container rather than sizing to the content. */
	fill?: boolean;
	/** Set when the page renders dark regardless of its own setting. */
	forceDark?: boolean;
	className?: string;
};

type TTreeContext = Pick<Props, 'mode' | 'run' | 'wrapBlock' | 'containerEnd'>;

const TreeContext = createContext<TTreeContext>({ mode: 'live' });

const SECTION_PADDING = { sm: 'py-6', md: 'py-10', lg: 'py-16' } as const;

/** Spans in a 12-column grid, so halves, thirds and quarters all divide evenly. */
const COLUMN_SPANS: Record<TPageColumnLayout, string[]> = {
	'1-1': ['@xl:col-span-6', '@xl:col-span-6'],
	'1-2': ['@xl:col-span-4', '@xl:col-span-8'],
	'2-1': ['@xl:col-span-8', '@xl:col-span-4'],
	'1-1-1': ['@xl:col-span-4', '@xl:col-span-4', '@xl:col-span-4'],
	'1-1-1-1': [
		'@xl:col-span-6 @3xl:col-span-3',
		'@xl:col-span-6 @3xl:col-span-3',
		'@xl:col-span-6 @3xl:col-span-3',
		'@xl:col-span-6 @3xl:col-span-3',
	],
};

const COLUMN_GAP = { sm: 'gap-3', md: 'gap-6', lg: 'gap-10' } as const;

const sectionStyle = (
	block: TPageBlockOf<'section'>,
): { className: string; style?: CSSProperties } => {
	const { background, image_url: image } = block.props;
	switch (background) {
		case 'subtle':
			return { className: 'bg-[var(--pg-subtle)]' };
		case 'accent':
			return {
				className: '',
				style: {
					backgroundColor: 'color-mix(in srgb, var(--pg-accent) 10%, var(--pg-surface))',
				},
			};
		case 'dark':
			return {
				className: 'text-[var(--pg-text)]',
				style: { ...DARK, backgroundColor: '#0b0b0f' } as CSSProperties,
			};
		case 'image':
			return {
				className: 'bg-cover bg-center text-[var(--pg-text)]',
				style: {
					...DARK,
					backgroundColor: '#0b0b0f',
					backgroundImage: image
						? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url("${image.replace(/"/g, '%22')}")`
						: undefined,
				} as CSSProperties,
			};
		default:
			return { className: '' };
	}
};

const Leaf = ({ block }: { block: TRenderBlock }) => {
	const { mode, run } = useContext(TreeContext);
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
		case 'button':
			return <ButtonBlock block={block} mode={mode} />;
		case 'video':
			return <VideoBlock block={block} mode={mode} />;
		case 'faq':
			return <FaqBlock block={block} mode={mode} />;
		case 'testimonial':
			return <TestimonialBlock block={block} mode={mode} />;
		case 'stats':
			return <StatsBlock block={block} mode={mode} />;
		case 'logos':
			return <LogosBlock block={block} mode={mode} />;
		case 'tabs':
			return <TabsBlock block={block} mode={mode} />;
		case 'countdown':
			return <CountdownBlock block={block} mode={mode} />;
		case 'steps':
			return <StepsBlock block={block} mode={mode} />;
		case 'features':
			return <FeaturesBlock block={block} mode={mode} />;
		case 'code':
			return <CodeBlock block={block} mode={mode} />;
		case 'pricing':
			return <PricingBlock block={block} mode={mode} />;
		case 'embed':
			return <EmbedBlock block={block} mode={mode} />;
		case 'gallery':
			return <GalleryBlock block={block} mode={mode} />;
		case 'compare':
			return <CompareBlock block={block} mode={mode} />;
		case 'progress':
			return <ProgressBlock block={block} mode={mode} />;
		case 'social':
			return <SocialBlock block={block} mode={mode} />;
		case 'timeline':
			return <TimelineBlock block={block} mode={mode} />;
		case 'field':
			return <FieldBlock block={block} field={block.field} mode={mode} run={run} />;
		case 'submit':
			return <SubmitBlock block={block} mode={mode} run={run} />;
		case 'output':
			return <OutputBlock block={block} mode={mode} run={run} />;
		case 'status':
			return <StatusBlock block={block} run={run} />;
		case 'section':
			return <Section block={block} />;
		case 'columns':
			return <Columns block={block} />;
		case 'column':
			return <Column block={block} />;
	}
};

/** A block wrapped for the builder when it asks for that. */
const Node = ({ block }: { block: TRenderBlock }) => {
	const { wrapBlock } = useContext(TreeContext);
	const content = <Leaf block={block} />;
	return <>{wrapBlock ? wrapBlock(block, content) : content}</>;
};

const SPACE_ABOVE = { none: '', sm: 'mt-3', md: 'mt-6', lg: 'mt-10' } as const;
const MOBILE_SPACE_ABOVE = {
	none: '@max-xl:mt-0',
	sm: '@max-xl:mt-3',
	md: '@max-xl:mt-6',
	lg: '@max-xl:mt-10',
} as const;
const MOBILE_ALIGN = {
	left: '@max-xl:text-left @max-xl:[&_h1]:text-left @max-xl:[&_h2]:text-left @max-xl:[&_h3]:text-left @max-xl:[&>.flex]:justify-start',
	center:
		'@max-xl:text-center @max-xl:[&_h1]:text-center @max-xl:[&_h2]:text-center @max-xl:[&_h3]:text-center @max-xl:[&>.flex]:justify-center',
	right:
		'@max-xl:text-right @max-xl:[&_h1]:text-right @max-xl:[&_h2]:text-right @max-xl:[&_h3]:text-right @max-xl:[&>.flex]:justify-end',
} as const;

/**
 * What a block's display settings add to the cell it sits in: spacing above
 * it, alignment on narrow screens, and the screens it shows on. In the
 * builder a block hidden on the current screen is dimmed rather than gone,
 * so it can still be picked.
 */
export const displayClasses = (block: TPageBlock, mode: TPageMode): string => {
	const hidden =
		block.visibility === 'desktop'
			? mode === 'edit'
				? '@max-xl:opacity-30'
				: '@max-xl:hidden'
			: block.visibility === 'mobile'
				? mode === 'edit'
					? '@xl:opacity-30'
					: '@xl:hidden'
				: '';
	return [
		SPACE_ABOVE[block.space_above ?? 'none'],
		block.mobile_space_above ? MOBILE_SPACE_ABOVE[block.mobile_space_above] : '',
		block.mobile_align ? MOBILE_ALIGN[block.mobile_align] : '',
		hidden,
	]
		.filter(Boolean)
		.join(' ');
};

/** Blocks laid out on the page's six-column grid, narrow ones side by side. */
const Grid = ({ blocks, children }: { blocks: TPageBlock[]; children?: ReactNode }) => {
	const { mode } = useContext(TreeContext);
	return (
		<div className='grid grid-cols-6 gap-x-4 gap-y-5'>
			{blocks.map((block) => (
				<div
					key={block.id}
					className={`${PAGE_BLOCK_SPAN[block.width]} min-w-0 ${displayClasses(block, mode)}`}>
					<Node block={block} />
				</div>
			))}
			{children}
		</div>
	);
};

const Section = ({ block }: { block: TPageBlockOf<'section'> }) => {
	const { containerEnd } = useContext(TreeContext);
	const { className, style } = sectionStyle(block);
	return (
		<section
			style={style}
			className={`-mx-5 px-5 @lg:-mx-8 @lg:px-8 ${SECTION_PADDING[block.props.padding]} ${className} ${
				block.props.align === 'center'
					? '[&_h1]:text-center [&_h2]:text-center [&_h3]:text-center'
					: ''
			}`}>
			<Grid blocks={block.children}>
				{containerEnd && <div className='col-span-6'>{containerEnd(block)}</div>}
			</Grid>
		</section>
	);
};

const Columns = ({ block }: { block: TPageBlockOf<'columns'> }) => {
	const spans = COLUMN_SPANS[block.props.layout];
	return (
		<div
			className={`grid grid-cols-1 @xl:grid-cols-12 ${COLUMN_GAP[block.props.gap]} ${
				block.props.valign === 'center' ? 'items-center' : 'items-start'
			}`}>
			{block.children.map((column, index) => (
				<div key={column.id} className={`${spans[index] ?? ''} min-w-0`}>
					<Node block={column} />
				</div>
			))}
		</div>
	);
};

const Column = ({ block }: { block: TPageBlockOf<'column'> }) => {
	const { containerEnd, mode } = useContext(TreeContext);
	return (
		<div
			className={`flex min-h-full flex-col gap-5 ${
				block.props.background === 'subtle'
					? 'rounded-[var(--pg-radius)] bg-[var(--pg-subtle)] p-4'
					: ''
			}`}>
			{block.children.map((child) => (
				<div key={child.id} className={`min-w-0 ${displayClasses(child, mode)}`}>
					<Node block={child} />
				</div>
			))}
			{containerEnd?.(block)}
		</div>
	);
};

/**
 * Draws a workflow page: the one renderer behind the builder's canvas, the
 * page a member opens in the app and the page at its public link, so what
 * the builder shows is what people get.
 */
/**
 * The "Made with Agent1o1" pill: pinned to the bottom-right corner of the
 * viewport on a live page, so it stays in view while scrolling. Elsewhere
 * (the builder, template previews) it sticks to the bottom of the preview
 * instead of covering the app around it.
 */
const MadeWithBadge = ({
	url,
	onClick,
	floating,
}: {
	url?: string | null;
	onClick?: () => void;
	floating: boolean;
}) => {
	const position = floating
		? 'fixed bottom-4 right-4 z-50'
		: 'sticky bottom-3 ml-auto mt-6 w-fit';
	const classes = `${position} group flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900/90 py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-neutral-900`;
	const content = (
		<>
			<img
				src='/a-logo-light-256.png'
				alt=''
				className='size-6 rounded-full bg-white object-contain p-0.5'
			/>
			<span>
				Made with <span className='font-bold'>Agent1o1</span>
			</span>
		</>
	);

	return url ? (
		<a
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			onClick={onClick}
			title='Build your own free with Agent1o1'
			className={classes}>
			{content}
		</a>
	) : (
		<div className={classes}>{content}</div>
	);
};

const PageRenderer = ({
	theme,
	blocks,
	mode,
	run,
	wrapBlock,
	empty,
	after,
	containerEnd,
	brandingUrl,
	onBrandingClick,
	fill,
	forceDark,
	className,
}: Props) => {
	const systemDark = usePageDark(theme.appearance);
	const dark = forceDark ?? systemDark;
	usePageFonts(theme.font);

	const grid = (
		<TreeContext.Provider value={{ mode, run, wrapBlock, containerEnd }}>
			<Grid blocks={blocks}>{after}</Grid>
		</TreeContext.Provider>
	);

	return (
		<div
			style={pageThemeStyle(theme, dark)}
			className={`w-full px-4 py-8 sm:py-12 ${fill ? 'min-h-full' : ''} ${className ?? ''}`}>
			<div className='mx-auto w-full' style={{ maxWidth: PAGE_WIDTH[theme.width] }}>
				{theme.logo_url && (
					<img
						src={theme.logo_url}
						alt=''
						className='mb-5 h-10 max-w-[200px] object-contain'
					/>
				)}
				<div className='@container overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]'>
					{theme.cover_url && (
						<img
							src={theme.cover_url}
							alt=''
							className='h-[180px] w-full object-cover'
						/>
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
			</div>
			{theme.show_branding && (
				<MadeWithBadge
					url={brandingUrl}
					onClick={onBrandingClick}
					floating={mode === 'live'}
				/>
			)}
		</div>
	);
};

export default PageRenderer;
