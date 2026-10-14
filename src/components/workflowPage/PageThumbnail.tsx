import type { TPageBlock, TPageContent } from '@/types/workflow-page.type';
import { pageThemeStyle, usePageDark } from './pageTheme';

const SPAN: Record<TPageBlock['width'], string> = {
	full: 'col-span-6',
	two_thirds: 'col-span-4',
	half: 'col-span-3',
	third: 'col-span-2',
};

const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;

const MAX_BLOCKS = 14;

const Bar = ({ className = '' }: { className?: string }) => (
	<span className={`block rounded-full ${className}`} />
);

const Sketch = ({ block }: { block: TPageBlock }) => {
	switch (block.type) {
		case 'heading':
			return (
				<div className={`flex ${JUSTIFY[block.props.align]}`}>
					<Bar
						className={`w-3/5 bg-[var(--pg-text)] ${block.props.level === 1 ? 'h-2' : 'h-1.5'}`}
					/>
				</div>
			);
		case 'text':
			return (
				<div
					className={`flex flex-col gap-1 ${block.props.align === 'center' ? 'items-center' : block.props.align === 'right' ? 'items-end' : ''}`}>
					<Bar className='h-1 w-full bg-[var(--pg-muted)] opacity-40' />
					<Bar className='h-1 w-4/5 bg-[var(--pg-muted)] opacity-40' />
				</div>
			);
		case 'image':
			return (
				<span className='block h-5 rounded-[calc(var(--pg-radius)/3)] bg-[var(--pg-subtle)]' />
			);
		case 'divider':
			return <span className='block border-t border-[var(--pg-border)]' />;
		case 'spacer':
			return <span className='block h-1' />;
		case 'callout':
			return (
				<span className='flex h-3.5 items-center rounded-[calc(var(--pg-radius)/3)] bg-[var(--pg-accent-soft)] px-1.5'>
					<Bar className='h-1 w-1/2 bg-[var(--pg-accent)] opacity-60' />
				</span>
			);
		case 'field':
			return (
				<div className='flex flex-col gap-0.5'>
					<Bar className='h-1 w-1/4 bg-[var(--pg-muted)] opacity-60' />
					<span className='block h-2.5 rounded-[calc(var(--pg-radius)/3)] border border-[var(--pg-border)] bg-[var(--pg-surface)]' />
				</div>
			);
		case 'submit':
			return (
				<div
					className={`flex ${block.props.align === 'stretch' ? '' : JUSTIFY[block.props.align]}`}>
					<span
						className={`block h-2.5 rounded-[calc(var(--pg-radius)/3)] bg-[var(--pg-accent)] ${block.props.align === 'stretch' ? 'w-full' : 'w-1/4'}`}
					/>
				</div>
			);
		case 'output':
			return (
				<span className='flex h-5 flex-col justify-center gap-1 rounded-[calc(var(--pg-radius)/3)] border border-dashed border-[var(--pg-border)] bg-[var(--pg-subtle)] px-1.5'>
					<Bar className='h-1 w-2/3 bg-[var(--pg-muted)] opacity-40' />
					<Bar className='h-1 w-1/3 bg-[var(--pg-muted)] opacity-40' />
				</span>
			);
		case 'status':
			return <Bar className='h-1 w-full bg-[var(--pg-accent-soft)]' />;
		case 'button':
			return (
				<div
					className={`flex ${block.props.align === 'stretch' ? '' : JUSTIFY[block.props.align]}`}>
					<span
						className={`block h-2.5 rounded-[calc(var(--pg-radius)/3)] ${block.props.align === 'stretch' ? 'w-full' : 'w-1/4'} ${
							block.props.style === 'solid'
								? 'bg-[var(--pg-accent)]'
								: 'border border-[var(--pg-accent)]'
						}`}
					/>
				</div>
			);
		case 'video':
			return (
				<span className='block aspect-video rounded-[calc(var(--pg-radius)/3)] bg-zinc-800' />
			);
		case 'faq':
			return (
				<div className='divide-y divide-[var(--pg-border)] rounded-[calc(var(--pg-radius)/3)] border border-[var(--pg-border)]'>
					{[0, 1, 2].map((i) => (
						<div key={i} className='px-1.5 py-1'>
							<Bar className='h-1 w-2/3 bg-[var(--pg-muted)] opacity-50' />
						</div>
					))}
				</div>
			);
		case 'testimonial':
			return (
				<div className='space-y-1 rounded-[calc(var(--pg-radius)/3)] border border-[var(--pg-border)] p-1.5'>
					<Bar className='h-1 w-full bg-[var(--pg-muted)] opacity-40' />
					<Bar className='h-1 w-1/3 bg-[var(--pg-accent)] opacity-60' />
				</div>
			);
		case 'stats':
			return (
				<div className='flex gap-1'>
					{Array.from(
						{ length: Math.max(1, Math.min(block.props.items.length, 4)) },
						(_, i) => (
							<span
								key={i}
								className='flex h-4 flex-1 items-center justify-center rounded-[calc(var(--pg-radius)/3)] bg-[var(--pg-subtle)]'>
								<Bar className='h-1 w-1/2 bg-[var(--pg-accent)]' />
							</span>
						),
					)}
				</div>
			);
		case 'logos':
			return (
				<div className='flex justify-center gap-1.5'>
					{[0, 1, 2, 3].map((i) => (
						<Bar key={i} className='h-1.5 w-4 bg-[var(--pg-muted)] opacity-40' />
					))}
				</div>
			);
		case 'tabs':
			return (
				<div className='space-y-1'>
					<div className='flex gap-1 rounded-[calc(var(--pg-radius)/3)] bg-[var(--pg-subtle)] p-0.5'>
						<Bar className='h-1.5 w-1/4 bg-[var(--pg-surface)]' />
						<Bar className='h-1.5 w-1/4 opacity-0' />
					</div>
					<Bar className='h-1 w-4/5 bg-[var(--pg-muted)] opacity-40' />
				</div>
			);
		case 'countdown':
			return (
				<div className='flex justify-center gap-1'>
					{[0, 1, 2, 3].map((i) => (
						<span
							key={i}
							className='block h-3.5 w-4 rounded-sm bg-[var(--pg-subtle)]'
						/>
					))}
				</div>
			);
		case 'section':
			return (
				<div
					className={`-mx-2 grid grid-cols-6 gap-x-1 gap-y-1.5 px-2 py-2 ${
						block.props.background === 'none'
							? ''
							: block.props.background === 'dark' ||
								  block.props.background === 'image'
								? 'bg-zinc-800'
								: 'bg-[var(--pg-subtle)]'
					}`}>
					{block.children.map((child) => (
						<div key={child.id} className={SPAN[child.width]}>
							<Sketch block={child} />
						</div>
					))}
				</div>
			);
		case 'columns':
			return (
				<div className='flex gap-1.5'>
					{block.children.map((column, i) => (
						<div
							key={column.id}
							className={`min-w-0 ${block.props.layout.split('-')[i] === '2' ? 'flex-[2]' : 'flex-1'}`}>
							<Sketch block={column} />
						</div>
					))}
				</div>
			);
		case 'column':
			return (
				<div className='flex flex-col gap-1.5'>
					{block.children.map((child) => (
						<Sketch key={child.id} block={child} />
					))}
				</div>
			);
	}
};

