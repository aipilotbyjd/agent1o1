import { AlertTriangle, CheckCircle2, Clock, ImageIcon, Info, Loader2, OctagonAlert, Play, TriangleAlert, Unplug } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageAlign, TPageBlockOf } from '@/types/workflow-page.type';
import PageField from './PageField';
import PageMarkdown from './PageMarkdown';
import { CopyValueButton, PageOutputBody } from './PageOutputValue';
import type { TPageRun } from './usePageRun';

/** `edit` draws the page for the builder: nothing is typed into or run. */
export type TPageMode = 'live' | 'edit';

const ALIGN: Record<TPageAlign, string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right',
};

const Placeholder = ({ children }: { children: ReactNode }) => (
	<span className='text-[var(--pg-muted)] italic opacity-70'>{children}</span>
);

export const humanize = (name: string) => {
	const spaced = name.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const HeadingBlock = ({ block, mode }: { block: TPageBlockOf<'heading'>; mode: TPageMode }) => {
	const { text, level, align } = block.props;
	const content = text || (mode === 'edit' ? <Placeholder>Heading</Placeholder> : null);
	if (!content) return null;
	const className = `${ALIGN[align]} tracking-tight break-words text-[var(--pg-text)]`;
	if (level === 1) return <h1 className={`${className} text-3xl leading-tight font-extrabold`}>{content}</h1>;
	if (level === 3) return <h3 className={`${className} text-base font-bold`}>{content}</h3>;
	return <h2 className={`${className} text-xl font-bold`}>{content}</h2>;
};

export const TextBlock = ({ block, mode }: { block: TPageBlockOf<'text'>; mode: TPageMode }) =>
	block.props.markdown ? (
		<PageMarkdown className={`${ALIGN[block.props.align]} text-[var(--pg-text)]/85`}>
			{block.props.markdown}
		</PageMarkdown>
	) : mode === 'edit' ? (
		<p className='text-sm'>
			<Placeholder>Write something…</Placeholder>
		</p>
	) : null;

const IMAGE_HEIGHT = { sm: 'h-[160px]', md: 'h-[260px]', lg: 'h-[380px]', auto: 'h-auto' } as const;

export const ImageBlock = ({ block, mode }: { block: TPageBlockOf<'image'>; mode: TPageMode }) => {
	const { url, alt, fit, height } = block.props;
	if (!url) {
		return mode === 'edit' ? (
			<div
				className={`flex ${height === 'auto' ? 'h-[160px]' : IMAGE_HEIGHT[height]} flex-col items-center justify-center gap-2 rounded-[var(--pg-radius)] border border-dashed border-[var(--pg-border)] bg-[var(--pg-subtle)] text-xs text-[var(--pg-muted)]`}>
				<ImageIcon size={22} />
				Add an image link in the inspector
			</div>
		) : null;
	}
	return (
		<img
			src={url}
			alt={alt ?? ''}
			className={`w-full ${IMAGE_HEIGHT[height]} rounded-[var(--pg-radius)] ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
		/>
	);
};

export const DividerBlock = ({ block }: { block: TPageBlockOf<'divider'> }) => (
	<hr
		className={`my-1 border-t border-[var(--pg-border)] ${block.props.style === 'dashed' ? 'border-dashed' : ''}`}
	/>
);

const SPACER = { sm: 'h-3', md: 'h-8', lg: 'h-14', xl: 'h-24' } as const;

export const SpacerBlock = ({ block, mode }: { block: TPageBlockOf<'spacer'>; mode: TPageMode }) => (
	<div
		aria-hidden
		className={`${SPACER[block.props.size]} ${mode === 'edit' ? 'rounded-md bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--pg-subtle)_6px,var(--pg-subtle)_12px)]' : ''}`}
	/>
);

const CALLOUT = {
	info: { Icon: Info, className: 'border-sky-500/30 bg-sky-500/10 [--callout:var(--color-sky-500)]' },
	success: { Icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 [--callout:var(--color-emerald-500)]' },
	warning: { Icon: TriangleAlert, className: 'border-amber-500/30 bg-amber-500/10 [--callout:var(--color-amber-500)]' },
	danger: { Icon: OctagonAlert, className: 'border-rose-500/30 bg-rose-500/10 [--callout:var(--color-rose-500)]' },
} as const;

export const CalloutBlock = ({ block, mode }: { block: TPageBlockOf<'callout'>; mode: TPageMode }) => {
	const { tone, title, markdown } = block.props;
	const { Icon, className } = CALLOUT[tone];
	return (
		<div className={`flex gap-3 rounded-[var(--pg-radius)] border p-4 ${className}`}>
			<Icon size={18} className='mt-0.5 shrink-0 text-[var(--callout)]' />
			<div className='min-w-0 space-y-1'>
				{title && <p className='text-sm font-bold'>{title}</p>}
				{markdown ? (
					<PageMarkdown>{markdown}</PageMarkdown>
				) : (
					mode === 'edit' && !title && <Placeholder>Callout text</Placeholder>
				)}
			</div>
		</div>
	);
};

export const FieldBlock = ({
	block,
	field,
	mode,
	run,
}: {
	block: TPageBlockOf<'field'>;
	field?: TWorkflowInterfaceField;
	mode: TPageMode;
	run?: TPageRun;
}) => {
	if (!field) {
		return mode === 'edit' ? (
			<div className='flex items-center gap-2.5 rounded-[var(--pg-radius)] border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-3 text-xs font-semibold text-amber-700'>
				<Unplug size={15} className='shrink-0' />
				{block.props.field_key
					? `The workflow has no input called “${block.props.field_key}”. Pick one in the inspector.`
					: 'Pick which workflow input this field fills in.'}
			</div>
		) : null;
	}
	const busy = run?.phase === 'submitting' || run?.phase === 'running';
	return (
		<PageField
			id={`page-field-${block.id}`}
			field={field}
			props={block.props}
			value={run ? run.values[field.key] : field.type === 'boolean' ? false : ''}
			error={run?.errors[field.key]}
			disabled={mode === 'edit' || busy}
			onChange={(value) => run?.setValue(field.key, value)}
		/>
	);
};

const SUBMIT_ALIGN = {
	left: 'justify-start',
	center: 'justify-center',
	right: 'justify-end',
	stretch: '[&>button]:w-full',
} as const;

export const SubmitBlock = ({ block, mode, run }: { block: TPageBlockOf<'submit'>; mode: TPageMode; run?: TPageRun }) => {
	const busy = run?.phase === 'submitting' || run?.phase === 'running';
	return (
		<div className='space-y-2'>
			<div className={`flex ${SUBMIT_ALIGN[block.props.align]}`}>
				<button
					type={mode === 'edit' ? 'button' : 'submit'}
					disabled={busy}
					tabIndex={mode === 'edit' ? -1 : undefined}
					className='inline-flex h-11 items-center justify-center gap-2 rounded-[calc(var(--pg-radius)*0.8)] bg-[var(--pg-accent)] px-6 text-sm font-bold text-[var(--pg-accent-fg)] shadow-sm transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-[var(--pg-accent-soft)] focus-visible:outline-none active:scale-[0.99] disabled:cursor-progress disabled:opacity-75'>
					{busy ? <Loader2 size={16} className='animate-spin' /> : <Play size={15} className='fill-current' />}
					{busy ? block.props.running_label : block.props.label}
				</button>
			</div>
			{run?.formError && (
				<p role='alert' className='flex items-start gap-1.5 text-xs font-medium text-rose-500'>
					<AlertTriangle size={13} className='mt-px shrink-0' />
					{run.formError}
				</p>
			)}
		</div>
	);
};

export const OutputBlock = ({ block, mode, run }: { block: TPageBlockOf<'output'>; mode: TPageMode; run?: TPageRun }) => {
	const { output_name: name, label, display, empty_text: emptyText, copyable } = block.props;
	const result = run?.result;
	const hasValue = result?.state === 'completed' && name in result.outputs;
	const value = hasValue ? result.outputs[name] : undefined;
	const busy = run?.phase === 'submitting' || run?.phase === 'running';

	return (
		<section className='overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)]'>
			<header className='flex min-h-10 items-center justify-between gap-2 border-b border-[var(--pg-border)] bg-[var(--pg-subtle)]/60 px-3.5 py-1.5'>
				<h3 className='truncate text-xs font-bold tracking-wide text-[var(--pg-muted)] uppercase'>
					{label || (name ? humanize(name) : 'Output')}
				</h3>
				{hasValue && copyable && <CopyValueButton value={value} />}
			</header>
			<div className='p-4'>
				{hasValue ? (
					<PageOutputBody value={value} display={display} />
				) : busy ? (
					<div className='space-y-2' aria-label='Waiting for the result'>
						<div className='h-3 w-3/4 animate-pulse rounded bg-[var(--pg-subtle)]' />
						<div className='h-3 w-1/2 animate-pulse rounded bg-[var(--pg-subtle)]' />
						<div className='h-3 w-2/3 animate-pulse rounded bg-[var(--pg-subtle)]' />
					</div>
				) : (
					<p className='text-sm text-[var(--pg-muted)]'>
						{mode === 'edit' && name ? (
							<>
								Shows <code className='rounded bg-[var(--pg-subtle)] px-1 font-mono text-xs'>{name}</code> from the workflow
							</>
						) : result?.state === 'completed' ? (
							'The workflow finished without returning this.'
						) : (
							emptyText || 'The result will appear here.'
						)}
					</p>
				)}
			</div>
		</section>
	);
};

const seconds = (from: string | null, to: string | null) => {
	if (!from || !to) return null;
	const value = Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
	return value < 10 ? value.toFixed(1) : Math.round(value).toString();
};

export const StatusBlock = ({ block, run }: { block: TPageBlockOf<'status'>; run?: TPageRun }) => {
	const result = run?.result;
	const phase = run?.phase ?? 'idle';
	const { completed, total } = result?.progress ?? { completed: 0, total: 0 };
	const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

	const row = (icon: ReactNode, text: ReactNode, tone = 'text-[var(--pg-muted)]') => (
		<div className={`flex items-center gap-2 text-sm font-semibold ${tone}`}>
			{icon}
			<span className='min-w-0'>{text}</span>
		</div>
	);

	if (phase === 'idle' && !result) {
		return row(<Clock size={15} />, block.props.idle_text || 'Fill in the form and press Run.');
	}

	if (result?.state === 'failed') {
		return (
			<div className='rounded-[var(--pg-radius)] border border-rose-500/30 bg-rose-500/10 p-3.5'>
				{row(<OctagonAlert size={16} />, result.error || 'The workflow could not finish.', 'text-rose-600')}
			</div>
		);
	}

	if (result?.state === 'completed') {
		const took = seconds(result.started_at, result.finished_at);
		return row(<CheckCircle2 size={16} />, took ? `Done in ${took}s` : 'Done', 'text-emerald-600');
	}

	return (
		<div className='space-y-2'>
			{row(
				<Loader2 size={15} className='animate-spin text-[var(--pg-accent)]' />,
				result?.state === 'waiting'
					? 'Waiting for someone to review a step…'
					: block.props.show_progress && total > 0
						? `Running… ${completed} of ${total} steps`
						: 'Running…',
				'text-[var(--pg-text)]',
			)}
			{block.props.show_progress && (
				<div className='h-1.5 overflow-hidden rounded-full bg-[var(--pg-subtle)]'>
					<div
						className='h-full rounded-full bg-[var(--pg-accent)] transition-[width] duration-500'
						style={{ width: `${Math.max(phase === 'submitting' ? 4 : 8, percent)}%` }}
					/>
				</div>
			)}
		</div>
	);
};
