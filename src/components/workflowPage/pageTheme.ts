import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import type { TPageBlockWidth, TPageTheme } from '@/types/workflow-page.type';

// A page brings its own look, so it is styled from CSS variables set on its
// root rather than from the app's `dark:` variants: a light page has to stay
// light inside the dark builder, and the reverse.

const LIGHT = {
	'--pg-bg': '#f6f6f8',
	'--pg-surface': '#ffffff',
	'--pg-subtle': '#f4f4f5',
	'--pg-text': '#18181b',
	'--pg-muted': '#71717a',
	'--pg-border': '#e4e4e7',
};

/** Exported for sections with a dark or image background inside a light page. */
export const DARK = {
	'--pg-bg': '#09090b',
	'--pg-surface': '#141417',
	'--pg-subtle': '#1f1f23',
	'--pg-text': '#fafafa',
	'--pg-muted': '#a1a1aa',
	'--pg-border': '#2a2a30',
};

const RADIUS: Record<TPageTheme['radius'], string> = {
	none: '0px',
	sm: '6px',
	md: '10px',
	lg: '14px',
	xl: '20px',
};

const FONT: Record<TPageTheme['font'], string> = {
	sans: 'inherit',
	serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
	mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

/** In px: the root font size is about 13px, so rem widths come out narrow. */
export const PAGE_WIDTH: Record<TPageTheme['width'], number> = {
	narrow: 560,
	medium: 720,
	wide: 960,
};

export const PAGE_BLOCK_SPAN: Record<TPageBlockWidth, string> = {
	full: 'col-span-6',
	two_thirds: 'col-span-6 @xl:col-span-4',
	half: 'col-span-6 @xl:col-span-3',
	third: 'col-span-6 @xl:col-span-2',
};

/** Black or white, whichever reads better on the accent colour. */
const contrastText = (hex: string) => {
	const value = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
	const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
	return luminance > 0.45 ? '#0a0a0a' : '#ffffff';
};

const backgroundImage = (theme: TPageTheme) => {
	switch (theme.background) {
		case 'dots':
			return 'radial-gradient(color-mix(in srgb, var(--pg-text) 14%, transparent) 1px, transparent 1px)';
		case 'gradient':
			return 'linear-gradient(180deg, color-mix(in srgb, var(--pg-accent) 22%, var(--pg-bg)) 0px, var(--pg-bg) 520px)';
		default:
			return undefined;
	}
};

export const pageThemeStyle = (theme: TPageTheme, dark: boolean): CSSProperties =>
	({
		...(dark ? DARK : LIGHT),
		'--pg-accent': theme.accent,
		'--pg-accent-fg': contrastText(theme.accent),
		'--pg-accent-soft': 'color-mix(in srgb, var(--pg-accent) 12%, transparent)',
		'--pg-radius': RADIUS[theme.radius],
		fontFamily: FONT[theme.font],
		color: 'var(--pg-text)',
		backgroundColor:
			theme.background === 'soft'
				? 'color-mix(in srgb, var(--pg-accent) 5%, var(--pg-bg))'
				: 'var(--pg-bg)',
		backgroundImage: backgroundImage(theme),
		backgroundSize: theme.background === 'dots' ? '18px 18px' : undefined,
	}) as CSSProperties;

const darkQuery = '(prefers-color-scheme: dark)';

const subscribe = (onChange: () => void) => {
	const query = window.matchMedia(darkQuery);
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
};

/** Whether a page renders dark: its own setting, or the visitor's system for `auto`. */
export const usePageDark = (appearance: TPageTheme['appearance']) => {
	const systemDark = useSyncExternalStore(
		subscribe,
		() => window.matchMedia(darkQuery).matches,
		() => false,
	);
	return appearance === 'auto' ? systemDark : appearance === 'dark';
};
