/**
 * Field styling shared by the Security cards — same shape the other settings
 * screens use for their inputs, kept in one place here because three partials
 * render the same kind of form.
 */
export const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

export const labelClass =
	'mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300';

export const errorClass = 'mt-1.5 text-xs font-semibold text-red-500';

export const cardClass =
	'mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
