import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy, Globe, Mail, X } from 'lucide-react';
import type { TPageBlockOf } from '@/types/workflow-page.type';
import type { TPageMode } from './PageBlocks';
import PageMarkdown from './PageMarkdown';

const Placeholder = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => (
	<div className='flex items-center justify-center gap-2 rounded-[var(--pg-radius)] border border-dashed border-[var(--pg-border)] bg-[var(--pg-subtle)] px-4 py-6 text-xs text-[var(--pg-muted)]'>
		{icon}
		{children}
	</div>
);

const Title = ({ children }: { children: ReactNode }) => (
	<h3 className='text-lg font-extrabold tracking-tight'>{children}</h3>
);

/** The lines of a one-per-line text prop, without the empty ones. */
export const splitLines = (value: string | null): string[] =>
	(value ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

/* ─── Code ─── */

export const CodeBlock = ({ block, mode }: { block: TPageBlockOf<'code'>; mode: TPageMode }) => {
	const { code, language, filename, show_copy: showCopy } = block.props;
	const [copied, setCopied] = useState(false);
	const timer = useRef<number>(undefined);
	useEffect(() => () => window.clearTimeout(timer.current), []);
	if (!code)
		return mode === 'edit' ? <Placeholder>Paste a code snippet in the inspector</Placeholder> : null;
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			window.clearTimeout(timer.current);
			timer.current = window.setTimeout(() => setCopied(false), 1800);
		} catch {
			// Clipboard blocked: nothing to confirm.
		}
	};
	return (
		<figure className='overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[#0b0b0f] text-zinc-100'>
			{(filename || language || showCopy) && (
				<figcaption className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-xs text-zinc-400'>
					<span className='min-w-0 truncate font-mono'>{filename || language}</span>
					{showCopy && (
						<button
							type='button'
							onClick={copy}
							tabIndex={mode === 'edit' ? -1 : undefined}
							className='flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-semibold text-zinc-300 transition hover:bg-white/10'>
							{copied ? <Check size={13} /> : <Copy size={13} />}
							{copied ? 'Copied' : 'Copy'}
						</button>
					)}
				</figcaption>
			)}
			<pre className='overflow-x-auto p-4 font-mono text-[13px] leading-relaxed'>
				<code>{code}</code>
			</pre>
		</figure>
	);
};

/* ─── Pricing ─── */

const PRICING_COLUMNS = [
	'',
	'grid-cols-1',
	'grid-cols-1 @lg:grid-cols-2',
	'grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3',
	'grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-4',
];

