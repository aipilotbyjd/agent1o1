import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import classNames from 'classnames';

type TVariant = 'primary' | 'dark' | 'ghost';

const variants: Record<TVariant, string> = {
	primary:
		'bg-primary-500 text-primary-foreground hover:bg-primary-600 shadow-[0_8px_20px_-8px_rgb(183_229_47/0.7)]',
	dark: 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200',
	ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
};

type TProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: TVariant;
	isLoading?: boolean;
	icon?: ReactNode;
};

/** The wizard's one button: a clear primary action, a dark secondary, and a quiet ghost. */
const WizardButton = ({
	variant = 'primary',
	isLoading = false,
	icon,
	className,
	children,
	disabled,
	type = 'button',
	...rest
}: TProps) => (
	<button
		type={type}
		disabled={disabled || isLoading}
		className={classNames(
			'focus-visible:ring-primary-500 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950',
			variants[variant],
			className,
		)}
		{...rest}>
		{isLoading ? <Loader2 className='size-4 animate-spin' /> : icon}
		{children}
	</button>
);

export default WizardButton;
