import { createContext, useContext, useState, type ReactNode } from 'react';
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import type { TAgentCitation } from '@/types/agent.type';
import { citationTitle } from '../_helper/citations.helper';

/** The sources of the reply being rendered, by ref, for its citation chips. */
const CitationsContext = createContext<Map<string, TAgentCitation>>(new Map());

export const CitationsProvider = ({
	citations,
	children,
}: {
	citations?: TAgentCitation[];
	children: ReactNode;
}) => {
	const byRef = new Map(
		(citations ?? []).map((citation) => [citation.ref.toUpperCase(), citation]),
	);
	return <CitationsContext.Provider value={byRef}>{children}</CitationsContext.Provider>;
};

/**
 * One inline citation, `[1]`: hover or focus it (tap, on a phone) to see the
 * source it points at. While the reply is still streaming its source isn't
 * known yet, so the chip shows only the number.
 */
export const CitationChip = ({ citationRef, label }: { citationRef: string; label: ReactNode }) => {
	const citation = useContext(CitationsContext).get(citationRef.toUpperCase());

	return (
		<span className='group/cite relative inline-block align-baseline'>
			<button
				type='button'
				aria-label={
					citation
						? `Source ${citation.number}: ${citationTitle(citation)}`
						: `Source ${String(label)}`
				}
				className='text-primary-700 dark:text-primary-300 bg-primary-400/15 hover:bg-primary-400/30 focus-visible:ring-primary-400 ml-0.5 inline-flex h-[17px] min-w-[17px] -translate-y-0.5 items-center justify-center rounded px-1 align-middle text-[10.5px] leading-none font-black outline-none focus-visible:ring-2'>
				{label}
			</button>
			{citation && (
				<span
					role='tooltip'
					className='invisible absolute bottom-full left-1/2 z-30 mb-1.5 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-3 text-left opacity-0 shadow-lg transition-opacity group-focus-within/cite:visible group-focus-within/cite:opacity-100 group-hover/cite:visible group-hover/cite:opacity-100 dark:border-zinc-700 dark:bg-zinc-900'>
					<span className='flex items-center gap-1.5 text-[12px] font-black text-zinc-800 dark:text-zinc-100'>
						<BookOpen size={12} className='shrink-0 text-zinc-400' />
						<span className='truncate'>{citationTitle(citation)}</span>
					</span>
					{citation.collection && citation.collection !== citation.source && (
						<span className='mt-0.5 block truncate text-[11px] font-semibold text-zinc-400'>
							{citation.collection}
						</span>
					)}
					{citation.snippet && (
						<span className='mt-1.5 line-clamp-5 block text-[11.5px] leading-relaxed font-semibold whitespace-pre-line text-zinc-600 dark:text-zinc-300'>
							{citation.snippet}
						</span>
					)}
					{citation.url && (
						<a
							href={citation.url}
							target='_blank'
							rel='noreferrer'
							className='text-primary-600 dark:text-primary-400 mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold hover:underline'>
							Open source <ExternalLink size={10} />
						</a>
					)}
				</span>
			)}
		</span>
	);
};

/**
 * The sources a reply cites, listed under it in citation order: what each
 * `[n]` points at, with the passage the agent was given.
 */
export const MessageSources = ({ citations }: { citations?: TAgentCitation[] }) => {
	const [open, setOpen] = useState(false);

	if (!citations || citations.length === 0) return null;

	return (
		<div className='mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<button
				type='button'
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
				className='flex min-h-9 w-full items-center gap-2 px-3 text-left text-[12px] font-bold text-zinc-600 dark:text-zinc-300'>
				<BookOpen size={13} className='shrink-0 text-zinc-400' />
				{citations.length === 1 ? '1 source' : `${citations.length} sources`}
				<span className='min-w-0 flex-1 truncate font-semibold text-zinc-400'>
					· {citations.map(citationTitle).join(', ')}
				</span>
				<ChevronDown
					size={14}
					className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</button>
			{open && (
				<ol className='space-y-2 border-t border-zinc-200/80 px-3 py-2.5 dark:border-zinc-800'>
					{citations.map((citation) => (
						<li key={citation.ref} className='flex min-w-0 gap-2'>
							<span className='text-primary-700 dark:text-primary-300 bg-primary-400/15 mt-0.5 inline-flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded px-1 text-[10.5px] font-black'>
								{citation.number}
							</span>
							<div className='min-w-0'>
								<div className='flex min-w-0 flex-wrap items-center gap-x-1.5 text-[12px] font-bold text-zinc-800 dark:text-zinc-100'>
									{citation.url ? (
										<a
											href={citation.url}
											target='_blank'
											rel='noreferrer'
											className='hover:text-primary-600 dark:hover:text-primary-400 inline-flex min-w-0 items-center gap-1 [overflow-wrap:anywhere] underline-offset-2 hover:underline'>
											{citationTitle(citation)}{' '}
											<ExternalLink size={10} className='shrink-0' />
										</a>
									) : (
										<span className='[overflow-wrap:anywhere]'>
											{citationTitle(citation)}
										</span>
									)}
									{citation.collection &&
										citation.collection !== citation.source && (
											<span className='text-[11px] font-semibold text-zinc-400'>
												{citation.collection}
											</span>
										)}
								</div>
								{citation.snippet && (
									<p className='mt-0.5 line-clamp-3 text-[11.5px] leading-relaxed font-semibold whitespace-pre-line text-zinc-500 dark:text-zinc-400'>
										{citation.snippet}
									</p>
								)}
							</div>
						</li>
					))}
				</ol>
			)}
		</div>
	);
};
