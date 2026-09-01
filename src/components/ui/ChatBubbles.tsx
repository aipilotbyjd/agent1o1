import { Children, cloneElement, FC, ReactElement, ReactNode } from 'react';
import classNames from 'classnames';
import Avatar from './Avatar';

// @start-snippet:: interface
type TMyContentPosition = 'start' | 'end';
// @end-snippet:: interface

// @start-snippet:: interface
interface IChatBubblesSeparateProps {
	children?: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const ChatBubblesSeparate: FC<IChatBubblesSeparateProps> = (props) => {
	const { children, className, ...rest } = props;
	return (
		<div className={classNames('text-center text-sm text-zinc-500', className)} {...rest}>
			{children}
		</div>
	);
};
ChatBubblesSeparate.displayName = 'ChatBubblesSeparate';

// @start-snippet:: interface
interface IChatBubblesItemProps {
	children: ReactNode;
	className?: string;
	isMyContent?: boolean;
	myContentPosition?: TMyContentPosition;
	image?: string;
	username: string;
	isAvatar?: boolean;
	footer?: ReactNode;
}
// @end-snippet:: interface
export const ChatBubblesItem: FC<IChatBubblesItemProps> = (props) => {
	const {
		children,
		className,
		isMyContent,
		myContentPosition,
		isAvatar,
		image,
		username,
		footer,
		...rest
	} = props;

	const AVATAR = isAvatar && (
		<div>
			<Avatar src={image} name={username} />
		</div>
	);

	return (
		<div
			data-component-name='ChatBubbles/ChatBubblesItem'
			className={classNames(
				{
					'ms-auto': myContentPosition === 'end' && isMyContent,
					'ps-16': myContentPosition === 'end' && isMyContent,
					'pe-16': !isMyContent || myContentPosition === 'start',
				},
				'flex max-w-(--breakpoint-lg) gap-4',
				className,
			)}
			{...rest}>
			{(!isMyContent || (myContentPosition === 'start' && isMyContent)) && AVATAR}
			<div className='flex flex-col gap-2'>
				<div
					className={classNames(
						'w-fit self-end rounded-xl border border-zinc-500/10 p-4 dark:border-zinc-500/25',
						{
							'bg-blue-500 text-white': isMyContent,
						},
					)}>
					{children}
				</div>
				{footer && (
					<div
						className={classNames('text-zinc-500', {
							'ms-auto': myContentPosition === 'end' && isMyContent,
						})}>
						{footer}
					</div>
				)}
			</div>
			{myContentPosition === 'end' && isMyContent && AVATAR}
		</div>
	);
};
ChatBubblesItem.displayName = 'ChatBubblesItem';

// @start-snippet:: interface
interface IChatBubblesProps {
	children: ReactNode;
	className?: string;
	myContentPosition?: TMyContentPosition;
	isAvatar?: boolean;
}
// @end-snippet:: interface
const ChatBubbles: FC<IChatBubblesProps> = (props) => {
	const { children, className, myContentPosition = 'end', isAvatar, ...rest } = props;
	return (
		<div
			data-component-name='ChatBubbles'
			className={classNames('flex flex-col gap-4', className)}
			{...rest}>
			{Children.map(children, (child) =>
				// @ts-ignore
				['ChatBubblesItem', 'ChatBubblesSeparate'].includes(child?.type?.displayName) ? (
					cloneElement(child as ReactElement<IChatBubblesItemProps>, {
						// @ts-ignore
						myContentPosition: myContentPosition || child?.props.myContentPosition,
						// @ts-ignore
						isAvatar: isAvatar || child?.props.isAvatar,
						// @ts-ignore
						className: `${child?.props?.className || ''}`,
					})
				) : (
					<code>Only ChatBubblesItem component should be used as a child.</code>
				),
			)}
		</div>
	);
};

export default ChatBubbles;
