import { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { TRounded } from '@/types/rounded.type';
import { TColors } from '@/types/colors.type';
import themeConfig from '@/config/theme.config';

// @start-snippet:: interface
interface IProgressBarProps extends HTMLAttributes<HTMLDivElement> {
	value?: number;
	min?: number;
	max?: number;
	color?: TColors;
	label?: ReactNode;
	isStraight?: boolean;
	isVertical?: boolean;
}
// @end-snippet:: interface
/**
 * Only used as a child of the Progress component
 * @param props
 * @constructor
 */
export const ProgressBar: FC<IProgressBarProps> = (props) => {
	const {
		value,
		min = 0,
		max = 100,
		color = themeConfig.themeColor,
		label,
		isStraight,
		isVertical,
		className,
	} = props;

	const calculatedValue: number = (100 * ((value ?? 0) - min)) / (max - min);

	const colorClass: Record<TColors, string> = {
		primary: 'bg-primary-500',
		secondary: 'bg-secondary-500',
		zinc: 'bg-zinc-500',
		red: 'bg-red-500',
		amber: 'bg-amber-500',
		lime: 'bg-lime-500',
		emerald: 'bg-emerald-500',
		sky: 'bg-sky-500',
		blue: 'bg-blue-500',
		violet: 'bg-violet-500',
	};

	return (
		<div
			role='progressbar'
			aria-valuenow={value}
			aria-valuemin={min}
			aria-valuemax={max}
			style={{
				width: !isVertical ? `${calculatedValue}%` : undefined,
				height: isVertical ? `${calculatedValue}%` : undefined,
			}}
			className={classNames(
				className,
				'flex flex-col items-center justify-center overflow-hidden text-center text-xs whitespace-nowrap text-white transition-all duration-300 ease-in-out',
				[`${color && colorClass[color]}`],
				{ 'rounded-[inherit]': !isStraight },
			)}>
			{label}
		</div>
	);
};

// @start-snippet:: interface
interface IProgressProps extends IProgressBarProps {
	className?: string;
	rounded?: TRounded;
	labelEnd?: ReactNode;
	children?: ReactNode;
}
// @end-snippet:: interface
const Progress: FC<IProgressProps> = (props) => {
	const {
		value,
		className,
		min = 0,
		max = 100,
		rounded = 'rounded-full',
		label,
		labelEnd,
		color = themeConfig.themeColor,
		children,
		isVertical,
		isStraight,
	} = props;

	return (
		<div
			className={classNames('flex items-center gap-3 whitespace-nowrap', {
				'w-fit flex-col-reverse': isVertical,
			})}>
			<div
				className={classNames(
					'flex overflow-hidden bg-zinc-200/50 dark:bg-zinc-700/50',
					{
						'h-2 w-full': !isVertical,
						'h-32 w-2 flex-col flex-nowrap justify-end': isVertical,
					},
					className,
					rounded,
				)}>
				{children || (
					<ProgressBar
						value={value}
						min={min}
						max={max}
						color={color}
						label={label}
						isVertical={isVertical}
						isStraight={isStraight}
					/>
				)}
			</div>
			{labelEnd && (
				<div className='w-fit text-end'>
					<span className='text-sm text-zinc-800 dark:text-white'>{labelEnd}</span>
				</div>
			)}
		</div>
	);
};

export default Progress;
