import { FC, HTMLAttributes } from 'react';
import classNames from 'classnames';

// @start-snippet:: interface
type TDeviceTypes = 'mobile' | 'desktop';
interface IDevicesProps extends HTMLAttributes<HTMLElement> {
	src: string;
	className?: string;
	device?: TDeviceTypes;
}
// @end-snippet:: interface
const Devices: FC<IDevicesProps> = (props) => {
	const { src, className, device = 'mobile', ...rest } = props;

	if (device === 'mobile') {
		return (
			<figure className={classNames('h-auto w-60 max-w-full', className)} {...rest}>
				<div className='rounded-3xl bg-zinc-800 p-1.5 shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(45_55_75_/_20%),_0_2rem_4rem_-2rem_rgb(45_55_75_/_30%),_inset_0_-0.1875rem_0.3125rem_0_rgb(45_55_75_/_20%)] dark:bg-neutral-600 dark:shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(0_0_0_/_20%),_0_2rem_4rem_-2rem_rgb(0_0_0_/_30%),_inset_0_-0.1875rem_0.3125rem_0_rgb(0_0_0_/_20%)]'>
					<img
						className='aspect-8/16 h-auto max-w-full rounded-[1.25rem] object-cover'
						src={src}
						alt='Mobile Placeholder'
					/>
				</div>
			</figure>
		);
	}
	return (
		<figure
			className={classNames(
				'relative z-1 h-auto w-[50rem] max-w-full rounded-b-lg shadow-2xl',
				className,
			)}
			{...rest}>
			<div className='relative flex max-w-[50rem] items-center rounded-t-lg bg-zinc-800 px-24 py-2 dark:bg-neutral-700'>
				<div className='absolute start-4 top-2/4 flex -translate-y-1 gap-x-1'>
					<span className='size-2 rounded-full bg-zinc-600 dark:bg-neutral-600'></span>
					<span className='size-2 rounded-full bg-zinc-600 dark:bg-neutral-600'></span>
					<span className='size-2 rounded-full bg-zinc-600 dark:bg-neutral-600'></span>
				</div>
				<div className='flex size-full items-center justify-center rounded-xs bg-zinc-700 text-[.25rem] text-zinc-400 sm:text-[.5rem] dark:bg-neutral-600 dark:text-neutral-400'>
					www.omtanke.studio
				</div>
			</div>

			<div className='rounded-b-lg bg-zinc-800'>
				<img
					className='h-auto max-w-full rounded-b-lg object-cover'
					src={src}
					alt='Browser Placeholder'
				/>
			</div>
		</figure>
	);
};

export default Devices;
