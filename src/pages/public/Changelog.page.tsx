import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { Loader2, Rss, Search } from 'lucide-react';
import { getAccessToken } from '@/api/core';
import {
	useChangelogList,
	useChangelogScope,
	useMarkAllChangelogRead,
	usePinnedChangelog,
	useUnreadChangelogCount,
} from '@/api/modules/changelog';
import { apiConfig } from '@/api/core/config';
import { ChangelogEndpoints } from '@/api/modules/changelog/changelog.endpoints';
import ChangelogCard from '@/components/changelog/ChangelogCard';
import ChangelogNav from '@/components/changelog/ChangelogNav';
import { CHANGELOG_CATEGORIES } from '@/components/changelog/changelogCategory';
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
		'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
		active
			? 'border-slate-950 bg-slate-950 text-white'
			: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950',
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

	const entries = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);
	const unpinnedEntries = filtering ? entries : entries.filter((entry) => !entry.is_pinned);
	const months = useMemo(() => groupByMonth(unpinnedEntries), [unpinnedEntries]);

	// Areas the reader can filter by are the ones seen so far, so the list never offers a dead end.
	const [knownAreas, setKnownAreas] = useState<string[]>([]);
	useEffect(() => {
		setKnownAreas((known) => [...new Set([...known, ...entries.flatMap((entry) => entry.areas)])].sort());
	}, [entries]);

	const feedUrl = `${apiConfig.baseUrl.replace(/\/$/, '')}${ChangelogEndpoints.public.rss}`;
	const pinnedEntries = filtering ? [] : (pinned.data ?? []);

	return (
		<main className='min-h-screen bg-slate-50 text-slate-950'>
			<div className='absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_16%,rgba(79,70,229,0.12),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(232,93,158,0.13),transparent_30%),linear-gradient(180deg,#fff,#f8fafc)]' />
			<ChangelogNav />

			<section className='relative mx-auto max-w-3xl px-6 pt-14 pb-24'>
				<div className='mb-10'>
					<h1 className='text-5xl font-semibold tracking-tight md:text-6xl'>What&apos;s new</h1>
					<p className='mt-4 max-w-xl text-lg font-medium text-slate-600'>
						New features, improvements and fixes, as they ship.
					</p>
					<div className='mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold'>
						<a
							href={feedUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-950'>
							<Rss size={15} /> RSS feed
						</a>
						{signedIn && (unread.data ?? 0) > 0 && (
							<button
								type='button'
								onClick={() => markAll.mutate()}
								disabled={markAll.isPending}
								className='text-indigo-600 hover:text-indigo-800 disabled:opacity-50'>
								Mark all {unread.data} as read
							</button>
						)}
						{signedIn && scope === 'member' && (
							<span className='text-slate-400'>Showing everything you can see</span>
						)}
					</div>
				</div>

				<div className='mb-8 space-y-4'>
					<label className='relative block'>
						<span className='sr-only'>Search the changelog</span>
						<Search
							size={18}
							className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'
						/>
						<input
							type='search'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder='Search updates'
							className='w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-base shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200'
						/>
					</label>

					<div className='flex flex-wrap gap-2' role='group' aria-label='Filter by category'>
						<button type='button' className={chipClass(category === '')} onClick={() => setCategory('')}>
							All
						</button>
						{CHANGELOG_CATEGORIES.map((item) => (
							<button
								key={item.value}
								type='button'
								aria-pressed={category === item.value}
								className={chipClass(category === item.value)}
								onClick={() => setCategory(category === item.value ? '' : item.value)}>
								{item.label}
							</button>
						))}
					</div>

					{knownAreas.length > 0 && (
						<div className='flex flex-wrap gap-2' role='group' aria-label='Filter by area'>
							{knownAreas.map((name) => (
								<button
									key={name}
									type='button'
									aria-pressed={area === name}
									className={classNames(chipClass(area === name), '!py-1 !text-xs')}
									onClick={() => setArea(area === name ? '' : name)}>
									#{name}
								</button>
							))}
						</div>
					)}
				</div>

				{pinnedEntries.length > 0 && (
					<div className='mb-10 space-y-4'>
						<h2 className='text-xs font-black tracking-widest text-slate-400 uppercase'>
							Pinned
						</h2>
						{pinnedEntries.map((entry) => (
							<ChangelogCard key={entry.id} entry={entry} />
						))}
					</div>
				)}

				{list.isPending && (
					<div className='space-y-4'>
						{[0, 1, 2].map((index) => (
							<Skeleton key={index} className='h-40 w-full rounded-2xl' />
						))}
					</div>
				)}

				{list.isError && (
					<div className='rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900'>
						<p className='font-bold'>The changelog could not be loaded.</p>
						<button
							type='button'
							onClick={() => list.refetch()}
							className='mt-2 text-sm font-bold underline'>
							Try again
						</button>
					</div>
				)}

				{list.isSuccess && months.length === 0 && pinnedEntries.length === 0 && (
					<div className='rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500'>
						{filtering ? 'Nothing matches those filters.' : 'No updates have been published yet.'}
					</div>
				)}

				<div className='space-y-10'>
					{months.map(([month, items]) => (
						<section key={month} aria-label={month}>
							<h2 className='mb-4 text-xs font-black tracking-widest text-slate-400 uppercase'>
								{month}
							</h2>
							<div className='space-y-4'>
								{items.map((entry) => (
									<ChangelogCard key={entry.id} entry={entry} />
								))}
							</div>
						</section>
					))}
				</div>

				{list.hasNextPage && (
					<div className='mt-10 flex justify-center'>
						<button
							type='button'
							onClick={() => list.fetchNextPage()}
							disabled={list.isFetchingNextPage}
							className='inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:border-slate-300 disabled:opacity-60'>
							{list.isFetchingNextPage && <Loader2 size={16} className='animate-spin' />}
							Load older updates
						</button>
					</div>
				)}
			</section>
		</main>
	);
};

export default ChangelogPage;
