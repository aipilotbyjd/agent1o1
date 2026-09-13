import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ============================================================
// Formatters
// ------------------------------------------------------------
// Display helpers shared by every list and detail screen. All of
// them take the nullable shapes the API actually returns — a run
// that never started has no duration, a window where nothing
// finished has no success rate — and render an em dash rather
// than "0", which would read as a real measurement.
// ============================================================

const EMPTY = '—';

/** Wall-clock duration from a millisecond count. Sub-second values keep a
 *  decimal so a fast node doesn't flatten to "0s". */
export const formatDuration = (ms: number | null | undefined): string => {
	if (ms === null || ms === undefined) return EMPTY;
	if (ms < 1000) return `${Math.round(ms)}ms`;

	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;

	const minutes = Math.floor(seconds / 60);
	const restSeconds = Math.round(seconds % 60);
	if (minutes < 60) return `${minutes}m ${restSeconds}s`;

	const hours = Math.floor(minutes / 60);
	return `${hours}h ${minutes % 60}m`;
};

/** Duration from a second count — what `waiting_seconds` reports. */
export const formatSeconds = (seconds: number | null | undefined): string =>
	seconds === null || seconds === undefined ? EMPTY : formatDuration(seconds * 1000);

/** "3 minutes ago". Takes the ISO strings the API sends. */
export const formatRelative = (iso: string | null | undefined): string =>
	iso ? dayjs(iso).fromNow() : EMPTY;

export const formatDateTime = (iso: string | null | undefined): string =>
	iso ? dayjs(iso).format('DD MMM YYYY, HH:mm') : EMPTY;

/** Thousands separators, and compact notation past 10k so a tile's
 *  number can't push its own card wider. */
export const formatNumber = (value: number | null | undefined): string => {
	if (value === null || value === undefined) return EMPTY;
	if (Math.abs(value) >= 10_000) {
		return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
			value,
		);
	}
	return value.toLocaleString('en-US');
};

/** `success_rate` arrives as a 0–1 ratio, null when nothing finished. */
export const formatRatio = (ratio: number | null | undefined, fractionDigits = 0): string =>
	ratio === null || ratio === undefined ? EMPTY : `${(ratio * 100).toFixed(fractionDigits)}%`;

/** Turns a snake_case enum value into something readable —
 *  `awaiting_approval` → `Awaiting approval`. */
export const humanize = (value: string | null | undefined): string => {
	if (!value) return EMPTY;
	const spaced = value.replace(/[_-]+/g, ' ');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export { EMPTY as EMPTY_VALUE };
