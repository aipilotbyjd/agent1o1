import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AlignCenter, AlignLeft, AlignRight, BookmarkPlus, Copy, CopyPlus, ExternalLink, History, LayoutPanelTop, MessageSquare, Play, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { TPageAlign, TPageBlock, TPageBlockOf, TPageBlockProps, TPageColumnLayout } from '@/types/workflow-page.type';
import { flattenBlocks } from '@/components/workflowPage/pageTree';
import { useWorkflows } from '@/api/modules/workflows';
import {
	useSavePageSection,
	useUpdateWorkflowPage,
	useWorkflowPageSubmissions,
	workflowPageKeys,
} from '@/api/modules/workflow-pages';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirm';
import { humanize } from '@/components/workflowPage/PageBlocks';
import paths from '@/Routes/paths';
import relativeTime from '@/utils/relativeTime.util';
import { BLOCK_CATALOG, WIDTH_OPTIONS } from '../_helper/blockCatalog.helper';
import { findBlock, findPlace, isContainer } from '../_helper/blockTree.helper';
import { copyBlocks } from '../_helper/clipboard.helper';
import CommentsPanel from './CommentsPanel.partial';
import HistoryPanel from './HistoryPanel.partial';
import { selectSelected, usePageBuilderStore, type TBuilderRightTab } from '../_store/pageBuilder.store';
import ListEditor from './ListEditor.partial';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { IssueList } from './IssuesChip.partial';
import { PanelField, PanelSection, PanelSelect, PanelText, Segmented, Toggle, panelInputClass } from './controls.partial';

const ALIGN_OPTIONS: { value: TPageAlign; label: ReactNode; title: string }[] = [
	{ value: 'left', label: <AlignLeft size={13} />, title: 'Left' },
	{ value: 'center', label: <AlignCenter size={13} />, title: 'Centre' },
	{ value: 'right', label: <AlignRight size={13} />, title: 'Right' },
];

type TPropsEditor<T extends keyof TPageBlockProps> = {
	block: TPageBlockOf<T>;
	set: (props: Partial<TPageBlockProps[T]>, coalesce?: string) => void;
};

const FieldInspector = ({ block, set }: TPropsEditor<'field'>) => {
	const { fields, ws, page } = usePageBuilder();
	const blocks = usePageBuilderStore((store) => store.content?.blocks);
	const field = fields.find((item) => item.key === block.props.field_key);
	const used = new Set(
		flattenBlocks(blocks ?? []).flatMap((item) =>
			item.type === 'field' && item.id !== block.id ? [item.props.field_key] : [],
		),
	);
	const variants: { value: TPageBlockProps['field']['variant']; label: string }[] = !field
		? []
		: field.type === 'boolean'
			? [
					{ value: 'checkbox', label: 'Checkbox' },
					{ value: 'switch', label: 'Switch' },
				]
			: field.type === 'select'
				? [
						{ value: 'dropdown', label: 'Dropdown' },
						{ value: 'radio', label: 'Choices' },
					]
				: field.type === 'string' || field.type === 'text'
					? [
							{ value: 'input', label: 'One line' },
							{ value: 'textarea', label: 'Paragraph' },
						]
					: [];

	return (
		<>
			<PanelSection title='Workflow input'>
				<PanelSelect
					label='Fills in'
					value={block.props.field_key}
					placeholder='Choose an input…'
					onChange={(value) => set({ field_key: value })}
					options={fields.map((item) => ({
						value: item.key,
						label: `${item.label || item.key}${used.has(item.key) ? ' (already on the page)' : ''}`,
						disabled: used.has(item.key),
					}))}
				/>
				{field && (
					<div className='flex flex-wrap gap-1.5 text-[10px] font-semibold'>
						<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
							{field.type}
						</span>
						<span
							className={`rounded-full px-2 py-0.5 ${
								field.required
									? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
									: 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'
							}`}>
							{field.required ? 'Required' : 'Optional'}
						</span>
						{field.default != null && field.default !== '' && (
							<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'>
								Default: {String(field.default)}
							</span>
						)}
					</div>
				)}
				<Link
					to={paths.editPlaybook(ws, page.workflow_id)}
					target='_blank'
					className='text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline'>
					Change inputs in the workflow <ExternalLink size={11} />
				</Link>
			</PanelSection>
			<PanelSection title='On the page'>
				<PanelText
					label='Label'
					value={block.props.label}
					placeholder={field?.label || field?.key || 'Label'}
					onChange={(value) => set({ label: value }, 'label')}
				/>
				{field?.type !== 'boolean' && (
					<PanelText
						label='Placeholder'
						value={block.props.placeholder}
						placeholder='Shown inside the empty field'
						onChange={(value) => set({ placeholder: value }, 'placeholder')}
					/>
				)}
				<PanelText
					label='Help text'
					multiline
					rows={2}
					value={block.props.help}
					placeholder={field?.help || 'A hint under the field'}
					onChange={(value) => set({ help: value }, 'help')}
				/>
				{variants.length > 0 && (
					<Segmented
						label='Style'
						value={block.props.variant === 'auto' ? variants[0].value : block.props.variant}
						onChange={(value) => set({ variant: value })}
						options={variants}
					/>
				)}
			</PanelSection>
		</>
	);
};

