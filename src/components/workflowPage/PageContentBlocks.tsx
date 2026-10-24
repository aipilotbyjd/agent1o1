import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ExternalLink, Play, Quote, Star, Timer, Video } from 'lucide-react';
import type { TPageBlockOf } from '@/types/workflow-page.type';
import type { TPageMode } from './PageBlocks';
import PageMarkdown from './PageMarkdown';

const Placeholder = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => (
	<div className='flex items-center justify-center gap-2 rounded-[var(--pg-radius)] border border-dashed border-[var(--pg-border)] bg-[var(--pg-subtle)] px-4 py-6 text-xs text-[var(--pg-muted)]'>
		{icon}
		{children}
	</div>
);

const BUTTON_ALIGN = {
	left: 'justify-start',
	center: 'justify-center',
	right: 'justify-end',
	stretch: '[&>*]:w-full',
} as const;

const BUTTON_STYLE = {
	solid: 'bg-[var(--pg-accent)] text-[var(--pg-accent-fg)] shadow-sm hover:brightness-110',
	outline:
		'border-2 border-[var(--pg-accent)] text-[var(--pg-accent)] hover:bg-[var(--pg-accent-soft)]',
	ghost: 'text-[var(--pg-accent)] hover:bg-[var(--pg-accent-soft)]',
} as const;

export const ButtonBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'button'>;
	mode: TPageMode;
}) => {
	const { label, url, style, align, new_tab: newTab } = block.props;
	const className = `inline-flex h-11 items-center justify-center gap-2 rounded-[calc(var(--pg-radius)*0.8)] px-6 text-sm font-bold transition ${BUTTON_STYLE[style]}`;
	if (!url && mode === 'live') return null;
	return (
		<div className={`flex ${BUTTON_ALIGN[align]}`}>
			{url ? (
				<a
					href={url}
					target={newTab ? '_blank' : undefined}
					rel={newTab ? 'noopener noreferrer' : undefined}
					tabIndex={mode === 'edit' ? -1 : undefined}
					className={className}>
					{label}
					{newTab && <ExternalLink size={14} className='opacity-70' />}
				</a>
			) : (
				<span className={`${className} opacity-60`}>{label}</span>
			)}
		</div>
	);
};

/** The player for a link: YouTube, Vimeo and Loom embed; a video file plays directly. */
const videoSource = (url: string): { kind: 'embed' | 'file' | 'link'; src: string } => {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '');
		if (host === 'youtu.be')
			return {
				kind: 'embed',
				src: `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`,
			};
		if (host.endsWith('youtube.com')) {
			const id =
				parsed.searchParams.get('v') ??
				parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
			if (id) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
		}
		if (host === 'vimeo.com' || host === 'player.vimeo.com') {
			const id = parsed.pathname.match(/(\d+)/)?.[1];
			if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}` };
		}
		if (host.endsWith('loom.com')) {
			const id = parsed.pathname.match(/\/(?:share|embed)\/([^/?]+)/)?.[1];
			if (id) return { kind: 'embed', src: `https://www.loom.com/embed/${id}` };
		}
		if (/\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname)) return { kind: 'file', src: url };
	} catch {
		// Not a URL the page can play; it falls back to a link.
	}
	return { kind: 'link', src: url };
};

export const VideoBlock = ({ block, mode }: { block: TPageBlockOf<'video'>; mode: TPageMode }) => {
	const { url, caption } = block.props;
	if (!url)
		return mode === 'edit' ? (
			<Placeholder icon={<Video size={16} />}>
				Add a YouTube, Vimeo, Loom or video file link
			</Placeholder>
		) : null;
	const source = videoSource(url);
	return (
		<figure className='space-y-2'>
			{source.kind === 'link' ? (
				<a
					href={url}
					target='_blank'
					rel='noopener noreferrer'
					className='flex aspect-video w-full items-center justify-center gap-2 rounded-[var(--pg-radius)] bg-[var(--pg-subtle)] text-sm font-semibold text-[var(--pg-accent)]'>
					<Play size={18} className='fill-current' /> Watch the video
				</a>
			) : (
				<div className='aspect-video w-full overflow-hidden rounded-[var(--pg-radius)] bg-black'>
					{source.kind === 'embed' ? (
						<iframe
							src={source.src}
							title={caption ?? 'Video'}
							className={`size-full ${mode === 'edit' ? 'pointer-events-none' : ''}`}
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
							referrerPolicy='strict-origin-when-cross-origin'
							allowFullScreen
						/>
					) : (
						<video src={source.src} controls preload='metadata' className='size-full' />
					)}
				</div>
			)}
			{caption && (
				<figcaption className='text-center text-xs text-[var(--pg-muted)]'>
					{caption}
				</figcaption>
			)}
		</figure>
	);
};

