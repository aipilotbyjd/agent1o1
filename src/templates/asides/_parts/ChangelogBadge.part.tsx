import { useUnreadChangelogCount } from '@/api/modules/changelog';

/** How many release notes this member hasn't opened yet. */
const ChangelogBadgePart = () => {
	const { data: unread } = useUnreadChangelogCount();
	if (!unread) return null;

	return (
		<span
			aria-label={`${unread} unread updates`}
			className='bg-primary-400 text-primary-950 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold'>
			{unread > 99 ? '99+' : unread}
		</span>
	);
};

export default ChangelogBadgePart;