const OutputInspector = ({ block, set }: TPropsEditor<'output'>) => {
	const { outputs } = usePageBuilder();
	return (
		<>
			<PanelSection title='Workflow output'>
				<PanelSelect
					label='Shows'
					value={block.props.output_name}
					placeholder='Choose an output…'
					onChange={(value) => set({ output_name: value })}
					options={outputs.map(({ name }) => ({ value: name, label: `${humanize(name)} (${name})` }))}
					hint='Only the outputs on the page are ever sent to the people using it.'
				/>
			</PanelSection>
			<PanelSection title='On the page'>
				<PanelText
					label='Title'
					value={block.props.label}
					placeholder={block.props.output_name ? humanize(block.props.output_name) : 'Output'}
					onChange={(value) => set({ label: value }, 'label')}
				/>
				<PanelSelect
					label='Show as'
					value={block.props.display}
					onChange={(value) => set({ display: value as TPageBlockProps['output']['display'] })}
					options={[
						{ value: 'auto', label: 'Automatic' },
						{ value: 'text', label: 'Plain text' },
						{ value: 'markdown', label: 'Formatted text (Markdown)' },
						{ value: 'table', label: 'Table' },
						{ value: 'json', label: 'JSON' },
						{ value: 'image', label: 'Image' },
						{ value: 'link', label: 'Link' },
					]}
				/>
				<PanelText
					label='Before it runs'
					value={block.props.empty_text}
					placeholder='The result will appear here.'
					onChange={(value) => set({ empty_text: value }, 'empty')}
				/>
				<Toggle label='Copy button' checked={block.props.copyable} onChange={(value) => set({ copyable: value })} />
			</PanelSection>
		</>
	);
};

const toLocalInput = (iso: string | null) => {
	if (!iso) return '';
	const date = new Date(iso);
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
};

const LAYOUTS: { value: TPageColumnLayout; parts: number[] }[] = [
	{ value: '1-1', parts: [1, 1] },
	{ value: '1-2', parts: [1, 2] },
	{ value: '2-1', parts: [2, 1] },
	{ value: '1-1-1', parts: [1, 1, 1] },
	{ value: '1-1-1-1', parts: [1, 1, 1, 1] },
];

const ColumnsInspector = ({ block, set }: TPropsEditor<'columns'>) => {
	const setColumnsLayout = usePageBuilderStore((store) => store.setColumnsLayout);
	return (
		<PanelSection title='Columns'>
			<PanelField label='Layout'>
				<div className='grid grid-cols-5 gap-1.5' role='radiogroup' aria-label='Column layout'>
					{LAYOUTS.map((layout) => (
						<button
							key={layout.value}
							type='button'
							role='radio'
							aria-checked={block.props.layout === layout.value}
							aria-label={layout.value.split('-').join(' : ')}
							title={layout.value.split('-').join(' : ')}
							onClick={() => setColumnsLayout(block.id, layout.value)}
							className={`flex h-9 gap-0.5 rounded-lg border p-1 transition ${
								block.props.layout === layout.value
									? 'border-primary-500 bg-primary-50 dark:bg-primary-400/10'
									: 'border-zinc-200 hover:border-zinc-300 dark:border-white/10'
							}`}>
							{layout.parts.map((part, i) => (
								<span
									key={i}
									style={{ flex: part }}
									className={`rounded-sm ${block.props.layout === layout.value ? 'bg-primary-400' : 'bg-zinc-300 dark:bg-zinc-600'}`}
								/>
							))}
						</button>
					))}
				</div>
			</PanelField>
			<p className='text-[10px] leading-snug text-zinc-400 dark:text-zinc-500'>
				Fewer columns move the blocks of removed ones into the last column. Columns stack on phones.
			</p>
			<Segmented
				label='Space between'
				value={block.props.gap}
				onChange={(gap) => set({ gap })}
				options={[
					{ value: 'sm', label: 'S' },
					{ value: 'md', label: 'M' },
					{ value: 'lg', label: 'L' },
				]}
			/>
			<Segmented
				label='Line up'
				value={block.props.valign}
				onChange={(valign) => set({ valign })}
				options={[
					{ value: 'top', label: 'Top' },
					{ value: 'center', label: 'Middle' },
				]}
			/>
		</PanelSection>
	);
};

