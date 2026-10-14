import {
	Activity,
	AppWindow,
	ChartColumn,
	CircleHelp,
	Columns2,
	Heading,
	Image,
	LayoutPanelTop,
	Link2,
	LogOut,
	Megaphone,
	Minus,
	MoveVertical,
	Play,
	Quote,
	RectangleVertical,
	Shapes,
	TextCursorInput,
	Timer,
	Type,
	Video,
	type LucideIcon,
} from 'lucide-react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type {
	TPageBlock,
	TPageBlockProps,
	TPageBlockType,
	TPageBlockWidth,
} from '@/types/workflow-page.type';
import type { TRenderBlock } from '@/components/workflowPage/PageRenderer';
import { humanize } from '@/components/workflowPage/PageBlocks';
import { columnCount, isContainer } from './blockTree.helper';

type TBlockMeta<T extends TPageBlockType> = {
	label: string;
	description: string;
	icon: LucideIcon;
	group: 'workflow' | 'content' | 'layout';
	/** Matches what `PageSchema::normalize()` fills in on the server. */
	defaults: TPageBlockProps[T];
};

export const BLOCK_CATALOG: { [T in TPageBlockType]: TBlockMeta<T> } = {
	field: {
		label: 'Input field',
		description: 'Asks for one of the workflow’s inputs',
		icon: TextCursorInput,
		group: 'workflow',
		defaults: { field_key: '', label: null, placeholder: null, help: null, variant: 'auto' },
	},
	submit: {
		label: 'Run button',
		description: 'Starts the workflow with the form',
		icon: Play,
		group: 'workflow',
		defaults: { label: 'Run', running_label: 'Running…', align: 'left' },
	},
	output: {
		label: 'Output',
		description: 'Shows a value the workflow returns',
		icon: LogOut,
		group: 'workflow',
		defaults: { output_name: '', label: null, display: 'auto', empty_text: null, copyable: true },
	},
	status: {
		label: 'Run status',
		description: 'Progress while it runs, then done or failed',
		icon: Activity,
		group: 'workflow',
		defaults: { show_progress: true, idle_text: null },
	},
	heading: {
		label: 'Heading',
		description: 'A title or section heading',
		icon: Heading,
		group: 'content',
		defaults: { text: 'Heading', level: 2, align: 'left' },
	},
	text: {
		label: 'Text',
		description: 'A paragraph, with Markdown',
		icon: Type,
		group: 'content',
		defaults: { markdown: 'Explain what this page does and what people get back.', align: 'left' },
	},
	image: {
		label: 'Image',
		description: 'A picture from a link',
		icon: Image,
		group: 'content',
		defaults: { url: null, alt: null, fit: 'cover', height: 'md' },
	},
	callout: {
		label: 'Callout',
		description: 'A highlighted note or warning',
		icon: Megaphone,
		group: 'content',
		defaults: { tone: 'info', title: null, markdown: 'Something people should know before they run this.' },
	},
	divider: {
		label: 'Divider',
		description: 'A line between sections',
		icon: Minus,
		group: 'content',
		defaults: { style: 'solid' },
	},
	spacer: {
		label: 'Spacer',
		description: 'Empty room between blocks',
		icon: MoveVertical,
		group: 'content',
		defaults: { size: 'md' },
	},
	button: {
		label: 'Button',
		description: 'A link to another page or site',
		icon: Link2,
		group: 'content',
		defaults: { label: 'Learn more', url: null, style: 'solid', align: 'left', new_tab: true },
	},
	video: {
		label: 'Video',
		description: 'YouTube, Vimeo, Loom or a video file',
		icon: Video,
		group: 'content',
		defaults: { url: null, caption: null },
	},
	faq: {
		label: 'FAQ',
		description: 'Questions that open to show the answer',
		icon: CircleHelp,
		group: 'content',
		defaults: {
			items: [
				{ question: 'How long does it take?', answer: 'Usually under a minute.' },
				{ question: 'Is my data stored?', answer: 'Only what’s needed to give you your result.' },
			],
			open_first: true,
		},
	},
	testimonial: {
		label: 'Testimonial',
		description: 'A quote from a happy customer',
		icon: Quote,
		group: 'content',
		defaults: { quote: 'This saved our team hours every week.', author: 'Alex Morgan', role: 'Operations lead', avatar_url: null, rating: 5 },
	},
	stats: {
		label: 'Stats',
		description: 'Big numbers with a label',
		icon: ChartColumn,
		group: 'content',
		defaults: {
			items: [
				{ value: '10k+', label: 'Runs a month' },
				{ value: '98%', label: 'Happy users' },
				{ value: '30s', label: 'Average result' },
			],
			align: 'center',
		},
	},
	logos: {
		label: 'Logo strip',
		description: 'Logos of customers or partners',
		icon: Shapes,
		group: 'content',
		defaults: { title: 'Trusted by teams at', items: [], grayscale: true },
	},
	tabs: {
		label: 'Tabs',
		description: 'Switch between short sections of text',
		icon: AppWindow,
		group: 'content',
		defaults: {
			items: [
				{ label: 'Overview', markdown: 'What this page does, in a sentence or two.' },
				{ label: 'Details', markdown: 'Anything people should know before they start.' },
			],
		},
	},
	countdown: {
		label: 'Countdown',
		description: 'Time left until a date',
		icon: Timer,
		group: 'content',
		defaults: { target: null, label: 'Starts in', ended_text: null, show_seconds: true },
	},
	section: {
		label: 'Section',
		description: 'A band with its own background',
		icon: LayoutPanelTop,
		group: 'layout',
		defaults: { background: 'subtle', image_url: null, padding: 'md', align: 'left' },
	},
	columns: {
		label: 'Columns',
		description: 'Blocks side by side',
		icon: Columns2,
		group: 'layout',
		defaults: { layout: '1-1', gap: 'md', valign: 'top' },
	},
	column: {
		label: 'Column',
		description: 'One column of a Columns block',
		icon: RectangleVertical,
		group: 'layout',
		defaults: { background: 'none' },
	},
};

