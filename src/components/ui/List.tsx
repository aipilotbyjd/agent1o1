import { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import Icon, { IIconProps } from '@/components/icon/Icon';

// @start-snippet:: interface, group
interface ILiProps extends HTMLAttributes<HTMLLIElement> {
	children: ReactNode;
	iconProps?: IIconProps;
	className?: string;
}
// @end-snippet:: interface, group
export const Li: FC<ILiProps> = (props) => {
	const { children, className, iconProps, ...rest } = props;

	return (
		<li className={classNames('', className)} {...rest}>
			<span className='inline-flex items-start'>
				{iconProps?.icon && <Icon className='me-2 mt-1 shrink-0' {...iconProps} />}
				{children}
			</span>
		</li>
	);
};

// @start-snippet:: interface
type TListTypes = 'list-disc' | 'list-decimal' | 'list-none';
interface IListProps extends HTMLAttributes<HTMLUListElement> {
	children: ReactNode;
	className?: string;
	type?: TListTypes;
}
// @end-snippet:: interface
const List: FC<IListProps> = (props) => {
	const { children, className, type = 'list-disc', ...rest } = props;

	return (
		<ul className={classNames('list-inside', type, className)} {...rest}>
			{children}
		</ul>
	);
};

// @start-snippet:: group
interface IListGroupProps extends IListProps {
	isGroup?: boolean;
	isFlush?: boolean;
	isGutters?: boolean;
	isHorizontal?: boolean;
	isStriped?: boolean;
	type?: TListTypes;
}
// @end-snippet:: group
export const ListGroup: FC<IListGroupProps> = (props) => {
	const {
		isGroup = true,
		isFlush,
		isGutters = true,
		isHorizontal,
		isStriped,
		children,
		type = 'list-none',
		className,
		...rest
	} = props;
	return (
		<List
			type={type}
			className={classNames(
				{
					'*:px-4': (isGroup || isFlush) && isGutters,
					'w-fit rounded-lg *:max-w-md *:py-3': isGroup || isFlush,
					'divide-zinc-500/10 dark:divide-zinc-500/25': isGroup || isFlush,
					'border border-zinc-500/10 dark:border-zinc-500/25': isGroup && !isFlush,
					'flex divide-x': (isGroup || isFlush) && isHorizontal,
					'divide-y': (isGroup || isFlush) && !isHorizontal,
					'*:even:bg-zinc-500/5 dark:*:even:bg-zinc-900/50':
						(isGroup || isFlush) && isStriped,
				},
				className,
			)}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...rest}>
			{children}
		</List>
	);
};

export default List;
