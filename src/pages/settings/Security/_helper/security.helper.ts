import { formatDistanceToNow } from 'date-fns';

export const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/25';

export const cardClass =
	'rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950';

export const errorClass = 'mt-1.5 text-xs font-semibold text-red-500';

export const relativeTime = (iso: string | null | undefined) => {
	if (!iso) return null;
	try {
		return formatDistanceToNow(new Date(iso), { addSuffix: true });
	} catch {
		return null;
	}
};

export const formatDateTime = (iso: string | null | undefined) => {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(date);
};

/**
 * A readable "Chrome on macOS" from a user-agent string. Deliberately coarse:
 * it only has to tell a person's own devices apart, and a wrong guess is
 * worse than a plain "Unknown device".
 */
export const describeUserAgent = (ua: string | null | undefined) => {
	if (!ua) return 'Unknown device';
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\//.test(ua)
			? 'Opera'
			: /Firefox\//.test(ua)
				? 'Firefox'
				: /Chrome\//.test(ua)
					? 'Chrome'
					: /Safari\//.test(ua)
						? 'Safari'
						: /curl|PostmanRuntime|axios|python-requests|okhttp/i.test(ua)
							? 'API client'
							: null;
	const os = /iPhone|iPad|iPod/.test(ua)
		? 'iOS'
		: /Android/.test(ua)
			? 'Android'
			: /Mac OS X|Macintosh/.test(ua)
				? 'macOS'
				: /Windows/.test(ua)
					? 'Windows'
					: /Linux/.test(ua)
						? 'Linux'
						: null;
	if (browser && os) return `${browser} on ${os}`;
	return browser ?? os ?? 'Unknown device';
};
