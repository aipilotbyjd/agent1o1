import { FC, InputHTMLAttributes, useId } from 'react';
import classNames from 'classnames';
import { IValidationBaseProps } from './Validation';

// @start-snippet:: interface
interface IRangeSliderProps
	extends InputHTMLAttributes<HTMLInputElement>, Partial<IValidationBaseProps> {
	className?: string;
	id?: string;
	name: string;
	type?: 'range';
}
// @end-snippet:: interface
const RangeSlider: FC<IRangeSliderProps> = (props) => {
	const { className, id, type = 'range', ...rest } = props;

	const defaultId = useId();

	return (
		<>
			<label htmlFor={id || defaultId} className='sr-only'>
				Example range
			</label>
			<input
				type={type}
				id={id || defaultId}
				className={classNames(
					'w-full cursor-pointer appearance-none bg-transparent focus:outline-hidden',
					// Range track
					'[&::-moz-range-track]:h-2',
					'[&::-moz-range-track]:w-full',
					'[&::-moz-range-track]:rounded-full',
					'[&::-moz-range-track]:bg-zinc-100',
					// Slider runnable track
					'&::-webkit-slider-runnable-track]:h-2',
					'[&::-webkit-slider-runnable-track]:w-full',
					'[&::-webkit-slider-runnable-track]:rounded-full',
					'[&::-webkit-slider-runnable-track]:bg-zinc-100',
					'dark:[&::-webkit-slider-runnable-track]:bg-zinc-700',
					// Slider thumb
					'[&::-webkit-slider-thumb]:-mt-0.5',
					'[&::-webkit-slider-thumb]:h-2.5',
					'[&::-webkit-slider-thumb]:w-2.5',
					'[&::-webkit-slider-thumb]:appearance-none',
					'[&::-webkit-slider-thumb]:rounded-full',
					'[&::-webkit-slider-thumb]:bg-white',
					'[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(37,99,235,1)]',
					'[&::-webkit-slider-thumb]:transition-all',
					'[&::-webkit-slider-thumb]:duration-150',
					'[&::-webkit-slider-thumb]:ease-in-out',
					'dark:[&::-webkit-slider-thumb]:bg-zinc-700',
					// Range thumb
					'[&::-moz-range-thumb]:h-2.5',
					'[&::-moz-range-thumb]:w-2.5',
					'[&::-moz-range-thumb]:appearance-none',
					'[&::-moz-range-thumb]:rounded-full',
					'[&::-moz-range-thumb]:border-4',
					'[&::-moz-range-thumb]:border-blue-500',
					'[&::-moz-range-thumb]:bg-white',
					'[&::-moz-range-thumb]:transition-all',
					'[&::-moz-range-thumb]:duration-150',
					'[&::-moz-range-thumb]:ease-in-out',
					// Disable
					'disabled:pointer-events-none disabled:opacity-50',
					className,
				)}
				// aria-orientation='horizontal'
				{...rest}
			/>
		</>
	);
};
RangeSlider.displayName = 'RangeSlider';

export default RangeSlider;
