import { Link, generatePath } from 'react-router';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { ArrowUpRight, Pin } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import pages from '@/Routes/pages';
import type { TChangelogEntry } from '@/types/changelog.type';
import { categoryMeta } from './changelogCategory';

const entryPath = (slug: string) => generatePath(pages.changelog.subPages!.entry.to, { slug });

/** One release note in the timeline: links through to the full entry. */
const ChangelogCard = ({ entry }: { entry: TChangelogEntry }) => {
	const { color, label } = categoryMeta(entry.category);
	const unread = entry.is_read === false;

	return (
		<article
			data-component-name='ChangelogCard'
			className={classNames(
				'group hover:border-primary-500/50 relative rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
				entry.is_pinned
					? 'bg-soft-accent-bg border-soft-accent-border'
					: 'bg-bg-card border-border-main',
			)}>
			<div className='text-text-muted mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold'>
				<Badge color={color} variant='soft'>
					{label}
				</Badge>
				{entry.is_major && (
					<Badge color='primary' variant='outline'>
						Major
					</Badge>
				)}
				{entry.is_pinned && (
					<span className='inline-flex items-center gap-1'>
						<Pin size={12} aria-hidden /> Pinned
					</span>
				)}
				{unread && (
					<span className='text-text-main ml-auto inline-flex items-center gap-1.5'>
						<span className='bg-primary-500 size-2 rounded-full' aria-hidden />
						New
					</span>
				)}
			</div>

			<h3 className='text-text-main text-xl font-bold tracking-tight'>
				<Link to={entryPath(entry.slug)} className='after:absolute after:inset-0'>
					{entry.title}
				</Link>
			</h3>
			<p className='text-text-muted mt-2 leading-relaxed'>{entry.summary}</p>

			<div className='mt-5 flex flex-wrap items-center gap-x-4 gap-y-2'>
				<div className='text-text-muted flex items-center gap-2 text-xs font-semibold'>
					<time dateTime={entry.published_at}>
						{dayjs(entry.published_at).format('MMM D, YYYY')}
					</time>
					{entry.version && (
						<>
							<span aria-hidden>·</span>
							<span className='font-mono'>v{entry.version}</span>
						</>
					)}
				</div>

				{entry.areas.length > 0 && (
					<ul className='flex flex-wrap gap-1.5'>
						{entry.areas.map((area) => (
							<li
								key={area}
								className='border-border-main text-text-muted rounded-full border px-2.5 py-0.5 text-xs font-semibold'>
								{area}
							</li>
						))}
					</ul>
				)}

				<span className='text-text-main ml-auto inline-flex items-center gap-1 text-sm font-bold transition-transform duration-300 group-hover:translate-x-0.5'>
					Read update <ArrowUpRight size={16} aria-hidden />
				</span>
			</div>
		</article>
	);
};

export { entryPath };
export default ChangelogCard;
