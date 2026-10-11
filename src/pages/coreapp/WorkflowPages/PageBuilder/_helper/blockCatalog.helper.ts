import {
	Activity,
	Heading,
	Image,
	LogOut,
	Megaphone,
	Minus,
	MoveVertical,
	Play,
	TextCursorInput,
	Type,
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

type TBlockMeta<T extends TPageBlockType> = {
	label: string;
	description: string;
	icon: LucideIcon;
	group: 'workflow' | 'content';
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
): Extract<TPageBlock, { type: T }> =>
	({
		id: newBlockId(),
		type,
		width: 'full',
		props: { ...BLOCK_CATALOG[type].defaults, ...props },
	}) as unknown as Extract<TPageBlock, { type: T }>;

/** Attaches to each field block the interface field it fills in. */
export const resolveBlocks = (blocks: TPageBlock[], fields: TWorkflowInterfaceField[]): TRenderBlock[] =>
	blocks.map((block) =>
		block.type === 'field'
			? { ...block, field: fields.find((field) => field.key === block.props.field_key) }
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
	}
};
