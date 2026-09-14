import { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import useAsideStatus from '@/hooks/useAsideStatus';
import { TIcons } from '@/types/icons.type';
import Icon from '@/components/icon/Icon';

// @start-snippet:: interface
interface IAsideHeadProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const AsideHead: FC<IAsideHeadProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Aside/AsideHead'
			className={classNames('flex items-center justify-between px-4 pb-2', className)}
			{...rest}>
			{children}
		</div>
	);
};

// @start-snippet:: interface
interface IAsideBodyProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const AsideBody: FC<IAsideBodyProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Aside/AsideBody'
			className={classNames('h-full overflow-x-scroll px-4', 'no-scrollbar', className)}
			{...rest}>
			<div className='sticky top-0 h-4 bg-linear-to-b from-bg-sidebar to-transparent'></div>
			{children}
			<div className='sticky bottom-0 h-4 bg-linear-to-t from-bg-sidebar to-transparent'></div>
		</div>
	);
};

// @start-snippet:: interface
interface IAsideQuickContainerProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const AsideQuickContainer: FC<IAsideQuickContainerProps> = (props) => {
	const { children, className, ...rest } = props;
	const { asideStatus } = useAsideStatus();
	return (
		<div
			className={classNames(
				'mb-4 grid gap-2',
				{
					'grid-cols-2': asideStatus,
					'grid-cols-1': !asideStatus,
				},
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};

// @start-snippet:: interface
interface IAsideQuickNavProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	icon?: TIcons;
	className?: string;
	isActive?: boolean;
}
// @end-snippet:: interface
export const AsideQuickNav: FC<IAsideQuickNavProps> = (props) => {
	const { icon, children, className, isActive, ...rest } = props;
	const { asideStatus } = useAsideStatus();

	return (
		<div
			data-component-name='Aside/AsideQuickNav'
			className={classNames(
				'flex cursor-pointer flex-col items-center justify-between gap-2 overflow-hidden rounded-xl',
				// 'transition-all duration-300 ease-in-out',
				{ 'bg-primary-400 hover:bg-primary-500 text-zinc-900 shadow-[0_4px_12px_var(--color-primary-50)]': isActive },
				{
					'bg-bg-card text-zinc-500 hover:bg-zinc-100/50 dark:bg-bg-card dark:hover:bg-zinc-800/50 border border-border-main':
						!isActive,
				},
				{ 'p-4': asideStatus, 'p-2.5': !asideStatus },
				'transition-colors duration-300 ease-in-out',
				className,
			)}
			{...rest}>
			<div>{icon && <Icon icon={icon} size={asideStatus ? 'text-2xl' : 'text-xl'} />}</div>
			{asideStatus && <div className=''>{children}</div>}
		</div>
	);
};

// @start-snippet:: interface
interface IAsideFooterProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const AsideFooter: FC<IAsideFooterProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Aside/AsideFooter'
			className={classNames('px-4', className)}
			{...rest}>
			{children}
		</div>
	);
};

// @start-snippet:: interface
interface IAsideProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
const Aside: FC<IAsideProps> = (props) => {
	const { children, className, ...rest } = props;

	const { asideStatus, closeAside } = useAsideStatus();
	return (
		<>
			{asideStatus && (
				<button
					type='button'
					aria-label='Close sidebar'
					onClick={closeAside}
					className='fixed inset-0 z-[80] bg-zinc-950/35 backdrop-blur-xs md:hidden'
				/>
			)}
			<aside
				data-component-name='Aside'
				className={classNames(
					'peer',
					'fixed top-0 bottom-0 z-40 md:z-20',
					'flex flex-col',
					'bg-bg-sidebar',
					'py-2',
					'z-[100]',
					'border-e border-border-main',
					'dark:bg-bg-sidebar dark:text-white',
					'transition-all duration-300 ease-in-out',
					className,
					// Mobile Design
					'max-md:w-[20rem] max-md:shadow-2xl max-md:ltr:-left-[20rem] max-md:rtl:-right-[20rem]',
					{
						'md:w-[20rem]': asideStatus,
						'md:w-[5.25em]': !asideStatus,
						'max-md:ltr:-left-[20rem] max-md:rtl:-right-[20rem]': !asideStatus,
						'max-md:ltr:left-0 max-md:rtl:right-0': asideStatus,
					},
				)}
				{...rest}>
				{children}
			</aside>
		</>
	);
};

export default Aside;
