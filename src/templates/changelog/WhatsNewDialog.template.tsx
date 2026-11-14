import { useState } from 'react';
import { Link, generatePath } from 'react-router';
import dayjs from 'dayjs';
import { Sparkles } from 'lucide-react';
import { useLatestMajorChangelog, useMarkChangelogRead } from '@/api/modules/changelog';
import { categoryMeta } from '@/components/changelog/changelogCategory';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import pages from '@/Routes/pages';
import safeStorage from '@/utils/safeStorage.util';

const SEEN_KEY = 'changelog:popup-seen';

/**
 * The one-time "what's new" popup for a major release. It appears once per
 * entry: closing it marks the entry as read, and the session remembers it
 * too, so a failed request can't make it reappear on every page.
 */
const WhatsNewDialogTemplate = () => {
	const { data: entry } = useLatestMajorChangelog();
	const markRead = useMarkChangelogRead();
	const [closedId, setClosedId] = useState<string | null>(null);

	if (!entry || closedId === entry.id || safeStorage.get(SEEN_KEY, 'session') === entry.id) {
		return null;
	}

	const close = () => {
		safeStorage.set(SEEN_KEY, entry.id, 'session');
		setClosedId(entry.id);
		markRead.mutate(entry.slug);
	};

	const { color, label } = categoryMeta(entry.category);

	return (
		<Modal isOpen setIsOpen={(open) => !open && close()} isCentered size='md'>
			<ModalHeader setIsOpen={() => close()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<Sparkles size={16} />
					</div>
					<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						What&apos;s new
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-3 pt-2'>
					{entry.cover_image_url && (
						<img
							src={entry.cover_image_url}
							alt=''
							className='w-full rounded-xl border border-zinc-200 object-cover dark:border-white/10'
						/>
					)}
					<div className='flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500'>
						<Badge color={color} variant='soft'>
							{label}
						</Badge>
						{entry.version && <span className='font-mono'>v{entry.version}</span>}
						<span>{dayjs(entry.published_at).format('MMM D, YYYY')}</span>
					</div>
					<h2 className='text-xl font-bold tracking-tight text-zinc-950 dark:text-white'>
						{entry.title}
					</h2>
					<p className='text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-300'>
						{entry.summary}
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full justify-end gap-3'>
					<Button variant='outline' color='zinc' onClick={close}>
						Dismiss
					</Button>
					<Link
						to={generatePath(pages.changelog.subPages!.entry.to, { slug: entry.slug })}
						onClick={close}>
						<Button variant='solid' color='primary'>
							See what&apos;s new
						</Button>
					</Link>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default WhatsNewDialogTemplate;
