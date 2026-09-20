import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import useAsideStatus from '@/hooks/useAsideStatus';

// @start-snippet:: interface
interface IWrapperProps {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
const Wrapper: FC<IWrapperProps> = (props) => {
	const { children, className, ...rest } = props;

	const { asideStatus } = useAsideStatus();

	return (
		<section
			data-component-name='Wrapper'
			className={classNames(
				'flex flex-auto flex-col',
				'bg-bg-main dark:bg-bg-main',
				'transition-all duration-300 ease-in-out',
				className,
				{
					'md:peer-[&]:ltr:pl-[20rem] md:peer-[&]:rtl:pr-[20rem]': asideStatus,
					// Mobile Design
					'md:peer-[&]:ltr:pl-[5.25em] md:peer-[&]:rtl:pr-[5.25em]': !asideStatus,
				},
			)}
			{...rest}>
			{children}
		</section>
	);
};

export default Wrapper;
