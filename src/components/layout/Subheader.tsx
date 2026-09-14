import { FC, HTMLAttributes, ReactNode, RefObject, useRef } from 'react';
import classNames from 'classnames';
import useDomRect from '@/hooks/useDomRect';

// @start-snippet:: interface
interface ISubheaderLeftProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
// @end-snippet:: interface
export const SubheaderLeft: FC<ISubheaderLeftProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderLeft'
			className={classNames('flex flex-wrap items-center gap-4', className)}
			{...rest}>
			{children}
		</div>
	);
};
SubheaderLeft.displayName = 'SubheaderLeft';

// @start-snippet:: interface
interface ISubheaderRightProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
// @end-snippet:: interface
export const SubheaderRight: FC<ISubheaderRightProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderRight'
			className={classNames('flex flex-shrink-0 flex-wrap items-center gap-4', className)}
			{...rest}>
			{children}
		</div>
	);
};
SubheaderRight.displayName = 'SubheaderRight';

// @start-snippet:: interface
type ISubheaderSeparatorProps = HTMLAttributes<HTMLDivElement>;
// @end-snippet:: interface
export const SubheaderSeparator: FC<ISubheaderSeparatorProps> = (props) => {
	const { className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderSeparator'
			className={classNames(
				'h-full border-e border-zinc-300/25 dark:border-zinc-800/50',
				className,
			)}
			{...rest}
		/>
	);
};
SubheaderSeparator.displayName = 'SubheaderSeparator';

// @start-snippet:: interface
interface ISubheaderProps {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
const Subheader: FC<ISubheaderProps> = (props) => {
	const { children, className, ...rest } = props;

	const divRef = useRef<HTMLDivElement>(null);
	const [domRect] = useDomRect(divRef as RefObject<HTMLElement>);

	return (
		<>
			<style>{`:root {--subheader-height: ${domRect?.height || 0}px}`}</style>
			<div
				data-component-name='Subheader'
				ref={divRef}
				className={classNames(
					'sticky top-[var(--header-height)] z-20',
					'flex flex-wrap justify-between gap-4 border-b border-border-main',
					'px-6 py-4',
					'bg-bg-sidebar/90 backdrop-blur-md dark:bg-bg-sidebar/90 dark:text-white',
					className,
				)}
				{...rest}>
				{children}
			</div>
		</>
	);
};
Subheader.displayName = 'Subheader';

export default Subheader;