export const WIDTH_OPTIONS: { value: TPageBlockWidth; label: string }[] = [
	{ value: 'full', label: 'Full' },
	{ value: 'two_thirds', label: '2/3' },
	{ value: 'half', label: '1/2' },
	{ value: 'third', label: '1/3' },
];

export const newBlockId = () =>
	`b_${Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => (byte % 36).toString(36)).join('')}`;

export const createBlock = <T extends TPageBlockType>(
	type: T,
	props: Partial<TPageBlockProps[T]> = {},
): Extract<TPageBlock, { type: T }> => {
	const merged = structuredClone({ ...BLOCK_CATALOG[type].defaults, ...props }) as TPageBlockProps[T];
	const children =
		type === 'columns'
			? Array.from({ length: columnCount((merged as TPageBlockProps['columns']).layout) }, () => createBlock('column'))
			: type === 'section' || type === 'column'
				? []
				: undefined;
	return {
		id: newBlockId(),
		type,
		width: 'full',
		props: merged,
		...(children ? { children } : {}),
	} as unknown as Extract<TPageBlock, { type: T }>;
};

/** Attaches to each field block, at any depth, the interface field it fills in. */
export const resolveBlocks = (blocks: TPageBlock[], fields: TWorkflowInterfaceField[]): TRenderBlock[] =>
	blocks.map((block) =>
		isContainer(block)
			? ({ ...block, children: resolveBlocks(block.children, fields) } as TRenderBlock)
			: block.type === 'field'
				? { ...block, field: fields.find((field) => field.key === block.props.field_key) }
				: block,
	);

/** The blocks without fields whose input the workflow no longer has. */
export const withoutUnboundFields = (blocks: TRenderBlock[]): TRenderBlock[] =>
	blocks
		.filter((block) => block.type !== 'field' || block.field)
		.map((block) =>
			isContainer(block)
				? ({ ...block, children: withoutUnboundFields(block.children as TRenderBlock[]) } as TRenderBlock)
				: block,
		);

/** One line saying what a block holds, for the layers list. */
export const blockSummary = (block: TPageBlock, fields: TWorkflowInterfaceField[]): string => {
	switch (block.type) {
		case 'heading':
			return block.props.text || 'Empty heading';
		case 'text':
			return block.props.markdown.replace(/[#*_`>]/g, '').slice(0, 60) || 'Empty text';
		case 'callout':
			return block.props.title || block.props.markdown.slice(0, 60) || 'Empty callout';
		case 'image':
			return block.props.alt || (block.props.url ? 'Image' : 'No image yet');
		case 'field': {
			const field = fields.find((item) => item.key === block.props.field_key);
			return block.props.label || field?.label || block.props.field_key || 'Not connected';
		}
		case 'submit':
			return block.props.label;
		case 'output':
			return block.props.label || (block.props.output_name ? humanize(block.props.output_name) : 'Not connected');
		case 'status':
			return 'Progress and result';
		case 'divider':
			return block.props.style === 'dashed' ? 'Dashed line' : 'Line';
		case 'spacer':
			return `${block.props.size.toUpperCase()} space`;
		case 'button':
			return block.props.label;
		case 'video':
			return block.props.caption || (block.props.url ? 'Video' : 'No video yet');
		case 'faq':
			return `${block.props.items.length} question${block.props.items.length === 1 ? '' : 's'}`;
		case 'testimonial':
			return block.props.author || block.props.quote.slice(0, 60) || 'Empty quote';
		case 'stats':
			return block.props.items.map((item) => item.value).join(' · ') || 'No numbers yet';
		case 'logos':
			return `${block.props.items.length} logo${block.props.items.length === 1 ? '' : 's'}`;
		case 'tabs':
			return block.props.items.map((item) => item.label).join(' · ') || 'No tabs yet';
		case 'countdown':
			return block.props.target ? new Date(block.props.target).toLocaleString() : 'No date yet';
		case 'section':
			return `${block.children.length} block${block.children.length === 1 ? '' : 's'}`;
		case 'columns':
			return `${block.props.layout.split('-').length} columns`;
		case 'column':
			return `${block.children.length} block${block.children.length === 1 ? '' : 's'}`;
	}
};