export const PricingBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'pricing'>;
	mode: TPageMode;
}) => {
	const { title, items } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add plans in the inspector</Placeholder> : null;
	return (
		<div className='space-y-4'>
			{title && <Title>{title}</Title>}
			<div className={`grid items-stretch gap-3 ${PRICING_COLUMNS[items.length]}`}>
				{items.map((plan, index) => (
					<div
						key={index}
						className={`flex flex-col rounded-[var(--pg-radius)] border bg-[var(--pg-surface)] p-5 ${
							plan.highlighted
								? 'border-[var(--pg-accent)] shadow-md ring-1 ring-[var(--pg-accent)]'
								: 'border-[var(--pg-border)]'
						}`}>
						{plan.highlighted && (
							<span className='mb-2 w-fit rounded-full bg-[var(--pg-accent)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--pg-accent-fg)] uppercase'>
								Popular
							</span>
						)}
						<p className='text-sm font-bold'>
							{plan.name || <span className='text-[var(--pg-muted)]'>Plan</span>}
						</p>
						<p className='mt-2 flex items-baseline gap-1'>
							<span className='text-3xl font-extrabold tracking-tight'>{plan.price}</span>
							{plan.period && (
								<span className='text-xs font-semibold text-[var(--pg-muted)]'>{plan.period}</span>
							)}
						</p>
						{plan.description && (
							<p className='mt-2 text-xs text-[var(--pg-muted)]'>{plan.description}</p>
						)}
						<ul className='mt-4 flex-1 space-y-2 text-sm'>
							{splitLines(plan.features).map((feature, i) => (
								<li key={i} className='flex items-start gap-2'>
									<Check size={15} className='mt-0.5 shrink-0 text-[var(--pg-accent)]' />
									<span>{feature}</span>
								</li>
							))}
						</ul>
						{plan.cta_label && (plan.cta_url || mode === 'edit') && (
							<a
								href={plan.cta_url ?? undefined}
								target='_blank'
								rel='noopener noreferrer'
								tabIndex={mode === 'edit' ? -1 : undefined}
								className={`mt-5 inline-flex h-10 items-center justify-center rounded-[calc(var(--pg-radius)*0.8)] px-4 text-sm font-bold transition ${
									plan.highlighted
										? 'bg-[var(--pg-accent)] text-[var(--pg-accent-fg)] hover:brightness-110'
										: 'border-2 border-[var(--pg-accent)] text-[var(--pg-accent)] hover:bg-[var(--pg-accent-soft)]'
								} ${plan.cta_url ? '' : 'opacity-60'}`}>
								{plan.cta_label}
							</a>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

/* ─── Embed ─── */

const EMBED_HEIGHT = { sm: 'h-64', md: 'h-96', lg: 'h-[32rem]', xl: 'h-[44rem]' } as const;

export const EmbedBlock = ({ block, mode }: { block: TPageBlockOf<'embed'>; mode: TPageMode }) => {
	const { url, title, height } = block.props;
	if (!url)
		return mode === 'edit' ? (
			<Placeholder>Add a Calendly, Typeform, Tally, Google Forms or Figma link</Placeholder>
		) : null;
	return (
		<div
			className={`${EMBED_HEIGHT[height]} w-full overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)]`}>
			<iframe
				src={url}
				title={title ?? 'Embedded content'}
				loading='lazy'
				sandbox='allow-scripts allow-forms allow-popups allow-same-origin'
				referrerPolicy='strict-origin-when-cross-origin'
				className={`size-full ${mode === 'edit' ? 'pointer-events-none' : ''}`}
			/>
		</div>
	);
};

/* ─── Gallery ─── */

const GALLERY_COLUMNS = {
	2: 'grid-cols-2',
	3: 'grid-cols-2 @lg:grid-cols-3',
	4: 'grid-cols-2 @lg:grid-cols-4',
} as const;

const GALLERY_RATIO = { square: 'aspect-square', landscape: 'aspect-[4/3]', auto: '' } as const;

export const GalleryBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'gallery'>;
	mode: TPageMode;
}) => {
	const { items, columns, ratio, lightbox } = block.props;
	const [open, setOpen] = useState<number | null>(null);
	const canOpen = lightbox && mode === 'live';
	useEffect(() => {
		if (open === null) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(null);
			else if (event.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % items.length));
			else if (event.key === 'ArrowLeft')
				setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, items.length]);
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add image links in the inspector</Placeholder> : null;
	const current = open === null ? undefined : items[open];
	return (
		<>
			<div className={`grid gap-2 ${GALLERY_COLUMNS[columns]}`}>
				{items.map((item, index) => {
					const image = (
						<img
							src={item.url}
							alt={item.alt ?? ''}
							loading='lazy'
							className={`w-full rounded-[calc(var(--pg-radius)*0.8)] object-cover ${GALLERY_RATIO[ratio]}`}
						/>
					);
					return canOpen ? (
						<button
							key={index}
							type='button'
							onClick={() => setOpen(index)}
							aria-label={item.alt ? `Open ${item.alt}` : `Open image ${index + 1}`}
							className='block cursor-zoom-in transition hover:opacity-90'>
							{image}
						</button>
					) : (
						<div key={index}>{image}</div>
					);
				})}
			</div>
			{current && (
				<div
					role='dialog'
					aria-modal='true'
					aria-label='Image viewer'
					onClick={() => setOpen(null)}
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6'>
					<button
						type='button'
						onClick={() => setOpen(null)}
						aria-label='Close'
						className='absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'>
						<X size={18} />
					</button>
					<img
						src={current.url}
						alt={current.alt ?? ''}
						onClick={(event) => event.stopPropagation()}
						className='max-h-full max-w-full rounded-lg object-contain'
					/>
				</div>
			)}
		</>
	);
};

/* ─── Compare ─── */

const CompareSlider = ({
	before,
	after,
	beforeLabel,
	afterLabel,
	interactive,
}: {
	before: string;
	after: string;
	beforeLabel: string | null;
	afterLabel: string | null;
	interactive: boolean;
}) => {
	const [position, setPosition] = useState(50);
	return (
		<div className='relative aspect-video w-full select-none overflow-hidden rounded-[var(--pg-radius)] bg-[var(--pg-subtle)]'>
			<img src={after} alt={afterLabel ?? 'After'} className='absolute inset-0 size-full object-cover' />
			<img
				src={before}
				alt={beforeLabel ?? 'Before'}
				className='absolute inset-0 size-full object-cover'
				style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
			/>
			<span
				className='pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow'
				style={{ left: `${position}%` }}
			/>
			{beforeLabel && (
				<span className='absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white'>
					{beforeLabel}
				</span>
			)}
			{afterLabel && (
				<span className='absolute right-2 bottom-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white'>
					{afterLabel}
				</span>
			)}
			<input
				type='range'
				min={0}
				max={100}
				value={position}
				disabled={!interactive}
				aria-label='Compare before and after'
				onChange={(event) => setPosition(Number(event.target.value))}
				className='absolute inset-0 size-full cursor-ew-resize opacity-0'
			/>
		</div>
	);
};

export const CompareBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'compare'>;
	mode: TPageMode;
}) => {
	const {
		mode: kind,
		before_url: before,
		after_url: after,
		before_label: beforeLabel,
		after_label: afterLabel,
		before_items: beforeItems,
		after_items: afterItems,
	} = block.props;
	if (kind === 'slider') {
		if (!before || !after)
			return mode === 'edit' ? (
				<Placeholder>Add a before and an after image link</Placeholder>
			) : null;
		return (
			<CompareSlider
				before={before}
				after={after}
				beforeLabel={beforeLabel}
				afterLabel={afterLabel}
				interactive={mode === 'live'}
			/>
		);
	}
	const left = splitLines(beforeItems);
	const right = splitLines(afterItems);
	if (left.length === 0 && right.length === 0)
		return mode === 'edit' ? <Placeholder>Add the two lists in the inspector</Placeholder> : null;
	const column = (label: string | null, lines: string[], good: boolean) => (
		<div
			className={`rounded-[var(--pg-radius)] border p-4 ${
				good
					? 'border-[var(--pg-accent)] bg-[var(--pg-accent-soft)]'
					: 'border-[var(--pg-border)] bg-[var(--pg-surface)]'
			}`}>
			<p className='mb-3 text-sm font-bold'>{label ?? (good ? 'With us' : 'Without us')}</p>
			<ul className='space-y-2 text-sm'>
				{lines.map((line, i) => (
					<li key={i} className='flex items-start gap-2'>
						{good ? (
							<Check size={15} className='mt-0.5 shrink-0 text-[var(--pg-accent)]' />
						) : (
							<X size={15} className='mt-0.5 shrink-0 text-[var(--pg-muted)]' />
						)}
						<span>{line}</span>
					</li>
				))}
			</ul>
		</div>
	);
	return (
		<div className='grid gap-3 @lg:grid-cols-2'>
			{column(beforeLabel, left, false)}
			{column(afterLabel, right, true)}
		</div>
	);
};

/* ─── Progress ─── */

export const ProgressBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'progress'>;
	mode: TPageMode;
}) => {
	const { title, items, show_values: showValues } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add bars in the inspector</Placeholder> : null;
	return (
		<div className='space-y-4'>
			{title && <Title>{title}</Title>}
			<ul className='space-y-3'>
				{items.map((item, index) => (
					<li key={index} className='space-y-1.5'>
						<div className='flex items-center justify-between gap-3 text-sm font-semibold'>
							<span className='min-w-0 truncate'>{item.label}</span>
							{showValues && <span className='text-xs text-[var(--pg-muted)]'>{item.value}%</span>}
						</div>
						<div
							role='progressbar'
							aria-label={item.label}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={item.value}
							className='h-2 overflow-hidden rounded-full bg-[var(--pg-subtle)]'>
							<div
								className='h-full rounded-full bg-[var(--pg-accent)]'
								style={{ width: `${item.value}%` }}
							/>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

/* ─── Social ─── */

/** Lucide dropped its brand icons, so networks show a short mark instead. */
const SOCIAL_MARK: Record<TPageBlockOf<'social'>['props']['items'][number]['network'], string> = {
	website: '',
	email: '',
	x: 'X',
	linkedin: 'in',
	github: 'GH',
	youtube: 'YT',
	instagram: 'IG',
	facebook: 'f',
	tiktok: 'TT',
	discord: 'D',
};

const SOCIAL_ALIGN = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;

export const SocialBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'social'>;
	mode: TPageMode;
}) => {
	const { items, align, style } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add links in the inspector</Placeholder> : null;
	return (
		<div className={`flex flex-wrap gap-2 ${SOCIAL_ALIGN[align]}`}>
			{items.map((item, index) => (
				<a
					key={index}
					href={item.url}
					target={item.network === 'email' ? undefined : '_blank'}
					rel='noopener noreferrer'
					aria-label={item.network}
					tabIndex={mode === 'edit' ? -1 : undefined}
					className={`flex size-10 items-center justify-center rounded-full text-xs font-extrabold transition ${
						style === 'solid'
							? 'bg-[var(--pg-accent)] text-[var(--pg-accent-fg)] hover:brightness-110'
							: 'border-2 border-[var(--pg-accent)] text-[var(--pg-accent)] hover:bg-[var(--pg-accent-soft)]'
					}`}>
					{item.network === 'email' ? (
						<Mail size={16} />
					) : item.network === 'website' ? (
						<Globe size={16} />
					) : (
						SOCIAL_MARK[item.network]
					)}
				</a>
			))}
		</div>
	);
};

/* ─── Timeline ─── */

export const TimelineBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'timeline'>;
	mode: TPageMode;
}) => {
	const { title, items } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add milestones in the inspector</Placeholder> : null;
	return (
		<div className='space-y-4'>
			{title && <Title>{title}</Title>}
			<ol className='relative space-y-6 border-l-2 border-[var(--pg-border)] pl-6'>
				{items.map((item, index) => (
					<li key={index} className='relative'>
						<span className='absolute top-1 -left-[31px] size-3 rounded-full border-2 border-[var(--pg-surface)] bg-[var(--pg-accent)]' />
						{item.date && (
							<p className='text-xs font-bold tracking-wide text-[var(--pg-accent)] uppercase'>
								{item.date}
							</p>
						)}
						<p className='text-sm font-bold'>
							{item.title || <span className='text-[var(--pg-muted)]'>Milestone</span>}
						</p>
						{item.description && (
							<PageMarkdown className='mt-1 text-sm text-[var(--pg-text)]/75'>
								{item.description}
							</PageMarkdown>
						)}
					</li>
				))}
			</ol>
		</div>
	);
};
