import { Children, cloneElement, FC, ReactElement, ReactNode } from 'react';
import { IAvatarProps } from './Avatar';
import classNames from 'classnames';

// @start-snippet:: interface
export interface IAvatarGroupProps extends IAvatarProps {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
const AvatarGroup: FC<IAvatarGroupProps> = (props) => {
	const { children, className, color, size, rounded, variant = 'solid', ...rest } = props;
	return (
		<div data-component-name='AvatarGroup' className={classNames('flex', className)} {...rest}>
			{Children.map(children, (child) =>
				// @ts-ignore
				['Avatar'].includes(child?.type?.displayName) ? (
					cloneElement(child as ReactElement<IAvatarProps>, {
						// @ts-ignore
						variant: child?.props?.variant || variant,
						// @ts-ignore
						color: child?.props?.color || color,
						// @ts-ignore
						size: child?.props?.size || size,
						// @ts-ignore
						rounded: child?.props?.rounded || rounded,
						// @ts-ignore
						className: `${child?.props?.className} first:ms-0 -ms-2 border-2 dark:border-zinc-950! border-white!`,
					})
				) : (
					<code>Only Avatar component should be used as a child.</code>
				),
			)}
		</div>
	);
};
AvatarGroup.displayName = 'AvatarGroup';

export default AvatarGroup;
