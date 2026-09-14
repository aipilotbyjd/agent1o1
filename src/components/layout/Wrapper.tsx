import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import useAsideStatus from '@/hooks/useAsideStatus';

// @start-snippet:: interface
interface IWrapperProps {
	children: ReactNode;
	className?: string;
	hasAside?: boolean;
	borderDisabled?: boolean;
}
// @end-snippet:: interface
const Wrapper: FC<IWrapperProps> = (props) => {
	const { children, className, hasAside = true, borderDisabled = false, ...rest } = props;

	const { asideStatus } = useAsideStatus();

	return (
		<section
			data-component-name='Wrapper'
			className={classNames(
				'flex flex-auto flex-col',
				'bg-bg-main dark:bg-bg-main',
				!borderDisabled && 'border-s-[1rem] border-e-[1rem] border-border-main md:border-s-0 dark:border-border-main',
				'transition-all duration-300 ease-in-out',
				className,
				{
					'md:peer-[&]:ltr:pl-[20rem] md:peer-[&]:rtl:pr-[20rem]': hasAside && asideStatus,
					// Mobile Design
					'md:peer-[&]:ltr:pl-[5.25em] md:peer-[&]:rtl:pr-[5.25em]': hasAside && !asideStatus,
					'md:peer-[&]:ltr:pl-0 md:peer-[&]:rtl:pr-0': !hasAside,
				},
			)}
			{...rest}>
			{!borderDisabled && (
				<div className='sticky top-0 z-99 h-full max-h-4 min-h-4 bg-bg-main dark:bg-bg-main'>
					<div className='absolute start-0 top-[calc(1rem+1px)] h-4 w-4 corner-top-left rtl:top-4 rtl:corner-top-right' />
					<div className='absolute end-px top-4 h-4 w-4 corner-top-right rtl:-left-px rtl:corner-top-left' />
				</div>
			)}
			{children}
			{!borderDisabled && (
				<div className='sticky bottom-0 z-99 h-full max-h-4 min-h-4 bg-bg-main dark:bg-bg-main'>
					<div className='absolute start-px -top-4 h-4 w-4 corner-bottom-left rtl:start-0 rtl:corner-bottom-right' />
					<div className='absolute end-0 -top-[calc(1rem+1px)] h-4 w-4 corner-bottom-right rtl:-top-4 rtl:corner-bottom-left' />
				</div>
			)}
		</section>
	);
};

export default Wrapper;