export const FaqBlock = ({ block, mode }: { block: TPageBlockOf<'faq'>; mode: TPageMode }) => {
	const { items, open_first: openFirst } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add questions in the inspector</Placeholder> : null;
	return (
		<div className='divide-y divide-[var(--pg-border)] overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)]'>
			{items.map((item, index) => (
				<details key={index} open={openFirst && index === 0} className='group/faq'>
					<summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden'>
						{item.question || <span className='text-[var(--pg-muted)]'>Question</span>}
						<ChevronDown
							size={16}
							className='shrink-0 text-[var(--pg-muted)] transition group-open/faq:rotate-180'
						/>
					</summary>
					{item.answer && (
						<PageMarkdown className='px-4 pb-4 text-[var(--pg-text)]/85'>
							{item.answer}
						</PageMarkdown>
					)}
				</details>
			))}
		</div>
	);
};

export const TestimonialBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'testimonial'>;
	mode: TPageMode;
}) => {
	const { quote, author, role, avatar_url: avatar, rating } = block.props;
	if (!quote && mode === 'live') return null;
	return (
		<figure className='h-full space-y-4 rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-5'>
			<div className='flex items-center justify-between gap-2'>
				<Quote size={22} className='text-[var(--pg-accent)] opacity-60' />
				{rating > 0 && (
					<div className='flex gap-0.5' aria-label={`${rating} out of 5`}>
						{Array.from({ length: 5 }, (_, i) => (
							<Star
								key={i}
								size={14}
								className={
									i < rating
										? 'fill-amber-400 text-amber-400'
										: 'text-[var(--pg-border)]'
								}
							/>
						))}
					</div>
				)}
			</div>
			<blockquote className='text-sm leading-relaxed'>
				{quote || (
					<span className='text-[var(--pg-muted)] italic'>
						What a happy customer said
					</span>
				)}
			</blockquote>
			{(author || role || avatar) && (
				<figcaption className='flex items-center gap-3'>
					{avatar ? (
						<img src={avatar} alt='' className='size-9 rounded-full object-cover' />
					) : author ? (
						<span className='flex size-9 items-center justify-center rounded-full bg-[var(--pg-accent-soft)] text-sm font-bold text-[var(--pg-accent)]'>
							{author.charAt(0).toUpperCase()}
						</span>
					) : null}
					<span className='min-w-0'>
						{author && (
							<span className='block truncate text-sm font-bold'>{author}</span>
						)}
						{role && (
							<span className='block truncate text-xs text-[var(--pg-muted)]'>
								{role}
							</span>
						)}
					</span>
				</figcaption>
			)}
		</figure>
	);
};

const STATS_COLUMNS = [
	'',
	'grid-cols-1',
	'grid-cols-2',
	'grid-cols-2 @lg:grid-cols-3',
	'grid-cols-2 @lg:grid-cols-4',
	'grid-cols-2 @lg:grid-cols-5',
	'grid-cols-2 @lg:grid-cols-3',
];

export const StatsBlock = ({ block, mode }: { block: TPageBlockOf<'stats'>; mode: TPageMode }) => {
	const { items, align } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add numbers in the inspector</Placeholder> : null;
	return (
		<dl
			className={`grid gap-4 ${STATS_COLUMNS[items.length]} ${align === 'center' ? 'text-center' : 'text-left'}`}>
			{items.map((item, index) => (
				<div
					key={index}
					className='rounded-[var(--pg-radius)] bg-[var(--pg-subtle)] px-4 py-5'>
					<dt className='sr-only'>{item.label}</dt>
					<dd className='text-3xl font-extrabold tracking-tight text-[var(--pg-accent)]'>
						{item.value}
					</dd>
					<dd className='mt-1 text-xs font-semibold text-[var(--pg-muted)]'>
						{item.label}
					</dd>
				</div>
			))}
		</dl>
	);
};