const ColumnInspector = ({ block, set }: TPropsEditor<'column'>) => {
	const parentId = usePageBuilderStore((store) =>
		store.content ? (findPlace(store.content.blocks, block.id)?.parent?.id ?? null) : null,
	);
	const select = usePageBuilderStore((store) => store.select);
	return (
		<PanelSection title='Column'>
			<Segmented
				label='Background'
				value={block.props.background}
				onChange={(background) => set({ background })}
				options={[
					{ value: 'none', label: 'None' },
					{ value: 'subtle', label: 'Soft' },
				]}
			/>
			{parentId && (
				<button
					type='button'
					onClick={() => select(parentId)}
					className='text-primary-700 dark:text-primary-400 text-[11px] font-semibold hover:underline'>
					Change the number of columns
				</button>
			)}
		</PanelSection>
	);
};

const PropsInspector = ({ block, set }: { block: TPageBlock; set: (props: Record<string, unknown>, coalesce?: string) => void }) => {
	switch (block.type) {
		case 'heading':
			return (
				<PanelSection title='Heading'>
					<PanelText label='Text' value={block.props.text} onChange={(text) => set({ text }, 'text')} />
					<Segmented
						label='Size'
						value={block.props.level}
						onChange={(level) => set({ level })}
						options={[
							{ value: 1, label: 'Title' },
							{ value: 2, label: 'Section' },
							{ value: 3, label: 'Small' },
						]}
					/>
					<Segmented label='Align' value={block.props.align} onChange={(align) => set({ align })} options={ALIGN_OPTIONS} />
				</PanelSection>
			);
		case 'text':
			return (
				<PanelSection title='Text'>
					<PanelText
						label='Text'
						multiline
						rows={8}
						value={block.props.markdown}
						hint='Markdown works: **bold**, _italic_, [links](https://…), lists.'
						onChange={(markdown) => set({ markdown }, 'markdown')}
					/>
					<Segmented label='Align' value={block.props.align} onChange={(align) => set({ align })} options={ALIGN_OPTIONS} />
				</PanelSection>
			);
		case 'image':
			return (
				<PanelSection title='Image'>
					<PanelText
						label='Image link'
						type='url'
						value={block.props.url}
						placeholder='https://…'
						hint='A public https link to a picture.'
						onChange={(url) => set({ url: url || null }, 'url')}
					/>
					<PanelText
						label='Description'
						value={block.props.alt}
						placeholder='What the image shows'
						hint='Read out by screen readers.'
						onChange={(alt) => set({ alt }, 'alt')}
					/>
					<Segmented
						label='Height'
						value={block.props.height}
						onChange={(height) => set({ height })}
						options={[
							{ value: 'sm', label: 'S' },
							{ value: 'md', label: 'M' },
							{ value: 'lg', label: 'L' },
							{ value: 'auto', label: 'Auto' },
						]}
					/>
					<Segmented
						label='Fit'
						value={block.props.fit}
						onChange={(fit) => set({ fit })}
						options={[
							{ value: 'cover', label: 'Fill' },
							{ value: 'contain', label: 'Fit' },
						]}
					/>
				</PanelSection>
			);
		case 'callout':
			return (
				<PanelSection title='Callout'>
					<Segmented
						label='Tone'
						value={block.props.tone}
						onChange={(tone) => set({ tone })}
						options={[
							{ value: 'info', label: 'Info' },
							{ value: 'success', label: 'Tip' },
							{ value: 'warning', label: 'Warn' },
							{ value: 'danger', label: 'Alert' },
						]}
					/>
					<PanelText label='Title' value={block.props.title} placeholder='Optional' onChange={(title) => set({ title }, 'title')} />
					<PanelText
						label='Text'
						multiline
						value={block.props.markdown}
						onChange={(markdown) => set({ markdown }, 'markdown')}
					/>
				</PanelSection>
			);
		case 'divider':
			return (
				<PanelSection title='Divider'>
					<Segmented
						label='Line'
						value={block.props.style}
						onChange={(style) => set({ style })}
						options={[
							{ value: 'solid', label: 'Solid' },
							{ value: 'dashed', label: 'Dashed' },
						]}
					/>
				</PanelSection>
			);
		case 'spacer':
			return (
				<PanelSection title='Spacer'>
					<Segmented
						label='Size'
						value={block.props.size}
						onChange={(size) => set({ size })}
						options={[
							{ value: 'sm', label: 'S' },
							{ value: 'md', label: 'M' },
							{ value: 'lg', label: 'L' },
							{ value: 'xl', label: 'XL' },
						]}
					/>
				</PanelSection>
			);
		case 'submit':
			return (
				<PanelSection title='Run button'>
					<PanelText label='Label' value={block.props.label} onChange={(label) => set({ label }, 'label')} />
					<PanelText
						label='While running'
						value={block.props.running_label}
						onChange={(running_label) => set({ running_label }, 'running')}
					/>
					<Segmented
						label='Position'
						value={block.props.align}
						onChange={(align) => set({ align })}
						options={[
							{ value: 'left', label: 'Left' },
							{ value: 'center', label: 'Centre' },
							{ value: 'right', label: 'Right' },
							{ value: 'stretch', label: 'Full' },
						]}
					/>
				</PanelSection>
			);
		case 'status':
			return (
				<PanelSection title='Run status'>
					<Toggle
						label='Progress bar'
						hint='How many steps have finished while it runs.'
						checked={block.props.show_progress}
						onChange={(show_progress) => set({ show_progress })}
					/>
					<PanelText
						label='Before it runs'
						value={block.props.idle_text}
						placeholder='Fill in the form and press Run.'
						onChange={(idle_text) => set({ idle_text }, 'idle')}
					/>
				</PanelSection>
			);
		case 'button':
			return (
				<PanelSection title='Button'>
					<PanelText label='Label' value={block.props.label} onChange={(label) => set({ label }, 'label')} />
					<PanelText
						label='Link'
						type='url'
						value={block.props.url}
						placeholder='https://…'
						hint='Where the button goes. Hidden on the live page until set.'
						onChange={(url) => set({ url: url || null }, 'url')}
					/>
					<Segmented
						label='Style'
						value={block.props.style}
						onChange={(style) => set({ style })}
						options={[
							{ value: 'solid', label: 'Solid' },
							{ value: 'outline', label: 'Outline' },
							{ value: 'ghost', label: 'Text' },
						]}
					/>
					<Segmented
						label='Position'
						value={block.props.align}
						onChange={(align) => set({ align })}
						options={[
							{ value: 'left', label: 'Left' },
							{ value: 'center', label: 'Centre' },
							{ value: 'right', label: 'Right' },
							{ value: 'stretch', label: 'Full' },
						]}
					/>
					<Toggle label='Open in a new tab' checked={block.props.new_tab} onChange={(new_tab) => set({ new_tab })} />
				</PanelSection>
			);
		case 'video':
			return (
				<PanelSection title='Video'>
					<PanelText
						label='Video link'
						type='url'
						value={block.props.url}
						placeholder='https://youtube.com/watch?v=…'
						hint='YouTube, Vimeo and Loom links play on the page, and so do .mp4 and .webm files.'
						onChange={(url) => set({ url: url || null }, 'url')}
					/>
					<PanelText label='Caption' value={block.props.caption} placeholder='Optional' onChange={(caption) => set({ caption }, 'caption')} />
				</PanelSection>
			);
		case 'faq':
			return (
				<PanelSection title='Questions'>
					<ListEditor
						items={block.props.items}
						onChange={(items) => set({ items }, 'items')}
						create={() => ({ question: '', answer: '' })}
						max={30}
						addLabel='Add a question'
						title={(item, i) => item.question || `Question ${i + 1}`}>
						{(item, update) => (
							<>
								<PanelText label='Question' value={item.question} onChange={(question) => update({ question })} />
								<PanelText label='Answer' multiline rows={3} value={item.answer} hint='Markdown works.' onChange={(answer) => update({ answer })} />
							</>
						)}
					</ListEditor>
					<Toggle label='Open the first one' checked={block.props.open_first} onChange={(open_first) => set({ open_first })} />
				</PanelSection>
			);
		case 'testimonial':
			return (
				<PanelSection title='Testimonial'>
					<PanelText label='Quote' multiline rows={4} value={block.props.quote} onChange={(quote) => set({ quote }, 'quote')} />
					<PanelText label='Name' value={block.props.author} placeholder='Who said it' onChange={(author) => set({ author }, 'author')} />
					<PanelText label='Role' value={block.props.role} placeholder='Job title, company' onChange={(role) => set({ role }, 'role')} />
					<PanelText
						label='Photo'
						type='url'
						value={block.props.avatar_url}
						placeholder='https://…'
						hint='Their initial shows when there’s no photo.'
						onChange={(avatar_url) => set({ avatar_url: avatar_url || null }, 'avatar')}
					/>
					<Segmented
						label='Stars'
						value={block.props.rating}
						onChange={(rating) => set({ rating })}
						options={[0, 1, 2, 3, 4, 5].map((value) => ({ value, label: value === 0 ? 'None' : String(value) }))}
					/>
				</PanelSection>
			);
		case 'stats':
			return (
				<PanelSection title='Numbers'>
					<ListEditor
						items={block.props.items}
						onChange={(items) => set({ items }, 'items')}
						create={() => ({ value: '', label: '' })}
						max={6}
						addLabel='Add a number'
						title={(item, i) => item.value || `Number ${i + 1}`}>
						{(item, update) => (
							<div className='grid grid-cols-[5rem_1fr] gap-2'>
								<PanelText label='Value' value={item.value} placeholder='98%' onChange={(value) => update({ value })} />
								<PanelText label='Label' value={item.label} placeholder='Happy users' onChange={(label) => update({ label })} />
							</div>
						)}
					</ListEditor>
					<Segmented
						label='Align'
						value={block.props.align}
						onChange={(align) => set({ align })}
						options={[
							{ value: 'center', label: 'Centre' },
							{ value: 'left', label: 'Left' },
						]}
					/>
				</PanelSection>
			);
		case 'logos':
			return (
				<PanelSection title='Logos'>
					<PanelText label='Title' value={block.props.title} placeholder='Optional' onChange={(title) => set({ title }, 'title')} />
					<ListEditor
						items={block.props.items}
						onChange={(items) => set({ items }, 'items')}
						create={() => ({ url: '', alt: null })}
						max={12}
						addLabel='Add a logo'
						title={(item, i) => item.alt || `Logo ${i + 1}`}>
						{(item, update) => (
							<>
								<PanelText label='Image link' type='url' value={item.url} placeholder='https://…/logo.svg' onChange={(url) => update({ url })} />
								<PanelText label='Company' value={item.alt} placeholder='Read out by screen readers' onChange={(alt) => update({ alt })} />
							</>
						)}
					</ListEditor>
					<Toggle label='Greyscale until hovered' checked={block.props.grayscale} onChange={(grayscale) => set({ grayscale })} />
				</PanelSection>
			);
		case 'tabs':
			return (
				<PanelSection title='Tabs'>
					<ListEditor
						items={block.props.items}
						onChange={(items) => set({ items }, 'items')}
						create={() => ({ label: '', markdown: '' })}
						max={8}
						addLabel='Add a tab'
						title={(item, i) => item.label || `Tab ${i + 1}`}>
						{(item, update) => (
							<>
								<PanelText label='Name' value={item.label} onChange={(label) => update({ label })} />
								<PanelText label='Text' multiline rows={4} value={item.markdown} hint='Markdown works.' onChange={(markdown) => update({ markdown })} />
							</>
						)}
					</ListEditor>
				</PanelSection>
			);
		case 'countdown':
			return (
				<PanelSection title='Countdown'>
					<PanelField label='Counts down to' htmlFor={`countdown-${block.id}`} hint='In your time zone. Visitors see the time left wherever they are.'>
						<input
							id={`countdown-${block.id}`}
							type='datetime-local'
							value={toLocalInput(block.props.target)}
							onChange={(e) => set({ target: e.target.value ? new Date(e.target.value).toISOString() : null })}
							className={panelInputClass}
						/>
					</PanelField>
					<PanelText label='Label' value={block.props.label} placeholder='Starts in' onChange={(label) => set({ label }, 'label')} />
					<PanelText
						label='When it’s over'
						value={block.props.ended_text}
						placeholder='It’s started!'
						onChange={(ended_text) => set({ ended_text }, 'ended')}
					/>
					<Toggle label='Show seconds' checked={block.props.show_seconds} onChange={(show_seconds) => set({ show_seconds })} />
				</PanelSection>
			);
		case 'section':
			return (
				<PanelSection title='Section'>
					<Segmented
						label='Background'
						value={block.props.background}
						onChange={(background) => set({ background })}
						options={[
							{ value: 'none', label: 'None' },
							{ value: 'subtle', label: 'Soft' },
							{ value: 'accent', label: 'Tint' },
							{ value: 'dark', label: 'Dark' },
							{ value: 'image', label: 'Photo' },
						]}
					/>
					{block.props.background === 'image' && (
						<PanelText
							label='Background image'
							type='url'
							value={block.props.image_url}
							placeholder='https://…'
							hint='Darkened so the text on it stays readable.'
							onChange={(image_url) => set({ image_url: image_url || null }, 'image')}
						/>
					)}
					<Segmented
						label='Padding'
						value={block.props.padding}
						onChange={(padding) => set({ padding })}
						options={[
							{ value: 'sm', label: 'S' },
							{ value: 'md', label: 'M' },
							{ value: 'lg', label: 'L' },
						]}
					/>
					<Segmented
						label='Headings'
						value={block.props.align}
						onChange={(align) => set({ align })}
						options={[
							{ value: 'left', label: 'As set' },
							{ value: 'center', label: 'Centred' },
						]}
					/>
				</PanelSection>
			);
		case 'columns':
			return <ColumnsInspector block={block} set={set} />;
		case 'column':
			return <ColumnInspector block={block} set={set} />;
		case 'field':
			return <FieldInspector block={block} set={set} />;
		case 'output':
			return <OutputInspector block={block} set={set} />;
	}
};

