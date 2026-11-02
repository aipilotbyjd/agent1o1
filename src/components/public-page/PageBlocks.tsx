import { CSSProperties, FC, ReactNode, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import classNames from 'classnames';
import type { TPageBlock, TPageField, TPageSubmission, TPageTheme } from '@/types/public-page.type';

// ============================================================
// Page Blocks
// ------------------------------------------------------------
// Renders a public workflow page's block tree. Self-contained
// styling (plain Tailwind plus the page's accent colour) rather
// than the app's themed components: the page wears its owner's
// theme, not ours.
// ============================================================

export type TPageFormState = {
	values: Record<string, unknown>;
	errors: Record<string, string>;
	setValue: (key: string, value: unknown) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	submission: TPageSubmission | null;
	submitError: string | null;
};

type TContext = {
	theme: TPageTheme;
	isDark: boolean;
	form: TPageFormState;
};

const RADIUS: Record<TPageTheme['radius'], string> = {
	none: 'rounded-none',
	sm: 'rounded',
	md: 'rounded-md',
	lg: 'rounded-lg',
	xl: 'rounded-2xl',
};

const ALIGN: Record<string, string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right',
};

const JUSTIFY: Record<string, string> = {
	left: 'justify-start',
	center: 'justify-center',
	right: 'justify-end',
	stretch: 'justify-stretch',
};

const SPACER: Record<string, string> = { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' };

const PADDING: Record<string, string> = { sm: 'p-4', md: 'p-8', lg: 'p-12' };

const GAP: Record<string, string> = { sm: 'gap-3', md: 'gap-6', lg: 'gap-10' };

const IMAGE_HEIGHT: Record<string, string> = {
	sm: 'h-40',
	md: 'h-64',
	lg: 'h-96',
	auto: 'h-auto',
};

const CALLOUT_TONE: Record<string, string> = {
	info: 'border-blue-500/40 bg-blue-500/10',
	success: 'border-emerald-500/40 bg-emerald-500/10',
	warning: 'border-amber-500/40 bg-amber-500/10',
	danger: 'border-red-500/40 bg-red-500/10',
};

const Markdown: FC<{ children: string; className?: string }> = ({ children, className }) => (
	<div
		className={classNames(
			'space-y-3 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-500/10 [&_code]:px-1 [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6',
			className,
		)}>
		<ReactMarkdown>{children}</ReactMarkdown>
	</div>
);

const inputClass = (ctx: TContext, hasError: boolean) =>
	classNames(
		'w-full border px-3 py-2 text-sm outline-none transition focus:ring-2',
		RADIUS[ctx.theme.radius],
		ctx.isDark
			? 'border-white/15 bg-white/5 text-white placeholder:text-zinc-500'
			: 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400',
		{ 'border-red-500!': hasError },
	);

const accentRing = (ctx: TContext): CSSProperties =>
	({ '--tw-ring-color': `${ctx.theme.accent}55` }) as CSSProperties;

// ─── Fields ──────────────────────────────────────────────────

const FieldControl: FC<{ block: TPageBlock; field: TPageField; ctx: TContext }> = ({
	block,
	field,
	ctx,
}) => {
	const { values, errors, setValue } = ctx.form;
	const id = `field-${block.id}`;
	const value = values[field.key];
	const error = errors[field.key];
	const variant: string = block.props.variant ?? 'auto';
	const placeholder: string | undefined = block.props.placeholder ?? undefined;
	const disabled = ctx.form.isSubmitting;

	if (field.type === 'boolean' || variant === 'checkbox' || variant === 'switch') {
		return (
			<label htmlFor={id} className='inline-flex cursor-pointer items-center gap-2 text-sm'>
				<input
					id={id}
					type='checkbox'
					className='h-4 w-4'
					style={{ accentColor: ctx.theme.accent }}
					checked={value === true}
					disabled={disabled}
					onChange={(e) => setValue(field.key, e.target.checked)}
				/>
				<span>{block.props.label ?? field.label}</span>
			</label>
		);
	}

	if (field.type === 'select' && variant === 'radio') {
		return (
			<div role='radiogroup' aria-labelledby={`${id}-label`} className='flex flex-col gap-2'>
				{field.options.map((option) => (
					<label key={option.value} className='inline-flex items-center gap-2 text-sm'>
						<input
							type='radio'
							name={id}
							value={option.value}
							style={{ accentColor: ctx.theme.accent }}
							checked={value === option.value}
							disabled={disabled}
							onChange={() => setValue(field.key, option.value)}
						/>
						{option.label}
					</label>
				))}
			</div>
		);
	}

	if (field.type === 'select') {
		return (
			<select
				id={id}
				className={inputClass(ctx, !!error)}
				style={accentRing(ctx)}
				value={(value as string) ?? ''}
				disabled={disabled}
				onChange={(e) => setValue(field.key, e.target.value || null)}>
				<option value=''>{placeholder ?? 'Choose…'}</option>
				{field.options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		);
	}

	const multiline =
		variant === 'textarea' ||
		(variant === 'auto' && (field.type === 'text' || field.type === 'json'));

	if (multiline) {
		return (
			<textarea
				id={id}
				rows={field.type === 'json' ? 6 : 4}
				className={classNames(inputClass(ctx, !!error), {
					'font-mono': field.type === 'json',
				})}
				style={accentRing(ctx)}
				placeholder={placeholder}
				value={(value as string) ?? ''}
				disabled={disabled}
				onChange={(e) => setValue(field.key, e.target.value)}
			/>
		);
	}

	return (
		<input
			id={id}
			type={field.type === 'number' ? 'number' : 'text'}
			className={inputClass(ctx, !!error)}
			style={accentRing(ctx)}
			placeholder={placeholder}
			value={(value as string | number | undefined) ?? ''}
			disabled={disabled}
			onChange={(e) => setValue(field.key, e.target.value)}
		/>
	);
};

const FieldBlock: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const field = block.field;
	if (!field) return null;

	const isCheckbox =
		field.type === 'boolean' || ['checkbox', 'switch'].includes(block.props.variant);
	const help: string | null = block.props.help ?? field.help;
	const error = ctx.form.errors[field.key];

	return (
		<div className='flex flex-col gap-1.5'>
			{!isCheckbox && (
				<label
					id={`field-${block.id}-label`}
					htmlFor={`field-${block.id}`}
					className='text-sm font-medium'>
					{block.props.label ?? field.label}
					{field.required && <span className='ms-0.5 text-red-500'>*</span>}
				</label>
			)}
			<FieldControl block={block} field={field} ctx={ctx} />
			{help && <p className='text-xs opacity-70'>{help}</p>}
			{error && <p className='text-xs text-red-500'>{error}</p>}
		</div>
	);
};

// ─── Run: submit, status, output ─────────────────────────────

const SubmitBlock: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const { isSubmitting, submission, onSubmit, submitError } = ctx.form;
	const isRunning =
		isSubmitting || submission?.state === 'running' || submission?.state === 'waiting';
	const align: string = block.props.align ?? 'left';

	return (
		<div className='flex flex-col gap-2'>
			<div className={classNames('flex', JUSTIFY[align])}>
				<button
					type='button'
					onClick={onSubmit}
					disabled={isRunning}
					className={classNames(
						'px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
						RADIUS[ctx.theme.radius],
						{ 'w-full': align === 'stretch' },
					)}
					style={{ backgroundColor: ctx.theme.accent }}>
					{isRunning ? block.props.running_label : block.props.label}
				</button>
			</div>
			{submitError && <p className='text-sm text-red-500'>{submitError}</p>}
		</div>
	);
};

