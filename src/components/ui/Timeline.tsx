import { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

// @start-snippet:: interface
interface ITimelineHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
// @end-snippet:: interface
export const TimelineHeader: FC<ITimelineHeaderProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div className={classNames('my-2 ps-2 first:mt-0', className)} {...rest}>
			<h3 className='text-xs font-medium text-zinc-500 uppercase dark:text-neutral-400'>
				{children}
			</h3>
		</div>
	);
};
TimelineHeader.displayName = 'TimelineHeader';

// @start-snippet:: interface
interface ITimelineItemProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	header: ReactNode;
	leftContent?: ReactNode;
	footer?: ReactNode;
	lineClassName?: string;
	dotClassName?: string;
}
// @end-snippet:: interface
export const TimelineItem: FC<ITimelineItemProps> = (props) => {
	const {
		children,
		className,
		leftContent,
		header,
		footer,
		lineClassName,
		dotClassName,
		...rest
	} = props;

	return (
		<div className={classNames('group/item flex gap-x-3', className)} {...rest}>
			{leftContent && (
				<div className='w-16 text-end'>
					<span className='text-xs text-zinc-500'>{leftContent}</span>
				</div>
			)}
			<div
				className={classNames(
					'relative after:absolute after:start-3.5 after:top-7 after:bottom-0 after:w-px after:-translate-x-[0.5px] after:bg-zinc-200 last:after:hidden dark:after:bg-zinc-700',
					lineClassName,
				)}>
				<div className='relative z-10 flex size-7 items-center justify-center'>
					<div
						className={classNames(
							'size-2 rounded-full bg-zinc-400 dark:bg-zinc-600',
							dotClassName,
						)}></div>
				</div>
			</div>

			<div className='grow pt-0.5 pb-8 group-last/item:pb-2'>
				<h3 className='flex gap-x-1.5 font-semibold'>{header}</h3>
				{children && (
					<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>{children}</p>
				)}
				{footer}
			</div>
		</div>
	);
};
TimelineItem.displayName = 'TimelineItem';

// @start-snippet:: interface
interface ITimelineProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
const Timeline: FC<ITimelineProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div className={classNames(className)} {...rest}>
			{children}
		</div>
	);
};
Timeline.displayName = 'Timeline';

export default Timeline;