const SaveToLibrary = ({ block, onDone }: { block: TPageBlock; onDone: () => void }) => {
	const { ws } = usePageBuilder();
	const save = useSavePageSection(ws);
	const [name, setName] = useState(block.type === 'section' ? 'My section' : BLOCK_CATALOG[block.type].label);
	const submit = () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		save.mutate(
			{ name: trimmed, block },
			{
				onSuccess: () => {
					notify.success(`Saved “${trimmed}”. Find it under Saved in the Add tab.`);
					onDone();
				},
			},
		);
	};
	return (
		<div className='space-y-2 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]'>
			<PanelField label='Save to library as' htmlFor='save-section-name' hint='Anyone building pages in this workspace can add it.'>
				<input
					id='save-section-name'
					autoFocus
					value={name}
					maxLength={120}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') submit();
						if (e.key === 'Escape') onDone();
					}}
					className={panelInputClass}
				/>
			</PanelField>
			<div className='flex justify-end gap-2'>
				<button type='button' onClick={onDone} className='h-7 rounded-md px-2.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
					Cancel
				</button>
				<button
					type='button'
					onClick={submit}
					disabled={!name.trim() || save.isPending}
					className='h-7 rounded-md bg-zinc-900 px-3 text-[11px] font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
					Save
				</button>
			</div>
		</div>
	);
};

