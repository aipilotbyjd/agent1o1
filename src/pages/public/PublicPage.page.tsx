import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppWindow, Loader2, Lock } from 'lucide-react';
import PageRenderer from '@/components/workflowPage/PageRenderer';
import { pageInputClass } from '@/components/workflowPage/PageField';
import { pageThemeStyle, usePageDark, usePageFonts } from '@/components/workflowPage/pageTheme';
import { usePageRun, type TPageTransport } from '@/components/workflowPage/usePageRun';
import { viewFields } from '@/components/workflowPage/pageTree';
import { PublicPageService } from '@/api/modules/workflow-pages';
import { ApiError } from '@/api/core';
import type { TPageTheme, TPageView } from '@/types/workflow-page.type';
import safeStorage from '@/utils/safeStorage.util';

const accessKey = (token: string) => `page-access:${token}`;

const LivePage = ({ token, view, accessToken }: { token: string; view: TPageView; accessToken: string | null }) => {
	const fields = useMemo(() => viewFields(view.blocks), [view]);
	const transport = useMemo<TPageTransport>(
		() => ({
			submit: (input) =>
				PublicPageService.submit(token, input, accessToken).then(({ submission, secret }) => ({
					result: submission,
					secret,
				})),
			poll: (id, secret, signal) => PublicPageService.result(token, id, secret ?? '', signal),
			storageKey: `page-run:${token}`,
			onStart: () => void PublicPageService.started(token).catch(() => undefined),
		}),
		[token, accessToken],
	);
	const run = usePageRun(fields, transport);
	return <PageRenderer theme={view.theme} blocks={view.blocks} mode='live' run={run} workspaceName={view.workspace_name} />;
};

const PasswordGate = ({ token, view, onUnlocked }: { token: string; view: TPageView; onUnlocked: (accessToken: string, view: TPageView) => void }) => {
	const dark = usePageDark(view.theme.appearance);
	usePageFonts(view.theme.font);
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = () => {
		if (!password) return;
		setBusy(true);
		setError(null);
		PublicPageService.unlock(token, password)
			.then(({ access_token, page }) => onUnlocked(access_token, page))
			.catch((err: unknown) => setError(ApiError.is(err) ? (err.field('password') ?? err.message) : 'Something went wrong.'))
			.finally(() => setBusy(false));
	};

	return (
		<div style={pageThemeStyle(view.theme, dark)} className='flex min-h-dvh items-center justify-center px-4'>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					submit();
				}}
				className='w-full max-w-[380px] space-y-4 rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6 shadow-lg'>
				<div className='flex size-11 items-center justify-center rounded-xl bg-[var(--pg-accent-soft)] text-[var(--pg-accent)]'>
					<Lock size={20} />
				</div>
				<div>
					<h1 className='text-lg font-extrabold'>{view.name}</h1>
					<p className='mt-1 text-sm text-[var(--pg-muted)]'>Enter the password to use this page.</p>
				</div>
				<input
					type='password'
					autoComplete='current-password'
					aria-label='Password'
					aria-invalid={Boolean(error)}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className={pageInputClass}
				/>
				{error && <p className='text-xs font-medium text-rose-500'>{error}</p>}
				<button
					type='submit'
					disabled={busy || !password}
					className='flex h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--pg-radius)*0.8)] bg-[var(--pg-accent)] text-sm font-bold text-[var(--pg-accent-fg)] transition hover:brightness-110 disabled:opacity-60'>
					{busy && <Loader2 size={15} className='animate-spin' />}
					Continue
				</button>
			</form>
		</div>
	);
};

const NEUTRAL: TPageTheme = {
	accent: '#4f46e5',
	appearance: 'auto',
	background: 'soft',
	radius: 'lg',
	font: 'sans',
	width: 'medium',
	logo_url: null,
	cover_url: null,
	show_branding: true,
};

const Unavailable = () => {
	const dark = usePageDark('auto');
	return (
		<div style={pageThemeStyle(NEUTRAL, dark)} className='flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center'>
			<div className='flex size-12 items-center justify-center rounded-2xl bg-[var(--pg-accent-soft)] text-[var(--pg-accent)]'>
				<AppWindow size={22} />
			</div>
			<h1 className='text-lg font-extrabold'>This page isn’t available</h1>
			<p className='max-w-sm text-sm text-[var(--pg-muted)]'>
				The link may be old, or the page may have been turned off. Ask whoever shared it for a new link.
			</p>
		</div>
	);
};

/** A workflow page at its public link: no sign-in, only the page. */
const PublicPagePage = () => {
	const { token = '' } = useParams<{ token: string }>();
	const qc = useQueryClient();
	const [accessToken, setAccessToken] = useState<string | null>(() => safeStorage.get(accessKey(token), 'session'));
	const queryKey = ['public-page', token, accessToken] as const;
	const { data: view, isLoading, isError } = useQuery({
		queryKey,
		queryFn: ({ signal }) => PublicPageService.show(token, accessToken, signal),
		enabled: !!token,
		retry: false,
		staleTime: 60_000,
		meta: { silent: true },
	});

	useEffect(() => {
		if (view?.name) document.title = view.name;
	}, [view?.name]);

	if (isLoading) {
		return (
			<div className='flex min-h-dvh items-center justify-center'>
				<Loader2 size={20} className='animate-spin text-zinc-400' />
			</div>
		);
	}

	if (isError || !view) return <Unavailable />;

	if (view.locked) {
		return (
			<PasswordGate
				token={token}
				view={view}
				onUnlocked={(next, unlocked) => {
					safeStorage.set(accessKey(token), next, 'session');
					qc.setQueryData(['public-page', token, next], unlocked);
					setAccessToken(next);
				}}
			/>
		);
	}

	return (
		<div className='grid min-h-dvh'>
			<LivePage token={token} view={view} accessToken={accessToken} />
		</div>
	);
};

export default PublicPagePage;
