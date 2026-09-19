/**
 * Shared button styles for Settings pages — keeps every primary/secondary
 * action button visually consistent (height, radius, padding, colour, states).
 */

// Primary action button — brand lime fill with dark text.
export const primaryBtn =
	'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-400 px-5 text-sm font-bold text-primary-950 shadow-sm shadow-primary-500/20 transition hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60';

// Secondary action button — neutral outline.
export const secondaryBtn =
	'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700';

// Destructive action button.
export const dangerBtn =
	'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60';
