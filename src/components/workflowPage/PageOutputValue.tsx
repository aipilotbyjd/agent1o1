import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { TPageBlockProps } from '@/types/workflow-page.type';
import PageMarkdown from './PageMarkdown';

type TDisplay = TPageBlockProps['output']['display'];

const isHttpUrl = (value: unknown): value is string =>
	typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim());

const looksLikeImage = (value: string) =>
	/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(value.trim());

const looksLikeMarkdown = (value: string) => /(^|\n)\s*(#{1,6}\s|[-*]\s|\d+\.\s|>\s)|\*\*|`/.test(value);

const isRowList = (value: unknown): value is Record<string, unknown>[] =>
	Array.isArray(value) &&
	value.length > 0 &&
	value.every((row) => row !== null && typeof row === 'object' && !Array.isArray(row));

/** What `auto` shows a value as, from what it looks like. */
const autoDisplay = (value: unknown): Exclude<TDisplay, 'auto'> => {
	if (typeof value === 'string') {
		if (isHttpUrl(value)) return looksLikeImage(value) ? 'image' : 'link';
		return looksLikeMarkdown(value) ? 'markdown' : 'text';
	}
	if (isRowList(value)) return 'table';
	if (value !== null && typeof value === 'object') return 'json';
	return 'text';
};

const asText = (value: unknown) =>
	typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value, null, 2);

const cell = (value: unknown) =>
	value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);

const Table = ({ rows }: { rows: Record<string, unknown>[] }) => {
	const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
	return (
		<div className='overflow-x-auto rounded-[calc(var(--pg-radius)*0.7)] border border-[var(--pg-border)]'>
			<table className='w-full text-left text-xs'>
				<thead className='bg-[var(--pg-subtle)]'>
					<tr>
						{columns.map((column) => (
							<th key={column} className='px-3 py-2 font-bold whitespace-nowrap'>
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={index} className='border-t border-[var(--pg-border)]'>
							{columns.map((column) => (
								<td key={column} className='px-3 py-2 align-top'>
									{cell(row[column])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export const PageOutputBody = ({ value, display }: { value: unknown; display: TDisplay }) => {
	const shown = display === 'auto' ? autoDisplay(value) : display;

	switch (shown) {
		case 'markdown':
			return <PageMarkdown>{asText(value)}</PageMarkdown>;
		case 'json':
			return (
				<pre className='max-h-[420px] overflow-auto rounded-[calc(var(--pg-radius)*0.7)] bg-[var(--pg-subtle)] p-3 font-mono text-xs leading-relaxed'>
					{JSON.stringify(value, null, 2)}
				</pre>
			);
		case 'table':
			return isRowList(value) ? (
				<Table rows={value} />
			) : (
				<PageOutputBody value={value} display='json' />
			);
		case 'image':
			return isHttpUrl(value) ? (
				<img
					src={value.trim()}
					alt=''
					className='max-h-[480px] max-w-full rounded-[calc(var(--pg-radius)*0.7)] border border-[var(--pg-border)] object-contain'
				/>
			) : (
				<PageOutputBody value={value} display='text' />
			);
		case 'link':
			return isHttpUrl(value) ? (
				<a
					href={value.trim()}
					target='_blank'
					rel='noopener noreferrer nofollow'
					className='inline-flex items-center gap-1.5 text-sm font-semibold break-all text-[var(--pg-accent)] underline underline-offset-2'>
					{value.trim()}
					<ExternalLink size={13} className='shrink-0' />
				</a>
			) : (
				<PageOutputBody value={value} display='text' />
			);
		default:
			return <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{asText(value)}</p>;
	}
};

export const CopyValueButton = ({ value }: { value: unknown }) => {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type='button'
			onClick={() => {
				navigator.clipboard.writeText(asText(value)).then(() => {
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1600);
				});
			}}
			aria-label={copied ? 'Copied' : 'Copy'}
			className='inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--pg-muted)] transition hover:bg-[var(--pg-subtle)] hover:text-[var(--pg-text)]'>
			{copied ? <Check size={13} /> : <Copy size={13} />}
			{copied ? 'Copied' : 'Copy'}
		</button>
	);
};
