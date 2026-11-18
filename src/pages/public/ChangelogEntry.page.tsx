import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import dayjs from 'dayjs';
import { ArrowLeft, Check, Link2 } from 'lucide-react';
import { getAccessToken } from '@/api/core';
import { useChangelogEntry, useMarkChangelogRead } from '@/api/modules/changelog';
import ChangelogBackLink from '@/components/changelog/ChangelogBackLink';
import ChangelogMarkdown from '@/components/changelog/ChangelogMarkdown';
import ChangelogThemeToggle from '@/components/changelog/ChangelogThemeToggle';
import { categoryMeta } from '@/components/changelog/changelogCategory';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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

const BackLink = () => (
	<Link
		to={pages.changelog.to}
		className='text-text-muted hover:text-text-main mb-8 inline-flex items-center gap-1.5 text-sm font-bold transition-colors'>
		<ArrowLeft size={16} aria-hidden /> All updates
	</Link>
);

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
		<main className='bg-bg-main text-text-main relative min-h-screen overflow-hidden'>
			<div className='pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_50%_0%,var(--soft-accent-bg),transparent_70%)]' />

			<article className='relative mx-auto max-w-3xl px-6 pt-14 pb-24'>
				<div className='mb-8 flex flex-wrap items-center justify-between gap-3'>
					<ChangelogBackLink />
					<ChangelogThemeToggle />
				</div>
				<BackLink />

				{isPending && (
					<div className='space-y-4'>
						<Skeleton className='h-10 w-2/3' />
						<Skeleton className='h-5 w-1/3' />
						<Skeleton className='h-64 w-full rounded-3xl' />
					</div>
				)}

				{isError && (
					<div className='border-border-main bg-bg-card rounded-3xl border border-dashed p-12 text-center'>
						<h1 className='text-2xl font-black'>We couldn&apos;t find that update</h1>
						<p className='text-text-muted mt-2'>
							It may have been removed, or it&apos;s only visible to some accounts.
						</p>
						<Link to={pages.changelog.to} className='mt-5 inline-block'>
							<Button variant='soft' color='primary' dimension='sm'>
								See all updates
							</Button>
						</Link>
					</div>
				)}

				{entry && (
					<>
						<header className='mb-8'>
							<div className='text-text-muted mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold'>
								<Badge color={categoryMeta(entry.category).color} variant='soft'>
									{entry.category_label}
								</Badge>
								<time dateTime={entry.published_at}>
									{dayjs(entry.published_at).format('MMMM D, YYYY')}
								</time>
								{entry.version && (
									<>
										<span aria-hidden>·</span>
										<span className='font-mono'>v{entry.version}</span>
									</>
								)}
								<Button
									variant='outline'
									dimension='xs'
									className='ml-auto'
									onClick={copyLink}>
									{copied ? (
										<Check size={14} aria-hidden />
									) : (
										<Link2 size={14} aria-hidden />
									)}
									{copied ? 'Link copied' : 'Copy link'}
								</Button>
							</div>
							<h1 className='text-4xl font-black tracking-tight md:text-5xl'>
								{entry.title}
							</h1>
							<p className='text-text-muted mt-4 text-xl leading-relaxed'>
								{entry.summary}
							</p>
						</header>

						{entry.cover_image_url && (
							<img
								src={entry.cover_image_url}
								alt=''
								className='border-border-main mb-8 w-full rounded-3xl border object-cover'
							/>
						)}

						<div className='border-border-main bg-bg-card rounded-3xl border p-6 shadow-sm md:p-8'>
							<ChangelogMarkdown className='text-base md:text-lg'>
								{entry.body}
							</ChangelogMarkdown>
						</div>

						{entry.areas.length > 0 && (
							<ul className='mt-8 flex flex-wrap gap-2'>
								{entry.areas.map((area) => (
									<li
										key={area}
										className='border-border-main text-text-muted rounded-full border px-3 py-1 text-sm font-semibold'>
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
