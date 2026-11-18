import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { Loader2, Megaphone, Rss, Search } from 'lucide-react';
import { getAccessToken } from '@/api/core';
import {
	useChangelogAreas,
	useChangelogList,
	useChangelogScope,
	useMarkAllChangelogRead,
	usePinnedChangelog,
	useUnreadChangelogCount,
} from '@/api/modules/changelog';
import { apiConfig } from '@/api/core/config';
import { ChangelogEndpoints } from '@/api/modules/changelog/changelog.endpoints';
import ChangelogBackLink from '@/components/changelog/ChangelogBackLink';
import ChangelogCard from '@/components/changelog/ChangelogCard';
import ChangelogThemeToggle from '@/components/changelog/ChangelogThemeToggle';
import { CHANGELOG_CATEGORIES } from '@/components/changelog/changelogCategory';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import type { TChangelogCategory, TChangelogEntry } from '@/types/changelog.type';

const useDebounced = <T,>(value: T, delay = 300): T => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
};

const groupByMonth = (entries: TChangelogEntry[]) => {
	const groups = new Map<string, TChangelogEntry[]>();
	for (const entry of entries) {
		const key = dayjs(entry.published_at).format('MMMM YYYY');
		groups.set(key, [...(groups.get(key) ?? []), entry]);
	}
	return [...groups.entries()];
};

const chipClass = (active: boolean) =>
	classNames(
		'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors duration-200',
		active
			? 'border-primary-500 bg-primary-500 text-primary-foreground'
			: 'border-border-main bg-bg-card text-text-muted hover:border-primary-500/50 hover:text-text-main',
	);

const SectionLabel = ({ children }: { children: string }) => (
	<h2 className='text-text-muted text-[11px] font-black tracking-widest uppercase'>{children}</h2>
);

