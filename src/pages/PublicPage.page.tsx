import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';
import { ApiError } from '@/api/core';
import {
	publicPageKeys,
	trackPublicPageEvent,
	usePublicPage,
	usePublicPageSubmission,
	useSubmitPublicPage,
	useUnlockPublicPage,
} from '@/api/modules/public-pages';
import PageBlocks, { TPageFormState } from '@/components/public-page/PageBlocks';
import PoweredByBadge from '@/components/public-page/PoweredByBadge';
import type {
	TPageBlock,
	TPageField,
	TPageSubmission,
	TPageTheme,
	TPublicPage,
} from '@/types/public-page.type';

// ============================================================
// Public Page
// ------------------------------------------------------------
// A published workflow page at its link (`/p/:token`). Visitors
// need no account: they fill in the form, the workflow runs, and
// the result shows here. The "Made with Agent1o1" badge at the
// foot links to signup with the creator's referral code.
// ============================================================

const WIDTH: Record<TPageTheme['width'], string> = {
	narrow: 'max-w-xl',
	medium: 'max-w-3xl',
	wide: 'max-w-5xl',
};

const FONT_FAMILY: Record<string, string> = {
	sans: 'ui-sans-serif, system-ui, sans-serif',
	serif: 'ui-serif, Georgia, serif',
	mono: 'ui-monospace, SFMono-Regular, monospace',
	inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
	dm_sans: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
	manrope: 'Manrope, ui-sans-serif, system-ui, sans-serif',
	poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
	space_grotesk: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
	outfit: 'Outfit, ui-sans-serif, system-ui, sans-serif',
	playfair: '"Playfair Display", ui-serif, Georgia, serif',
	lora: 'Lora, ui-serif, Georgia, serif',
	fraunces: 'Fraunces, ui-serif, Georgia, serif',
	jetbrains_mono: '"JetBrains Mono", ui-monospace, monospace',
};

const accessStorageKey = (token: string) => `agent1o1.page_access.${token}`;

const readAccessToken = (token: string): string | null => {
	try {
		return sessionStorage.getItem(accessStorageKey(token));
	} catch {
		return null;
	}
};

const writeAccessToken = (token: string, value: string) => {
	try {
		sessionStorage.setItem(accessStorageKey(token), value);
	} catch {
		// Storage blocked: the token lives in state for this visit only.
	}
};

const usePrefersDark = () => {
	const query = '(prefers-color-scheme: dark)';
	const [prefersDark, setPrefersDark] = useState(
		() => typeof window !== 'undefined' && window.matchMedia?.(query).matches,
	);

	useEffect(() => {
		const media = window.matchMedia?.(query);
		if (!media) return undefined;
		const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	}, []);

	return prefersDark;
};

const collectFields = (blocks: TPageBlock[]): TPageField[] =>
	blocks.flatMap((block) => [
		// The label the page shows, so error messages name the field the same way.
		...(block.type === 'field' && block.field
			? [{ ...block.field, label: block.props.label ?? block.field.label }]
			: []),
		...collectFields(block.children ?? []),
	]);

const initialValues = (fields: TPageField[]): Record<string, unknown> =>
	Object.fromEntries(
		fields.map((field) => {
			if (
				field.type === 'json' &&
				field.default != null &&
				typeof field.default !== 'string'
			) {
				return [field.key, JSON.stringify(field.default, null, 2)];
			}
			return [field.key, field.default ?? (field.type === 'boolean' ? false : '')];
		}),
	);

/**
 * Turns form values into the run's `input`, or field errors when a
 * required value is missing or a number / JSON value doesn't parse.
 */
const buildInput = (
	fields: TPageField[],
	values: Record<string, unknown>,
): { input: Record<string, unknown>; errors: Record<string, string> } => {
	const input: Record<string, unknown> = {};
	const errors: Record<string, string> = {};

	for (const field of fields) {
		const raw = values[field.key];
		const isEmpty = raw === undefined || raw === null || raw === '';

		if (isEmpty) {
			if (field.required) errors[field.key] = `${field.label} is required.`;
			continue;
		}

		if (field.type === 'number') {
			const number = Number(raw);
			if (Number.isNaN(number)) {
				errors[field.key] = `${field.label} must be a number.`;
				continue;
			}
			input[field.key] = number;
		} else if (field.type === 'json' && typeof raw === 'string') {
			try {
				input[field.key] = JSON.parse(raw);
			} catch {
				errors[field.key] = `${field.label} must be valid JSON.`;
			}
		} else {
			input[field.key] = raw;
		}
	}

	return { input, errors };
};

/** `input.topic` → `topic`, so API validation errors land on their field. */
const fieldErrorsFrom = (error: ApiError): Record<string, string> =>
	Object.fromEntries(
		Object.entries(error.fieldErrors()).map(([key, message]) => [
			key.replace(/^input\./, ''),
			message,
		]),
	);

const PasswordGate = ({
	page,
	isDark,
	onUnlock,
	isPending,
	error,
}: {
	page: TPublicPage;
	isDark: boolean;
	onUnlock: (password: string) => void;
	isPending: boolean;
	error: string | null;
}) => {
	const [password, setPassword] = useState('');
	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (password) onUnlock(password);
	};

	return (
		<form onSubmit={submit} className='mx-auto flex w-full max-w-sm flex-col gap-4 py-16'>
			<h1 className='text-2xl font-bold'>{page.name}</h1>
			<p className='text-sm opacity-70'>This page is password protected.</p>
			<input
				type='password'
				autoComplete='current-password'
				aria-label='Password'
				placeholder='Password'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className={classNames(
					'w-full rounded-lg border px-3 py-2 text-sm outline-none',
					isDark ? 'border-white/15 bg-white/5' : 'border-zinc-300 bg-white',
				)}
			/>
			{error && <p className='text-sm text-red-500'>{error}</p>}
			<button
				type='submit'
				disabled={isPending || !password}
				className='rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'
				style={{ backgroundColor: page.theme.accent }}>
				{isPending ? 'Checking…' : 'Open page'}
			</button>
		</form>
	);
};