const BlockInspector = ({ block }: { block: TPageBlock }) => {
	const { page } = usePageBuilder();
	const updateBlock = usePageBuilderStore((store) => store.updateBlock);
	const duplicateBlock = usePageBuilderStore((store) => store.duplicateBlock);
	const removeBlock = usePageBuilderStore((store) => store.removeBlock);
	const meta = BLOCK_CATALOG[block.type];
	const Icon = meta.icon;
	const issues = page.issues.filter((issue) => issue.block_id === block.id);
	const inColumn = usePageBuilderStore((store) =>
		store.content ? findPlace(store.content.blocks, block.id)?.parent?.type === 'column' : false,
	);
	const isColumn = block.type === 'column';
	const [saving, setSaving] = useState(false);

	return (
		<>
			<div className='flex items-center gap-2.5 border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<span className='bg-primary-100 text-primary-800 dark:bg-primary-400/15 dark:text-primary-300 flex size-8 items-center justify-center rounded-lg'>
					<Icon size={15} />
				</span>
				<div className='min-w-0 flex-1'>
					<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>{meta.label}</p>
					<p className='truncate text-[10px] text-zinc-400'>{meta.description}</p>
				</div>
				{!isColumn && (
				<>
				<button
					type='button'
					aria-label='Save to library'
					title='Save to library, to reuse on any page'
					aria-pressed={saving}
					onClick={() => setSaving((open) => !open)}
					className={`rounded-lg p-1.5 transition ${saving ? 'bg-primary-100 text-primary-800 dark:bg-primary-400/15 dark:text-primary-300' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'}`}>
					<BookmarkPlus size={14} />
				</button>
				<button
					type='button'
					aria-label='Duplicate block'
					title='Duplicate (⌘D)'
					onClick={() => duplicateBlock(block.id)}
					className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'>
					<Copy size={14} />
				</button>
				<button
					type='button'
					aria-label='Delete block'
					title='Delete (⌫)'
					onClick={() => removeBlock(block.id)}
					className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10'>
					<Trash2 size={14} />
				</button>
				</>
				)}
			</div>
			{saving && <SaveToLibrary block={block} onDone={() => setSaving(false)} />}
			{issues.length > 0 && (
				<div className='border-b border-zinc-100 bg-rose-50/50 px-2 py-2 dark:border-white/[0.06] dark:bg-rose-500/5'>
					<IssueList issues={issues} />
				</div>
			)}
			<PropsInspector block={block} set={(props, coalesce) => updateBlock(block.id, { props }, coalesce)} />
			{!isContainer(block) && !inColumn && (
			<PanelSection title='Layout'>
				<Segmented
					label='Width'
					value={block.width}
					onChange={(width) => updateBlock(block.id, { width })}
					options={WIDTH_OPTIONS}
				/>
				<p className='text-[10px] leading-snug text-zinc-400 dark:text-zinc-500'>
					Narrow blocks sit side by side on wide screens and stack on phones.
				</p>
			</PanelSection>
			)}
		</>
	);
};