const StatusBlock: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const submission = ctx.form.submission;

	if (!submission) {
		return block.props.idle_text ? (
			<p className='text-sm opacity-70'>{block.props.idle_text}</p>
		) : null;
	}

	const { completed, total } = submission.progress;
	const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
	const label = {
		running: 'Working on it…',
		waiting: 'Waiting for a review…',
		completed: 'Done',
		failed: submission.error ?? 'Something went wrong.',
	}[submission.state];

	return (
		<div className='flex flex-col gap-2' role='status' aria-live='polite'>
			<p
				className={classNames('text-sm font-medium', {
					'text-red-500': submission.state === 'failed',
				})}>
				{label}
			</p>
			{block.props.show_progress && submission.state !== 'failed' && total > 0 && (
				<div className='h-2 w-full overflow-hidden rounded-full bg-zinc-500/20'>
					<div
						className='h-full transition-all'
						style={{
							width: `${submission.state === 'completed' ? 100 : percent}%`,
							backgroundColor: ctx.theme.accent,
						}}
					/>
				</div>
			)}
		</div>
	);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const OutputValue: FC<{ value: unknown; display: string }> = ({ value, display }) => {
	const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

	if (display === 'image' && typeof value === 'string') {
		return <img src={value} alt='' className='max-w-full rounded-lg' />;
	}

	if (display === 'link' && typeof value === 'string') {
		return (
			<a
				href={value}
				target='_blank'
				rel='noopener noreferrer'
				className='break-all underline'>
				{value}
			</a>
		);
	}

	if (display === 'table' && Array.isArray(value) && value.every(isRecord)) {
		const columns = Array.from(new Set(value.flatMap((row) => Object.keys(row))));
		return (
			<div className='overflow-x-auto'>
				<table className='w-full text-left text-sm'>
					<thead>
						<tr>
							{columns.map((column) => (
								<th
									key={column}
									className='border-b border-zinc-500/20 p-2 font-semibold'>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{value.map((row, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<tr key={index}>
								{columns.map((column) => (
									<td key={column} className='border-b border-zinc-500/10 p-2'>
										{typeof row[column] === 'string'
											? (row[column] as string)
											: JSON.stringify(row[column])}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	if (display === 'markdown' && typeof value === 'string') {
		return <Markdown>{value}</Markdown>;
	}

	if (display === 'json' || (display === 'auto' && typeof value !== 'string')) {
		return (
			<pre className='overflow-x-auto rounded-lg bg-zinc-500/10 p-3 font-mono text-xs'>
				{text}
			</pre>
		);
	}

	return <p className='text-sm whitespace-pre-wrap'>{text}</p>;
};

const OutputBlock: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const [copied, setCopied] = useState(false);
	const submission = ctx.form.submission;
	const name: string = block.props.output_name;
	const hasValue =
		submission?.state === 'completed' &&
		Object.prototype.hasOwnProperty.call(submission.outputs, name);
	const value = hasValue ? submission!.outputs[name] : undefined;

	const copy = () => {
		const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
		navigator.clipboard
			?.writeText(text)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			})
			.catch(() => undefined);
	};

	return (
		<div
			className={classNames(
				'flex flex-col gap-2 border p-4',
				RADIUS[ctx.theme.radius],
				ctx.isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50',
			)}>
			<div className='flex items-center justify-between gap-2'>
				{block.props.label && (
					<span className='text-sm font-semibold'>{block.props.label}</span>
				)}
				{hasValue && block.props.copyable && (
					<button
						type='button'
						onClick={copy}
						className='ms-auto text-xs underline opacity-70'>
						{copied ? 'Copied' : 'Copy'}
					</button>
				)}
			</div>
			{hasValue ? (
				<OutputValue value={value} display={block.props.display ?? 'auto'} />
			) : (
				<p className='text-sm opacity-60'>
					{block.props.empty_text ?? 'The result will appear here.'}
				</p>
			)}
		</div>
	);
};

// ─── Content blocks ──────────────────────────────────────────

const youtubeEmbed = (url: string): string | null => {
	const match = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
	);
	if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`;
	const vimeo = url.match(/vimeo\.com\/(\d+)/);
	return vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
};

const Countdown: FC<{ block: TPageBlock }> = ({ block }) => {
	const target = block.props.target ? new Date(block.props.target).getTime() : null;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	if (target === null) return null;

	const remaining = Math.max(0, Math.floor((target - now) / 1000));
	if (remaining === 0) {
		return block.props.ended_text ? (
			<p className='text-center font-semibold'>{block.props.ended_text}</p>
		) : null;
	}

	const parts = [
		['days', Math.floor(remaining / 86400)],
		['hours', Math.floor((remaining % 86400) / 3600)],
		['min', Math.floor((remaining % 3600) / 60)],
		...(block.props.show_seconds ? [['sec', remaining % 60]] : []),
	] as [string, number][];

	return (
		<div className='flex flex-col items-center gap-2'>
			{block.props.label && <p className='text-sm opacity-70'>{block.props.label}</p>}
			<div className='flex gap-4'>
				{parts.map(([label, amount]) => (
					<div key={label} className='flex flex-col items-center'>
						<span className='text-3xl font-bold tabular-nums'>{amount}</span>
						<span className='text-xs uppercase opacity-60'>{label}</span>
					</div>
				))}
			</div>
		</div>
	);
};

const Tabs: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const items: { label: string; markdown: string }[] = block.props.items ?? [];
	const [active, setActive] = useState(0);
	if (items.length === 0) return null;

	return (
		<div className='flex flex-col gap-3'>
			<div role='tablist' className='flex flex-wrap gap-2 border-b border-zinc-500/20'>
				{items.map((item, index) => (
					<button
						key={item.label}
						role='tab'
						type='button'
						aria-selected={index === active}
						onClick={() => setActive(index)}
						className='-mb-px border-b-2 px-3 py-2 text-sm font-medium'
						style={{
							borderColor: index === active ? ctx.theme.accent : 'transparent',
						}}>
						{item.label}
					</button>
				))}
			</div>
			<Markdown>{items[active]?.markdown ?? ''}</Markdown>
		</div>
	);
};

const ContentBlock: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const p = block.props;

	switch (block.type) {
		case 'heading': {
			const className = classNames('font-bold tracking-tight', ALIGN[p.align ?? 'left'], {
				'text-4xl': p.level === 1,
				'text-2xl': p.level === 2,
				'text-xl': p.level === 3,
			});
			if (p.level === 1) return <h1 className={className}>{p.text}</h1>;
			if (p.level === 3) return <h3 className={className}>{p.text}</h3>;
			return <h2 className={className}>{p.text}</h2>;
		}
		case 'text':
			return <Markdown className={ALIGN[p.align ?? 'left']}>{p.markdown ?? ''}</Markdown>;
		case 'image':
			return p.url ? (
				<img
					src={p.url}
					alt={p.alt ?? ''}
					className={classNames(
						'w-full',
						IMAGE_HEIGHT[p.height ?? 'md'],
						p.fit === 'contain' ? 'object-contain' : 'object-cover',
						RADIUS[ctx.theme.radius],
					)}
				/>
			) : null;
		case 'divider':
			return (
				<hr
					className={classNames('border-zinc-500/25', {
						'border-dashed': p.style === 'dashed',
					})}
				/>
			);
		case 'spacer':
			return <div className={SPACER[p.size ?? 'md']} />;
		case 'callout':
			return (
				<div
					className={classNames(
						'border p-4',
						RADIUS[ctx.theme.radius],
						CALLOUT_TONE[p.tone ?? 'info'],
					)}>
					{p.title && <p className='mb-1 font-semibold'>{p.title}</p>}
					<Markdown className='text-sm'>{p.markdown ?? ''}</Markdown>
				</div>
			);
		case 'button': {
			if (!p.url) return null;
			const style = p.style ?? 'solid';
			return (
				<div className={classNames('flex', JUSTIFY[p.align ?? 'left'])}>
					<a
						href={p.url}
						target={p.new_tab ? '_blank' : undefined}
						rel='noopener noreferrer'
						className={classNames(
							'px-5 py-2.5 text-center text-sm font-semibold transition hover:opacity-90',
							RADIUS[ctx.theme.radius],
							{ 'w-full': p.align === 'stretch', border: style === 'outline' },
						)}
						style={
							style === 'solid'
								? { backgroundColor: ctx.theme.accent, color: '#fff' }
								: { borderColor: ctx.theme.accent, color: ctx.theme.accent }
						}>
						{p.label}
					</a>
				</div>
			);
		}
		case 'video': {
			if (!p.url) return null;
			const embed = youtubeEmbed(p.url);
			return (
				<figure className='flex flex-col gap-2'>
					{embed ? (
						<iframe
							src={embed}
							title={p.caption ?? 'Video'}
							className={classNames('aspect-video w-full', RADIUS[ctx.theme.radius])}
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture'
							allowFullScreen
						/>
					) : (
						<video
							src={p.url}
							controls
							className={classNames('w-full', RADIUS[ctx.theme.radius])}
						/>
					)}
					{p.caption && (
						<figcaption className='text-center text-sm opacity-70'>
							{p.caption}
						</figcaption>
					)}
				</figure>
			);
		}
		case 'faq':
			return (
				<div className='flex flex-col divide-y divide-zinc-500/20'>
					{(p.items ?? []).map(
						(item: { question: string; answer: string }, index: number) => (
							<details
								key={item.question}
								open={p.open_first && index === 0}
								className='py-3'>
								<summary className='cursor-pointer font-medium'>
									{item.question}
								</summary>
								<Markdown className='mt-2 text-sm opacity-80'>
									{item.answer}
								</Markdown>
							</details>
						),
					)}
				</div>
			);
		case 'testimonial':
			return (
				<figure className='flex flex-col items-center gap-3 text-center'>
					{p.rating > 0 && (
						<div
							aria-label={`${p.rating} out of 5`}
							style={{ color: ctx.theme.accent }}>
							{'★'.repeat(p.rating)}
						</div>
					)}
					<blockquote className='text-lg italic'>“{p.quote}”</blockquote>
					{(p.author || p.role) && (
						<figcaption className='flex items-center gap-2 text-sm'>
							{p.avatar_url && (
								<img
									src={p.avatar_url}
									alt=''
									className='h-8 w-8 rounded-full object-cover'
								/>
							)}
							<span className='font-semibold'>{p.author}</span>
							{p.role && <span className='opacity-70'>· {p.role}</span>}
						</figcaption>
					)}
				</figure>
			);
		case 'stats':
			return (
				<div
					className={classNames(
						'grid grid-cols-2 gap-6 sm:grid-cols-3',
						ALIGN[p.align ?? 'center'],
					)}>
					{(p.items ?? []).map((item: { value: string; label: string }) => (
						<div key={item.label}>
							<div className='text-3xl font-bold' style={{ color: ctx.theme.accent }}>
								{item.value}
							</div>
							<div className='text-sm opacity-70'>{item.label}</div>
						</div>
					))}
				</div>
			);
		case 'logos':
			return (
				<div className='flex flex-col items-center gap-4'>
					{p.title && <p className='text-sm opacity-70'>{p.title}</p>}
					<div className='flex flex-wrap items-center justify-center gap-8'>
						{(p.items ?? []).map((item: { url: string; alt: string | null }) => (
							<img
								key={item.url}
								src={item.url}
								alt={item.alt ?? ''}
								className={classNames('h-8 w-auto object-contain', {
									'opacity-70 grayscale': p.grayscale,
								})}
							/>
						))}
					</div>
				</div>
			);
		case 'tabs':
			return <Tabs block={block} ctx={ctx} />;
		case 'countdown':
			return <Countdown block={block} />;
		default:
			return null;
	}
};

// ─── Layout ──────────────────────────────────────────────────

const sectionStyle = (block: TPageBlock, ctx: TContext): CSSProperties => {
	const background: string = block.props.background ?? 'none';
	if (background === 'accent') return { backgroundColor: `${ctx.theme.accent}1a` };
	if (background === 'image' && block.props.image_url) {
		return {
			backgroundImage: `url("${block.props.image_url}")`,
			backgroundSize: 'cover',
			backgroundPosition: 'center',
		};
	}
	return {};
};

const Block: FC<{ block: TPageBlock; ctx: TContext }> = ({ block, ctx }) => {
	const p = block.props;
	const children = (block.children ?? []).map((child) => (
		<Block key={child.id} block={child} ctx={ctx} />
	));

	switch (block.type) {
		case 'section':
			return (
				<section
					className={classNames(
						'flex flex-col gap-6',
						PADDING[p.padding ?? 'md'],
						RADIUS[ctx.theme.radius],
						{
							'text-center': p.align === 'center',
							'bg-zinc-500/5': p.background === 'subtle',
							'bg-zinc-900 text-white': p.background === 'dark',
						},
					)}
					style={sectionStyle(block, ctx)}>
					{children}
				</section>
			);
		case 'columns': {
			const layout: string = p.layout ?? '1-1';
			return (
				<div
					className={classNames(
						'grid grid-cols-1 md:[grid-template-columns:var(--cols)]',
						GAP[p.gap ?? 'md'],
						{ 'items-center': p.valign === 'center' },
					)}
					style={
						{
							'--cols': layout
								.split('-')
								.map((part) => `${part}fr`)
								.join(' '),
						} as CSSProperties
					}>
					{children}
				</div>
			);
		}
		case 'column':
			return (
				<div
					className={classNames('flex flex-col gap-6', {
						[`bg-zinc-500/5 p-4 ${RADIUS[ctx.theme.radius]}`]:
							p.background === 'subtle',
					})}>
					{children}
				</div>
			);
		case 'field':
			return <FieldBlock block={block} ctx={ctx} />;
		case 'submit':
			return <SubmitBlock block={block} ctx={ctx} />;
		case 'status':
			return <StatusBlock block={block} ctx={ctx} />;
		case 'output':
			return <OutputBlock block={block} ctx={ctx} />;
		default:
			return <ContentBlock block={block} ctx={ctx} />;
	}
};

interface IPageBlocksProps {
	blocks: TPageBlock[];
	theme: TPageTheme;
	isDark: boolean;
	form: TPageFormState;
}

const PageBlocks: FC<IPageBlocksProps> = ({ blocks, theme, isDark, form }): ReactNode => {
	const ctx: TContext = { theme, isDark, form };

	return (
		<div className='flex flex-col gap-6'>
			{blocks.map((block) => (
				<Block key={block.id} block={block} ctx={ctx} />
			))}
		</div>
	);
};

export default PageBlocks;
