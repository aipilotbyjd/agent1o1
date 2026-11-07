import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Info, OctagonAlert, Wrench, X } from 'lucide-react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useAnnouncements, useDismissAnnouncement } from '@/api/modules/announcements';
import type { TAnnouncement, TAnnouncementSeverity } from '@/types/announcement.type';

const severityStyles: Record<
	TAnnouncementSeverity,
	{ bar: string; button: string; icon: ComponentType<{ size?: number; className?: string }> }
> = {
	info: {
		bar: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100',
		button: 'hover:bg-sky-100 dark:hover:bg-sky-900/50',
		icon: Info,
	},
	warning: {
		bar: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100',
		button: 'hover:bg-amber-100 dark:hover:bg-amber-900/50',
		icon: AlertTriangle,
	},
	critical: {
		bar: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100',
		button: 'hover:bg-red-100 dark:hover:bg-red-900/50',
		icon: OctagonAlert,
	},
};

/** "Mar 3, 22:00 – 23:00" (or with both dates when it spans days). */
const windowLabel = (a: TAnnouncement): string | null => {
	if (!a.starts_at || !a.ends_at) return null;
	const start = dayjs(a.starts_at);
	const end = dayjs(a.ends_at);
	return start.isSame(end, 'day')
		? `${start.format('MMM D, HH:mm')} – ${end.format('HH:mm')}`
		: `${start.format('MMM D, HH:mm')} – ${end.format('MMM D, HH:mm')}`;
};

const isExternal = (url: string) => /^https:\/\//i.test(url);

const Banner = ({
	announcement,
	onDismiss,
}: {
	announcement: TAnnouncement;
	onDismiss: (id: string) => void;
}) => {
	const style = severityStyles[announcement.severity] ?? severityStyles.info;
	const Icon = announcement.type === 'maintenance' ? Wrench : style.icon;
	const when = announcement.type === 'maintenance' ? windowLabel(announcement) : null;
	const linkClass = 'shrink-0 font-bold underline underline-offset-2';

	return (
		<div
			role={announcement.severity === 'critical' ? 'alert' : 'status'}
			data-component-name='AnnouncementBanner'
			className={classNames(
				'flex items-start gap-3 border-b px-4 py-2.5 text-sm',
				style.bar,
			)}>
			<Icon size={16} className='mt-0.5 shrink-0' />
			<div className='min-w-0 flex-1'>
				<p className='font-bold'>
					{announcement.title}
					{announcement.blocks_writes && (
						<span className='ml-2 rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] font-black tracking-wider uppercase dark:bg-white/10'>
							{announcement.window_open ? 'Read-only now' : 'Read-only during window'}
						</span>
					)}
				</p>
				{(announcement.body || when) && (
					<p className='mt-0.5 opacity-90'>
						{when && <span className='font-semibold'>{when}. </span>}
						{announcement.body}
					</p>
				)}
			</div>
			{announcement.cta_url &&
				announcement.cta_label &&
				(isExternal(announcement.cta_url) ? (
					<a
						href={announcement.cta_url}
						target='_blank'
						rel='noopener noreferrer'
						className={linkClass}>
						{announcement.cta_label}
					</a>
				) : (
					<Link to={announcement.cta_url} className={linkClass}>
						{announcement.cta_label}
					</Link>
				))}
			{announcement.dismissible && (
				<button
					type='button'
					onClick={() => onDismiss(announcement.id)}
					aria-label={`Dismiss: ${announcement.title}`}
					className={classNames(
						'-my-1 -mr-1 shrink-0 rounded-md p-1 transition',
						style.button,
					)}>
					<X size={14} />
				</button>
			)}
		</div>
	);
};

/**
 * Platform banners and maintenance notices from the operator, stacked above
 * the page. Renders nothing when there are none, so it costs no space.
 */
const AnnouncementBannersTemplate = () => {
	const { data } = useAnnouncements();
	const dismiss = useDismissAnnouncement();

	if (!data || data.announcements.length === 0) return null;

	return (
		<div data-component-name='AnnouncementBanners' className='shrink-0'>
			{data.announcements.map((announcement) => (
				<Banner
					key={announcement.id}
					announcement={announcement}
					onDismiss={(id) => dismiss.mutate(id)}
				/>
			))}
		</div>
	);
};

export default AnnouncementBannersTemplate;
