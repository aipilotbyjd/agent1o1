import { forwardRef, InputHTMLAttributes, useId } from 'react';
import classNames from 'classnames';
import Label from './Label';
import { IValidationBaseProps } from './Validation';
import { TRounded } from '@/types/rounded.type';
import { TInputDimension, TInputVariants } from './Input';
import themeConfig from '@/config/theme.config';

// @start-snippet:: interface
interface IFileInputBaseProps
	extends InputHTMLAttributes<HTMLInputElement>, Partial<IValidationBaseProps> {
	id?: string;
	className?: string;
	name: string;
	rounded?: TRounded;
	dimension?: TInputDimension;
	type?: 'file';
	value?: string | number | readonly string[] | undefined;
	variant?: TInputVariants;
	label?: string;
}

interface UnderlineFileVariantProps extends Omit<IFileInputBaseProps, 'variant' | 'rounded'> {
	variant: 'underline';
	rounded?: undefined;
}

interface OtherFileVariantProps extends IFileInputBaseProps {
	variant?: Exclude<TInputVariants, 'underline'>;
}

type TFileInputProps = UnderlineFileVariantProps | OtherFileVariantProps;
// @end-snippet:: interface

const FileInput = forwardRef<HTMLInputElement, TFileInputProps>((props, ref) => {
	const {
		id,
		className,
		name,
		rounded = themeConfig.rounded,
		dimension = 'default',
		variant = 'default',
		isValid,
		isTouched,
		invalidFeedback,
		label,
		...rest
	} = props;

	const defaultId = useId();

	const inputVariants: { [key in TInputVariants]: { general: string; validation: string } } = {
		default: {
			general: classNames(
				// Default
				'dark:bg-zinc-900 dark:text-zinc-400',
				'border-zinc-200 dark:border-zinc-700',
				'placeholder-zinc-500',
				// Focus
				'focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-zinc-600',
			),
			validation: classNames({
				'border-red-500! ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'border-emerald-500! focus:ring-4 focus:ring-emerald-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
		solid: {
			general: classNames(
				// Default
				[`border-zinc-100 dark:border-zinc-800`],
				'bg-zinc-100 dark:bg-zinc-800',
				// Hover
				'hover:border-blue-500',
				'dark:hover:border-blue-500',
				// Focus
				'focus:border-zinc-300 dark:focus:border-zinc-800',
				'focus:bg-transparent dark:focus:bg-transparent',
				// Disabled
				'disabled:border-zinc-500!',
			),
			validation: classNames({
				'border-red-500! ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'border-emerald-500! focus:ring-4 focus:ring-emerald-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
		gray: {
			general: classNames(
				// Default
				'bg-zinc-100 dark:bg-zinc-700',
				'dark:text-zinc-400',
				'border-transparent dark:border-transparent',
				'dark:placeholder-zinc-500',
				// Focus
				'focus:ring-blue-500 dark:focus:ring-zinc-600',
				'focus:border-blue-500',
			),

			validation: classNames({
				'border-red-500! ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'border-emerald-500! focus:ring-4 focus:ring-emerald-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
		underline: {
			general: classNames(
				// Default
				'border-b-2 border-x-transparent! border-b-zinc-200 border-t-transparent!',
				'bg-transparent pe-0 dark:border-b-zinc-700 dark:text-zinc-400 dark:placeholder-zinc-500 ',
				// Focus
				'focus:border-x-transparent focus:border-b-blue-500 focus:border-t-transparent focus:ring-0 dark:focus:border-b-zinc-600 dark:focus:ring-zinc-600',
			),
			validation: classNames({
				'border-red-500! ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'border-emerald-500! focus:ring-4 focus:ring-emerald-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
	};
	const inputVariantClasses = inputVariants[variant as TInputVariants].general;
	const inputValidationsClasses = inputVariants[variant as TInputVariants].validation;

	/**
	 * Padding & Font Size & Icon Margin
	 */
	const inputDimension: { [key in TInputDimension]: { general: string } } = {
		sm: {
			general: classNames('text-sm'),
		},
		default: {
			general: classNames('text-base'),
		},
		lg: {
			general: classNames('text-lg'),
		},
	};
	const inputDimensionClasses = inputDimension[dimension].general;

	const classes = classNames(
		'w-full peer block appearance-none outline-0',
		'text-black dark:text-white',
		'disabled:pointer-events-none disabled:opacity-50',
		// themeConfig.transition,
		inputVariantClasses,
		[`${inputDimensionClasses}`],
		{ [`${rounded}`]: variant !== 'underline' },
		inputValidationsClasses,
		className,
	);

	return (
		<>
			{label && <Label htmlFor={id || defaultId}>{label}</Label>}
			<input
				ref={ref}
				type='file'
				id={id || defaultId}
				name={name}
				className={classNames(
					'cursor-pointer overflow-hidden border file:me-4 file:border-0 file:bg-zinc-500 file:px-4 file:py-3 file:text-zinc-200 file:transition-all file:duration-300 file:ease-in-out hover:file:bg-zinc-600 focus:z-10',
					classes,
				)}
				{...rest}
			/>
		</>
	);
});
FileInput.displayName = 'FileInput';

export default FileInput;
