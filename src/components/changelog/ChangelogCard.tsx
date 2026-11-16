import { Link, generatePath } from 'react-router';
import dayjs from 'dayjs';
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
			className='group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]'>
			<div className='mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500'>
				<Badge color={color} variant='soft'>
					{label}
				</Badge>
				{entry.version && <span className='font-mono'>v{entry.version}</span>}
				<time dateTime={entry.published_at}>
					{dayjs(entry.published_at).format('MMM D, YYYY')}
				</time>
				{entry.is_major && (
					<Badge color='primary' variant='outline'>
						Major
					</Badge>
				)}
				{unread && (
					<span className='ml-auto inline-flex items-center gap-1.5 text-indigo-600'>
						<span className='size-2 rounded-full bg-indigo-500' aria-hidden />
						New
					</span>
				)}
			</div>

			<h3 className='text-xl font-bold tracking-tight text-slate-950 dark:text-white'>
				<Link to={entryPath(entry.slug)} className='after:absolute after:inset-0'>
					{entry.title}
				</Link>
			</h3>
			<p className='mt-2 text-slate-600 dark:text-slate-300'>{entry.summary}</p>

			{entry.areas.length > 0 && (
				<ul className='mt-4 flex flex-wrap gap-1.5'>
					{entry.areas.map((area) => (
						<li
							key={area}
							className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300'>
							{area}
						</li>
					))}
				</ul>
			)}
		</article>
	);
};

export { entryPath };
export default ChangelogCard;