const PagePanel = () => {
	const { ws, page } = usePageBuilder();
	const { confirm } = useConfirm();
	const update = useUpdateWorkflowPage(ws, page.id);
	const { data: workflows } = useWorkflows(ws);
	const [name, setName] = useState(page.name);
	const [description, setDescription] = useState(page.description ?? '');
	const [syncedId, setSyncedId] = useState(page.updated_at);
	if (syncedId !== page.updated_at) {
		setSyncedId(page.updated_at);
		setName(page.name);
		setDescription(page.description ?? '');
	}

	const saveName = () => {
		const trimmed = name.trim();
		if (!trimmed) setName(page.name);
		else if (trimmed !== page.name) update.mutate({ name: trimmed });
	};

	const changeWorkflow = async (workflowId: string) => {
		if (!workflowId || workflowId === page.workflow_id) return;
		const ok = await confirm({
			title: 'Run a different workflow?',
			message:
				'Fields and outputs on this page stay connected by name. Any the new workflow doesn’t have will be flagged for you to fix.',
			confirmText: 'Switch workflow',
			tone: 'primary',
		});
		if (ok) update.mutate({ workflow_id: workflowId });
	};

	return (
		<>
			<PanelSection title='Page'>
				<PanelField label='Name' htmlFor='page-name'>
					<input
						id='page-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={saveName}
						onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
						className={panelInputClass}
					/>
				</PanelField>
				<PanelField label='Description' htmlFor='page-description' hint='For your team. Shown in the pages list.'>
					<textarea
						id='page-description'
						rows={3}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onBlur={() => description !== (page.description ?? '') && update.mutate({ description: description || null })}
						className={`${panelInputClass} resize-y`}
					/>
				</PanelField>
			</PanelSection>
			<PanelSection title='Runs this workflow'>
				<PanelSelect
					label='Workflow'
					value={page.workflow_id}
					onChange={(value) => void changeWorkflow(value)}
					options={[
						...(workflows ?? []).map((workflow) => ({ value: workflow.id, label: workflow.name })),
						...(page.workflow && !(workflows ?? []).some((workflow) => workflow.id === page.workflow_id)
							? [{ value: page.workflow_id, label: page.workflow.name }]
							: []),
					]}
				/>
				{page.workflow && !page.workflow.published && (
					<p className='rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'>
						This workflow isn’t published yet. Publish it so the page can run.
					</p>
				)}
				<Link
					to={paths.editPlaybook(ws, page.workflow_id)}
					target='_blank'
					className='text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline'>
					Open the workflow <ExternalLink size={11} />
				</Link>
			</PanelSection>
			<PanelSection title={page.issues.length ? 'Before you publish' : 'Checks'}>
				{page.issues.length ? (
					<IssueList issues={page.issues} />
				) : (
					<p className='text-[11px] text-emerald-600 dark:text-emerald-400'>Everything’s connected. Ready to publish.</p>
				)}
			</PanelSection>
			<PanelSection>
				<p className='text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500'>
					Click a block on the canvas to edit it. Drag blocks to reorder them, or use ⌥↑ and ⌥↓.
				</p>
			</PanelSection>
		</>
	);
};