export const LogosBlock = ({ block, mode }: { block: TPageBlockOf<'logos'>; mode: TPageMode }) => {
	const { title, items, grayscale } = block.props;
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add logo links in the inspector</Placeholder> : null;
	return (
		<div className='space-y-4'>
			{title && (
				<p className='text-center text-xs font-bold tracking-wide text-[var(--pg-muted)] uppercase'>
					{title}
				</p>
			)}
			<div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-4'>
				{items.map((item, index) => (
					<img
						key={index}
						src={item.url}
						alt={item.alt ?? ''}
						className={`h-8 max-w-[140px] object-contain transition ${grayscale ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
					/>
				))}
			</div>
		</div>
	);
};

export const TabsBlock = ({ block, mode }: { block: TPageBlockOf<'tabs'>; mode: TPageMode }) => {
	const { items } = block.props;
	const [active, setActive] = useState(0);
	if (items.length === 0)
		return mode === 'edit' ? <Placeholder>Add tabs in the inspector</Placeholder> : null;
	const current = items[Math.min(active, items.length - 1)];
	return (
		<div className='space-y-3'>
			<div
				role='tablist'
				className='flex gap-1 overflow-x-auto rounded-[calc(var(--pg-radius)*0.8)] bg-[var(--pg-subtle)] p-1'>
				{items.map((item, index) => (
					<button
						key={index}
						type='button'
						role='tab'
						aria-selected={index === active}
						onClick={() => setActive(index)}
						className={`h-9 shrink-0 rounded-[calc(var(--pg-radius)*0.6)] px-4 text-sm font-semibold whitespace-nowrap transition ${
							index === active
								? 'bg-[var(--pg-surface)] text-[var(--pg-text)] shadow-sm'
								: 'text-[var(--pg-muted)] hover:text-[var(--pg-text)]'
						}`}>
						{item.label || `Tab ${index + 1}`}
					</button>
				))}
			</div>
			<div role='tabpanel'>
				{current.markdown ? (
					<PageMarkdown className='text-[var(--pg-text)]/85'>
						{current.markdown}
					</PageMarkdown>
				) : (
					mode === 'edit' && (
						<p className='text-sm text-[var(--pg-muted)] italic'>This tab is empty.</p>
					)
				)}
			</div>
		</div>
	);
};

const remaining = (target: number, now: number) => {
	const total = Math.max(0, Math.floor((target - now) / 1000));
	return {
		total,
		days: Math.floor(total / 86400),
		hours: Math.floor((total % 86400) / 3600),
		minutes: Math.floor((total % 3600) / 60),
		seconds: total % 60,
	};
};

export const CountdownBlock = ({
	block,
	mode,
}: {
	block: TPageBlockOf<'countdown'>;
	mode: TPageMode;
}) => {
	const { target, label, ended_text: endedText, show_seconds: showSeconds } = block.props;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!target) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [target]);

	if (!target)
		return mode === 'edit' ? (
			<Placeholder icon={<Timer size={16} />}>
				Pick a date and time in the inspector
			</Placeholder>
		) : null;
	const left = remaining(new Date(target).getTime(), now);

	if (left.total === 0) {
		return (
			<p className='text-center text-sm font-bold text-[var(--pg-accent)]'>
				{endedText || 'It’s started!'}
			</p>
		);
	}

	const parts = [
		{ value: left.days, unit: 'Days' },
		{ value: left.hours, unit: 'Hours' },
		{ value: left.minutes, unit: 'Minutes' },
		...(showSeconds ? [{ value: left.seconds, unit: 'Seconds' }] : []),
	];

	return (
		<div className='space-y-3 text-center'>
			{label && (
				<p className='text-xs font-bold tracking-wide text-[var(--pg-muted)] uppercase'>
					{label}
				</p>
			)}
			<div className='flex justify-center gap-2' role='timer' aria-live='off'>
				{parts.map((part) => (
					<div
						key={part.unit}
						className='min-w-16 rounded-[var(--pg-radius)] bg-[var(--pg-subtle)] px-3 py-3'>
						<span className='block text-2xl font-extrabold tabular-nums'>
							{String(part.value).padStart(2, '0')}
						</span>
						<span className='block text-[10px] font-semibold tracking-wide text-[var(--pg-muted)] uppercase'>
							{part.unit}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
