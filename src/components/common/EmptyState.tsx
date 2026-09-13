import { FC, ReactNode } from 'react';
import Icon from '@/components/icon/Icon';
import { TIcons } from '@/types/icons.type';

// ============================================================
// Empty State
// ------------------------------------------------------------
// The "nothing here yet" block for lists and cards. Distinct from
// `ui/Empty`, which is a shimmering placeholder for content that
// is still loading — this one says the query succeeded and the
// answer was zero rows.
// ============================================================

interface IEmptyStateProps {
	icon?: TIcons;
	title: string;
	description?: ReactNode;
	/** A primary call to action — usually the button that creates the
	 *  first one of whatever is missing. */
	action?: ReactNode;
	className?: string;
}

const EmptyState: FC<IEmptyStateProps> = ({
	icon = 'Inbox',
	title,
	description,
	action,
	className,
}) => (
	<div
		className={['flex flex-col items-center justify-center px-6 py-10 text-center', className]
			.filter(Boolean)
			.join(' ')}>
		<div className='flex size-12 items-center justify-center rounded-2xl bg-zinc-500/10 text-zinc-500'>
			<Icon icon={icon} size='text-2xl' />
		</div>
		<div className='mt-3 font-semibold'>{title}</div>
		{description && <div className='mt-1 max-w-sm text-sm text-zinc-500'>{description}</div>}
		{action && <div className='mt-4'>{action}</div>}
	</div>
);

export default EmptyState;