const PublicPagePage = () => {
	const { token = '' } = useParams<{ token: string }>();
	const qc = useQueryClient();
	const prefersDark = usePrefersDark();

	const [accessToken, setAccessToken] = useState<string | null>(() => readAccessToken(token));
	const pageQuery = usePublicPage(token, accessToken);
	const page = pageQuery.data;

	const unlock = useUnlockPublicPage(token);
	const submit = useSubmitPublicPage(token, accessToken);

	const fields = useMemo(() => collectFields(page?.blocks ?? []), [page?.blocks]);
	const [values, setValues] = useState<Record<string, unknown>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [run, setRun] = useState<{ submission: TPageSubmission; secret: string } | null>(null);
	const hasStarted = useRef(false);

	const polled = usePublicPageSubmission(token, run?.submission.id, run?.secret);
	const submission = polled.data ?? run?.submission ?? null;

	useEffect(() => {
		setValues(initialValues(fields));
	}, [fields]);

	useEffect(() => {
		if (page?.name) document.title = page.name;
	}, [page?.name]);

	const isDark =
		page?.theme.appearance === 'dark' || (page?.theme.appearance === 'auto' && prefersDark);

	const setValue = (key: string, value: unknown) => {
		if (!hasStarted.current) {
			hasStarted.current = true;
			trackPublicPageEvent(token, 'start');
		}
		setValues((previous) => ({ ...previous, [key]: value }));
		setErrors(({ [key]: _removed, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
	};

	const onSubmit = () => {
		const built = buildInput(fields, values);
		setErrors(built.errors);
		setSubmitError(null);
		if (Object.keys(built.errors).length > 0) return;

		submit.mutate(
			{ input: built.input },
			{
				onSuccess: (result) => setRun(result),
				onError: (error) => {
					if (ApiError.is(error) && error.isValidation) {
						setErrors(fieldErrorsFrom(error));
						return;
					}
					setSubmitError(
						ApiError.is(error)
							? error.message
							: 'Something went wrong. Please try again.',
					);
				},
			},
		);
	};

	const onUnlock = (password: string) => {
		unlock.mutate(password, {
			onSuccess: (result) => {
				writeAccessToken(token, result.access_token);
				qc.setQueryData(
					[...publicPageKeys.detail(token), result.access_token],
					result.page,
				);
				setAccessToken(result.access_token);
			},
		});
	};

	const form: TPageFormState = {
		values,
		errors,
		setValue,
		onSubmit,
		isSubmitting: submit.isPending,
		submission,
		submitError,
	};

	if (pageQuery.isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500'>
				Loading…
			</div>
		);
	}

	if (!page) {
		return (
			<div className='flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 px-4 text-center'>
				<h1 className='text-xl font-semibold text-zinc-900'>This page is not available</h1>
				<p className='text-sm text-zinc-500'>
					The link may be wrong, or the page was unpublished.
				</p>
			</div>
		);
	}

	const theme = page.theme;
	const background: CSSProperties =
		theme.background === 'dots'
			? {
					backgroundImage: `radial-gradient(${isDark ? '#ffffff1a' : '#0000001a'} 1px, transparent 1px)`,
					backgroundSize: '18px 18px',
				}
			: theme.background === 'gradient'
				? {
						backgroundImage: `linear-gradient(180deg, ${theme.accent}22 0%, transparent 60%)`,
					}
				: {};

	const unlockError =
		unlock.error && ApiError.is(unlock.error)
			? (unlock.error.field('password') ?? unlock.error.message)
			: unlock.error
				? 'Something went wrong. Please try again.'
				: null;

	return (
		<div
			className={classNames('min-h-screen', {
				'bg-zinc-950 text-zinc-100': isDark,
				'bg-white text-zinc-900': !isDark && theme.background === 'plain',
				'bg-zinc-50 text-zinc-900': !isDark && theme.background !== 'plain',
			})}
			style={{ ...background, fontFamily: FONT_FAMILY[theme.font] ?? FONT_FAMILY.sans }}>
			{theme.cover_url && (
				<img src={theme.cover_url} alt='' className='h-48 w-full object-cover sm:h-64' />
			)}
			<main className={classNames('mx-auto w-full px-4 py-10 sm:px-6', WIDTH[theme.width])}>
				{theme.logo_url && (
					<img
						src={theme.logo_url}
						alt={page.workspace_name ?? ''}
						className='mb-8 h-10 w-auto'
					/>
				)}
				{page.locked ? (
					<PasswordGate
						page={page}
						isDark={isDark}
						onUnlock={onUnlock}
						isPending={unlock.isPending}
						error={unlockError}
					/>
				) : (
					<PageBlocks blocks={page.blocks} theme={theme} isDark={isDark} form={form} />
				)}
			</main>
			<PoweredByBadge
				branding={page.branding}
				isDark={isDark}
				onClick={() => trackPublicPageEvent(token, 'badge_click')}
			/>
		</div>
	);
};

export default PublicPagePage;