const STATUS_DOT: Record<string, string> = {
	completed: 'bg-emerald-500',
	failed: 'bg-rose-500',
	cancelled: 'bg-zinc-400',
	running: 'bg-sky-500 animate-pulse',
	pending: 'bg-sky-500 animate-pulse',
	awaiting_approval: 'bg-amber-500',
	awaiting_callback: 'bg-amber-500',
};

const RunsPanel = () => {
	const { ws, page } = usePageBuilder();
	const qc = useQueryClient();
	const { data: submissions, isLoading, isFetching } = useWorkflowPageSubmissions(ws, page.id);

	return (
		<>
			<div className='flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>Recent runs</p>
				<button
					type='button'
					aria-label='Refresh'
					onClick={() => qc.invalidateQueries({ queryKey: workflowPageKeys.submissions(ws, page.id) })}
					className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]'>
					<RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
				</button>
			</div>
			{isLoading ? (
				<p className='p-4 text-[11px] text-zinc-400'>Loading runs…</p>
			) : !submissions?.length ? (
				<div className='flex flex-col items-center gap-2 px-6 py-10 text-center'>
					<History size={22} className='text-zinc-300 dark:text-zinc-600' />
					<p className='text-xs font-semibold text-zinc-600 dark:text-zinc-300'>No runs yet</p>
					<p className='text-[11px] text-zinc-400'>Runs from this page, including test runs from Preview, show up here.</p>
				</div>
			) : (
				<ul className='divide-y divide-zinc-100 dark:divide-white/[0.06]'>
					{submissions.map((submission) => {
						const status = submission.run?.status ?? 'failed';
						return (
							<li key={submission.id}>
								<Link
									to={submission.run ? paths.trail(ws, submission.run.id) : '#'}
									target='_blank'
									className='flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-white/[0.03]'>
									<span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-zinc-400'}`} />
									<span className='min-w-0 flex-1'>
										<span className='flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
											<span className='truncate'>{submission.user?.name ?? 'Visitor'}</span>
											{submission.is_test && (
												<span className='rounded bg-zinc-100 px-1 text-[9px] font-bold text-zinc-500 uppercase dark:bg-white/[0.06]'>
													Test
												</span>
											)}
										</span>
										<span className='block text-[10px] text-zinc-400'>
											{humanize(status)} · {relativeTime(submission.created_at)}
										</span>
									</span>
									<ExternalLink size={12} className='shrink-0 text-zinc-300' />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</>
	);
};

const TABS: { id: TBuilderRightTab; label: string; icon: typeof History }[] = [
	{ id: 'design', label: 'Design', icon: SlidersHorizontal },
	{ id: 'comments', label: 'Comments', icon: MessageSquare },
	{ id: 'history', label: 'History', icon: History },
	{ id: 'runs', label: 'Runs', icon: Play },
];

/** Several blocks picked at once: what can be done to all of them. */
const SelectionPanel = ({ ids }: { ids: string[] }) => {
	const duplicateBlocks = usePageBuilderStore((store) => store.duplicateBlocks);
	const removeBlocks = usePageBuilderStore((store) => store.removeBlocks);
	const wrapInSection = usePageBuilderStore((store) => store.wrapInSection);
	const updateBlock = usePageBuilderStore((store) => store.updateBlock);
	const blocks = usePageBuilderStore((store) => store.content?.blocks ?? []);
	const onPage = ids.every((id) => {
		const place = findPlace(blocks, id);
		return place?.parent === null && place.siblings[place.index].type !== 'section';
	});
	const resizable = ids.every((id) => {
		const place = findPlace(blocks, id);
		return !!place && place.parent?.type !== 'column' && !isContainer(place.siblings[place.index]);
	});
	const button =
		'flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.04]';

	return (
		<>
			<div className='border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>{ids.length} blocks selected</p>
				<p className='text-[10px] text-zinc-400'>Shift- or ⌘-click blocks to add or remove them.</p>
			</div>
			<PanelSection title='Do to all'>
				<button type='button' className={button} onClick={() => void copyBlocks(ids)}>
					<Copy size={13} /> Copy <span className='ml-auto text-[10px] text-zinc-400'>⌘C</span>
				</button>
				<button type='button' className={button} onClick={() => duplicateBlocks(ids)}>
					<CopyPlus size={13} /> Duplicate <span className='ml-auto text-[10px] text-zinc-400'>⌘D</span>
				</button>
				<button
					type='button'
					className={button}
					disabled={!onPage}
					title={onPage ? undefined : 'Only blocks placed directly on the page can be grouped.'}
					onClick={() => wrapInSection(ids)}>
					<LayoutPanelTop size={13} /> Group in a section <span className='ml-auto text-[10px] text-zinc-400'>⌘G</span>
				</button>
				<button type='button' className={`${button} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`} onClick={() => removeBlocks(ids)}>
					<Trash2 size={13} /> Delete <span className='ml-auto text-[10px] text-zinc-400'>⌫</span>
				</button>
			</PanelSection>
			{resizable && (
				<PanelSection title='Layout'>
					<Segmented
						label='Width'
						value={(() => {
							const widths = new Set(ids.map((id) => findBlock(blocks, id)?.width));
							return widths.size === 1 ? [...widths][0]! : ('' as TPageBlock['width']);
						})()}
						onChange={(width) => ids.forEach((id) => updateBlock(id, { width }))}
						options={WIDTH_OPTIONS}
					/>
				</PanelSection>
			)}
		</>
	);
};

const RightPanel = () => {
	const tab = usePageBuilderStore((store) => store.rightTab);
	const setTab = usePageBuilderStore((store) => store.setRightTab);
	const selected = usePageBuilderStore(selectSelected);
	const selectedIds = usePageBuilderStore((store) => store.selectedIds);

	return (
		<aside className='flex h-full min-h-0 flex-col border-l border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950'>
			<div role='tablist' aria-label='Inspector' className='flex shrink-0 gap-1 border-b border-zinc-200 p-2 dark:border-white/10'>
				{TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type='button'
						role='tab'
						aria-selected={tab === id}
						onClick={() => setTab(id)}
						className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
							tab === id
								? 'bg-zinc-100 text-zinc-900 dark:bg-white/[0.08] dark:text-white'
								: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
						}`}>
						<Icon size={13} />
						{label}
					</button>
				))}
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto'>
				{tab === 'runs' ? (
					<RunsPanel />
				) : tab === 'comments' ? (
					<CommentsPanel />
				) : tab === 'history' ? (
					<HistoryPanel />
				) : selectedIds.length > 1 ? (
					<SelectionPanel ids={selectedIds} />
				) : selected ? (
					<BlockInspector key={selected.id} block={selected} />
				) : (
					<PagePanel />
				)}
			</div>
		</aside>
	);
};

export default RightPanel;
