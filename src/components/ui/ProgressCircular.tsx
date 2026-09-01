import { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { TColors } from '@/types/colors.type';
import themeConfig from '@/config/theme.config';

// @start-snippet:: interface
interface IProgressCircularProps extends HTMLAttributes<HTMLDivElement> {
	value?: number;
	min?: number;
	max?: number;
	color?: TColors;
	type?: 'full' | 'quarter' | 'half';
	bgStrokeWidth?: 0 | 1 | 2 | 3 | 4;
	circleStrokeWidth?: 0 | 1 | 2 | 3 | 4;
	strokeLinecap?: 'round' | 'butt' | 'square' | 'inherit';
	children?: ReactNode;
}
// @end-snippet:: interface
const ProgressCircular: FC<IProgressCircularProps> = (props) => {
	const {
		value,
		className,
		min = 0,
		max = 100,
		type = 'full',
		bgStrokeWidth = 2,
		circleStrokeWidth = 2,
		strokeLinecap = 'round',
		color = themeConfig.themeColor,
		children,
	} = props;

	const percentValue = (100 * ((value ?? 0) - min)) / (max - min);

	const calculatedValue = () => {
		if (type === 'full') return 100 - percentValue;
		if (type === 'quarter') return `${0.75 * percentValue} 100`;
		return `${0.5 * percentValue} 100`;
	};

	const colorClass: Record<TColors, string> = {
		primary: 'text-primary-500',
		secondary: 'text-secondary-500',
		zinc: 'text-zinc-500',
		red: 'text-red-500',
		amber: 'text-amber-500',
		lime: 'text-lime-500',
		emerald: 'text-emerald-500',
		sky: 'text-sky-500',
		blue: 'text-blue-500',
		violet: 'text-violet-500',
	};

	return (
		<div className={classNames('relative size-64', className)}>
			<svg
				className={classNames('size-full', {
					'-rotate-90': type === 'full',
					'rotate-[135deg]': type === 'quarter',
					'rotate-180': type === 'half',
				})}
				viewBox='0 0 36 36'
				xmlns='http://www.w3.org/2000/svg'>
				{/*Background Circle*/}
				<circle
					cx='18'
					cy='18'
					r='16'
					fill='none'
					className='stroke-current text-zinc-200/50 dark:text-zinc-700/50'
					strokeDasharray={
						(type === 'full' && '100') || (type === 'quarter' && '75 100') || '50 100'
					}
					strokeLinecap={strokeLinecap}
					strokeWidth={bgStrokeWidth}></circle>
				{/*Progress Circle*/}
				<circle
					cx='18'
					cy='18'
					r='16'
					fill='none'
					className={classNames(
						'stroke-current transition-all duration-300 ease-in-out',
						[`${color && colorClass[color]}`],
					)}
					strokeWidth={circleStrokeWidth}
					strokeDasharray={
						(type === 'full' && '100') ||
						(type === 'quarter' && calculatedValue()) ||
						(type === 'half' && calculatedValue()) ||
						undefined
					}
					strokeDashoffset={(type === 'full' && calculatedValue()) || undefined}
					strokeLinecap={strokeLinecap}></circle>
			</svg>

			{/*Percentage Text*/}
			{children && (
				<div
					className={classNames(
						'absolute start-1/2 -translate-x-1/2 -translate-y-1/2 transform',
						{ 'top-1/3': type === 'half', 'top-1/2': type !== 'half' },
					)}>
					<span
						className={classNames('text-center text-2xl font-bold', [
							`${color && colorClass[color]}`,
						])}>
						{children}
					</span>
				</div>
			)}
		</div>
	);
};
ProgressCircular.displayName = 'ProgressCircular';

export default ProgressCircular;
