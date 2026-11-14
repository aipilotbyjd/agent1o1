import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import dayjs from 'dayjs';
import { ArrowLeft, Check, Link2 } from 'lucide-react';
import { getAccessToken } from '@/api/core';
import { useChangelogEntry, useMarkChangelogRead } from '@/api/modules/changelog';
import ChangelogMarkdown from '@/components/changelog/ChangelogMarkdown';
import ChangelogNav from '@/components/changelog/ChangelogNav';
import { categoryMeta } from '@/components/changelog/changelogCategory';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import pages from '@/Routes/pages';

/** The tab title and description, set by hand: the app has no head manager. */
const useEntryMeta = (title?: string, description?: string) => {
	useEffect(() => {
		if (!title) return;
		const previous = document.title;
		document.title = `${title} | What's new`;
		const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
		const previousDescription = tag?.content;
		if (tag && description) tag.content = description;
		return () => {
			document.title = previous;
			if (tag && previousDescription !== undefined) tag.content = previousDescription;
		};
	}, [title, description]);
};

const ChangelogEntryPage = () => {
	const { slug = '' } = useParams<{ slug: string }>();
	const { data: entry, isPending, isError } = useChangelogEntry(slug);
	const markRead = useMarkChangelogRead();
	const [copied, setCopied] = useState(false);

	useEntryMeta(entry?.title, entry?.summary);

	const shouldMarkRead = !!getAccessToken() && entry?.is_read === false;
	const { mutate } = markRead;
	useEffect(() => {
		if (shouldMarkRead) mutate(slug);
	}, [shouldMarkRead, slug, mutate]);

	const copyLink = () => {
		navigator.clipboard
			?.writeText(window.location.href)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => undefined);
	};

	return (
		<main className='min-h-screen bg-slate-50 text-slate-950'>
			<div className='absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_18%_16%,rgba(79,70,229,0.1),transparent_30%),linear-gradient(180deg,#fff,#f8fafc)]' />
			<ChangelogNav />

			<article className='relative mx-auto max-w-3xl px-6 pt-12 pb-24'>
				<Link
					to={pages.changelog.to}
					className='mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-950'>
					<ArrowLeft size={16} /> All updates
				</Link>

				{isPending && (
					<div className='space-y-4'>
						<Skeleton className='h-10 w-2/3' />
						<Skeleton className='h-5 w-1/3' />
						<Skeleton className='h-64 w-full' />
					</div>
				)}

				{isError && (
					<div className='rounded-2xl border border-dashed border-slate-300 p-10 text-center'>
						<h1 className='text-2xl font-bold'>We couldn&apos;t find that update</h1>
						<p className='mt-2 text-slate-500'>
							It may have been removed, or it&apos;s only visible to some accounts.
						</p>
						<Link
							to={pages.changelog.to}
							className='mt-5 inline-block font-bold text-indigo-600 underline'>
							See all updates
						</Link>
					</div>
				)}

				{entry && (
					<>
						<header className='mb-8'>
							<div className='mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500'>
								<Badge color={categoryMeta(entry.category).color} variant='soft'>
									{entry.category_label}
								</Badge>
								{entry.version && <span className='font-mono'>v{entry.version}</span>}
								<time dateTime={entry.published_at}>
									{dayjs(entry.published_at).format('MMMM D, YYYY')}
								</time>
								<button
									type='button'
									onClick={copyLink}
									className='ml-auto inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-950'>
									{copied ? <Check size={15} /> : <Link2 size={15} />}
									{copied ? 'Link copied' : 'Copy link'}
								</button>
							</div>
							<h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>{entry.title}</h1>
							<p className='mt-4 text-xl text-slate-600'>{entry.summary}</p>
						</header>

						{entry.cover_image_url && (
							<img
								src={entry.cover_image_url}
								alt=''
								className='mb-8 w-full rounded-2xl border border-slate-200 object-cover'
							/>
						)}

						<ChangelogMarkdown className='text-lg text-slate-800'>
							{entry.body}
						</ChangelogMarkdown>

						{entry.areas.length > 0 && (
							<ul className='mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6'>
								{entry.areas.map((area) => (
									<li
										key={area}
										className='rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600'>
										#{area}
									</li>
								))}
							</ul>
						)}
					</>
				)}
			</article>
		</main>
	);
};

export default ChangelogEntryPage;