const ChangelogPage = () => {
	useDocumentTitle({ name: "What's new" });

	const [category, setCategory] = useState<TChangelogCategory | ''>('');
	const [area, setArea] = useState('');
	const [search, setSearch] = useState('');
	const q = useDebounced(search.trim());

	const scope = useChangelogScope();
	const signedIn = !!getAccessToken();
	const filtering = !!(category || area || q);

	const list = useChangelogList({ category, area, q, per_page: 20 });
	const pinned = usePinnedChangelog();
	const unread = useUnreadChangelogCount();
	const markAll = useMarkAllChangelogRead();

	const entries = useMemo(
		() => list.data?.pages.flatMap((page) => page.items) ?? [],
		[list.data],
	);
	const unpinnedEntries = filtering ? entries : entries.filter((entry) => !entry.is_pinned);
	const months = useMemo(() => groupByMonth(unpinnedEntries), [unpinnedEntries]);

	const knownAreas = useChangelogAreas().data ?? [];

	const feedUrl = `${apiConfig.baseUrl.replace(/\/$/, '')}${ChangelogEndpoints.public.rss}`;
	const pinnedEntries = filtering ? [] : (pinned.data ?? []);
	const unreadCount = unread.data ?? 0;

	return (
		<main className='bg-bg-main text-text-main relative min-h-screen overflow-hidden'>
			<div className='pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_50%_0%,var(--soft-accent-bg),transparent_70%)]' />

			<section className='relative mx-auto max-w-5xl px-6 pt-16 pb-24'>
				<div className='mb-10 flex flex-wrap items-center justify-between gap-3'>
					<ChangelogBackLink />
					<ChangelogThemeToggle />
				</div>

				<header className='mb-10'>
					<div className='border-soft-accent-border bg-soft-accent-bg text-text-main mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black tracking-wide'>
						<Megaphone size={14} aria-hidden /> Product updates
					</div>
					<h1 className='text-5xl font-black tracking-tight md:text-6xl'>
						What&apos;s new
					</h1>
					<p className='text-text-muted mt-4 max-w-xl text-lg font-medium'>
						New features, improvements and fixes, as they ship.
					</p>

					<div className='mt-6 flex flex-wrap items-center gap-3'>
						<Button
							variant='outline'
							dimension='sm'
							className='gap-1.5'
							onClick={() => window.open(feedUrl, '_blank', 'noopener,noreferrer')}>
							<Rss size={14} aria-hidden /> RSS feed
						</Button>
						{signedIn && unreadCount > 0 && (
							<Button
								variant='soft'
								color='primary'
								dimension='sm'
								isDisable={markAll.isPending}
								onClick={() => markAll.mutate()}>
								Mark all {unreadCount} as read
							</Button>
						)}
						{signedIn && scope === 'member' && (
							<span className='text-text-muted text-sm font-semibold'>
								Showing everything you can see
							</span>
						)}
					</div>
				</header>

				<div className='mb-10 space-y-4'>
					<div className='flex flex-col gap-3 sm:flex-row'>
						<label className='group relative block flex-1'>
							<span className='sr-only'>Search the changelog</span>
							<Search
								size={18}
								className='group-focus-within:text-primary-500 text-text-muted absolute top-1/2 left-4 -translate-y-1/2 transition-colors duration-200'
							/>
							<input
								type='search'
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder='Search updates'
								className='border-border-main bg-bg-card text-text-main placeholder:text-text-muted focus:border-primary-500/80 focus:ring-primary-500/15 h-12 w-full rounded-2xl border pr-4 pl-12 text-sm font-semibold shadow-xs transition-all duration-200 outline-none focus:ring-4'
							/>
						</label>

						{knownAreas.length > 0 && (
							<label className='block sm:w-56'>
								<span className='sr-only'>Filter by area</span>
								<select
									value={area}
									onChange={(event) => setArea(event.target.value)}
									className='border-border-main bg-bg-card text-text-main focus:border-primary-500/80 focus:ring-primary-500/15 h-12 w-full cursor-pointer rounded-2xl border pr-10 pl-4 text-sm font-semibold shadow-xs transition-all duration-200 outline-none focus:ring-4'>
									<option value=''>All areas</option>
									{knownAreas.map((name) => (
										<option key={name} value={name}>
											#{name}
										</option>
									))}
								</select>
							</label>
						)}
					</div>

					<div
						className='flex flex-wrap gap-2'
						role='group'
						aria-label='Filter by category'>
						<button
							type='button'
							aria-pressed={category === ''}
							className={chipClass(category === '')}
							onClick={() => setCategory('')}>
							All
						</button>
						{CHANGELOG_CATEGORIES.map((item) => (
							<button
								key={item.value}
								type='button'
								aria-pressed={category === item.value}
								className={chipClass(category === item.value)}
								onClick={() =>
									setCategory(category === item.value ? '' : item.value)
								}>
								{item.label}
							</button>
						))}
					</div>
				</div>

				{pinnedEntries.length > 0 && (
					<div className='mb-12 space-y-4'>
						<div className='flex items-center gap-4'>
							<SectionLabel>Pinned</SectionLabel>
							<span className='bg-border-main h-px flex-1' aria-hidden />
						</div>
						{pinnedEntries.map((entry) => (
							<ChangelogCard key={entry.id} entry={entry} />
						))}
					</div>
				)}

				{list.isPending && (
					<div className='space-y-4'>
						{[0, 1, 2].map((index) => (
							<Skeleton key={index} className='h-44 w-full rounded-3xl' />
						))}
					</div>
				)}

				{list.isError && (
					<div className='rounded-3xl border border-red-500/30 bg-red-500/10 p-6'>
						<p className='font-bold'>The changelog could not be loaded.</p>
						<Button
							variant='outline'
							color='red'
							dimension='sm'
							className='mt-3'
							onClick={() => list.refetch()}>
							Try again
						</Button>
					</div>
				)}

				{list.isSuccess && months.length === 0 && pinnedEntries.length === 0 && (
					<div className='border-border-main bg-bg-card text-text-muted rounded-3xl border border-dashed p-12 text-center'>
						<p className='text-text-main text-base font-bold'>
							{filtering ? 'Nothing matches those filters' : 'No updates yet'}
						</p>
						<p className='mt-1 text-sm'>
							{filtering
								? 'Try a different search or clear a filter.'
								: 'New releases will show up here as they are published.'}
						</p>
					</div>
				)}

				<div className='space-y-12'>
					{months.map(([month, items]) => (
						<section key={month} aria-label={month}>
							<div className='mb-4 flex items-center gap-4'>
								<SectionLabel>{month}</SectionLabel>
								<span className='bg-border-main h-px flex-1' aria-hidden />
							</div>
							<div className='space-y-4'>
								{items.map((entry) => (
									<ChangelogCard key={entry.id} entry={entry} />
								))}
							</div>
						</section>
					))}
				</div>

				{list.hasNextPage && (
					<div className='mt-12 flex justify-center'>
						<Button
							variant='outline'
							isDisable={list.isFetchingNextPage}
							onClick={() => list.fetchNextPage()}>
							{list.isFetchingNextPage && (
								<Loader2 size={16} className='animate-spin' aria-hidden />
							)}
							Load older updates
						</Button>
					</div>
				)}
			</section>
		</main>
	);
};

export default ChangelogPage;
