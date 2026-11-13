import type { TAgentCitation } from '@/types/agent.type';

/**
 * A citation marker in an agent reply: one or more refs in square brackets,
 * `[K1A2B3C]` or `[K1A2B3C, D4E5F6A]`. Mirrors `KnowledgeCitations::MARKER`
 * on the backend.
 */
const CITATION_MARKER = /\[\s*([KD][0-9A-F]{6}(?:\s*[,;]\s*[KD][0-9A-F]{6})*)\s*\]/gi;

/** Stands in for a dropped marker until the space before it is removed. */
const DROPPED = '\uE000';

/** The href a citation chip is rendered from: see `linkCitations()`. */
export const CITATION_HREF_PREFIX = '#cite-';

const splitRefs = (group: string) =>
	group
		.toUpperCase()
		.split(/\s*[,;]\s*/)
		.map((ref) => ref.trim())
		.filter(Boolean);

/**
 * Rewrites a reply's citation markers as markdown links the chat renders as
 * numbered chips: `[K1A2B3C]` becomes `[1](#cite-K1A2B3C)`.
 *
 * With the reply's resolved `citations`, each ref takes its number from
 * there and a ref that resolved to nothing (a made-up source) is dropped.
 * While the reply is still streaming there are none yet, so refs are
 * numbered in the order they appear, which is the order the backend uses.
 */
export const linkCitations = (text: string, citations?: TAgentCitation[]): string => {
	if (!text.includes('[')) return text;

	const numbers = new Map<string, number>();
	citations?.forEach((citation) => numbers.set(citation.ref.toUpperCase(), citation.number));
	const final = citations !== undefined;

	const linked = text.replace(CITATION_MARKER, (_match, group: string) => {
		const chips = splitRefs(group)
			.map((ref) => {
				if (!numbers.has(ref) && !final) numbers.set(ref, numbers.size + 1);
				const number = numbers.get(ref);
				return number === undefined ? null : `[${number}](${CITATION_HREF_PREFIX}${ref})`;
			})
			.filter(
				(chip, index, all): chip is string => chip !== null && all.indexOf(chip) === index,
			);

		return chips.length > 0 ? chips.join('') : DROPPED;
	});

	// A dropped marker takes the space before it along, so "days [KFAKE1]."
	// reads "days.", not "days .".
	return linked.replace(/[ \t]*\uE000/g, '');
};

/** The ref a chip's href names, or null for an ordinary link. */
export const citationRefFromHref = (href?: string): string | null =>
	href?.startsWith(CITATION_HREF_PREFIX) ? href.slice(CITATION_HREF_PREFIX.length) : null;

/** The name a source is shown under. */
export const citationTitle = (citation: TAgentCitation) =>
	citation.source ||
	citation.collection ||
	(citation.kind === 'document' ? 'Document' : 'Knowledge base');
