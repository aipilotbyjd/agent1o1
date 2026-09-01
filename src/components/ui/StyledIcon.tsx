import { FC } from 'react';
import classNames from 'classnames';
import { TIcons } from '@/types/icons.type';
import Icon from '@/components/icon/Icon';
import { TColors } from '@/types/colors.type';
import themeConfig from '@/config/theme.config';
import { TRounded } from '@/types/rounded.type';

// @start-snippet:: interface
export type TStyledIconVariants = 'solid' | 'outline' | 'ghost' | 'soft' | 'softOutline';
interface IStyledIconProps {
	className?: string;
	icon: TIcons;
	variant?: TStyledIconVariants;
	color?: TColors;
	rounded?: TRounded;
}
// @end-snippet:: interface
const StyledIcon: FC<IStyledIconProps> = (props) => {
	const {
		icon,
		className,
		variant = 'solid',
		color = themeConfig.themeColor,
		rounded = 'rounded-full',
		...rest
	} = props;

	const iconVariant: Record<TStyledIconVariants, Record<TColors, string>> = {
		solid: {
			primary: 'bg-primary-500 text-black',
			secondary: 'bg-secondary-500 text-white',
			zinc: 'bg-zinc-500 text-white',
			red: 'bg-red-500 text-white',
			amber: 'bg-amber-500 text-white',
			lime: 'bg-lime-500 text-white',
			emerald: 'bg-emerald-500 text-white',
			sky: 'bg-sky-500 text-white',
			blue: 'bg-blue-500 text-white',
			violet: 'bg-violet-500 text-white',
		},
		outline: {
			primary:
				'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500 border',
			secondary:
				'border-secondary-600 text-secondary-600 dark:border-secondary-500 dark:text-secondary-500 border',
			zinc: 'border-zinc-600 text-zinc-600 dark:border-zinc-500 dark:text-zinc-500 border',
			red: 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 border',
			amber: 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500 border',
			lime: 'border-lime-600 text-lime-600 dark:border-lime-500 dark:text-lime-500 border',
			emerald:
				'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-500 border',
			sky: 'border-sky-600 text-sky-600 dark:border-sky-500 dark:text-sky-500 border',
			blue: 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 border',
			violet: 'border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-500 border',
		},
		ghost: {
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
		},
		soft: {
			primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-400',
			secondary:
				'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-400',
			zinc: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
			red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
			amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-400',
			lime: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-400',
			emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400',
			sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-400',
			blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
			violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-400',
		},
		softOutline: {
			primary:
				'border-primary-100 bg-primary-200 text-primary-800 dark:border-primary-900 dark:bg-primary-800 dark:text-primary-400 border-4',
			secondary:
				'border-secondary-100 bg-secondary-200 text-secondary-800 dark:border-secondary-900 dark:bg-secondary-800 dark:text-secondary-400 border-4',
			zinc: 'border-zinc-100 bg-zinc-200 text-zinc-800 dark:border-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 border-4',
			red: 'border-red-100 bg-red-200 text-red-800 dark:border-red-900 dark:bg-red-800 dark:text-red-400 border-4',
			amber: 'border-amber-100 bg-amber-200 text-amber-800 dark:border-amber-900 dark:bg-amber-800 dark:text-amber-400 border-4',
			lime: 'border-lime-100 bg-lime-200 text-lime-800 dark:border-lime-900 dark:bg-lime-800 dark:text-lime-400 border-4',
			emerald:
				'border-emerald-100 bg-emerald-200 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-800 dark:text-emerald-400 border-4',
			sky: 'border-sky-100 bg-sky-200 text-sky-800 dark:border-sky-900 dark:bg-sky-800 dark:text-sky-400 border-4',
			blue: 'border-blue-100 bg-blue-200 text-blue-800 dark:border-blue-900 dark:bg-blue-800 dark:text-blue-400 border-4',
			violet: 'border-violet-100 bg-violet-200 text-violet-800 dark:border-violet-900 dark:bg-violet-800 dark:text-violet-400 border-4',
		},
	};

	const iconVariantClasses = iconVariant[variant][color];

	return (
		<div className={classNames(className)}>
			<span
				className={classNames(
					iconVariantClasses,
					rounded,
					'inline-flex items-center justify-center p-2',
				)}>
				<Icon icon={icon} size='text-2xl' {...rest} />
			</span>
		</div>
	);
};
StyledIcon.displayName = 'StyledIcon';

export default StyledIcon;