/**
 * A small sketch of a page's layout, drawn in its own theme — for picking a
 * template, where the real renderer would be too much at this size.
 */
const PageThumbnail = ({
	content,
	className = '',
}: {
	content: TPageContent;
	className?: string;
}) => {
	const dark = usePageDark(content.theme.appearance);
	const narrow = content.theme.width === 'narrow';

	return (
		<div
			aria-hidden
			style={pageThemeStyle(content.theme, dark)}
			className={`relative overflow-hidden px-3 pt-2.5 ${className}`}>
			<div
				className={`mx-auto overflow-hidden rounded-t-[calc(var(--pg-radius)/2)] border border-b-0 border-[var(--pg-border)] bg-[var(--pg-surface)] ${narrow ? 'w-4/5' : content.theme.width === 'wide' ? 'w-full' : 'w-[90%]'}`}>
				{content.theme.cover_url && (
					<img
						src={content.theme.cover_url}
						alt=''
						loading='lazy'
						className='block h-7 w-full object-cover'
					/>
				)}
				<div className='grid grid-cols-6 gap-x-1 gap-y-1.5 p-2'>
					{content.blocks.slice(0, MAX_BLOCKS).map((block) => (
						<div key={block.id} className={SPAN[block.width]}>
							<Sketch block={block} />
						</div>
					))}
				</div>
			</div>
			<span className='pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--pg-surface)] to-transparent' />
		</div>
	);
};

export default PageThumbnail;
