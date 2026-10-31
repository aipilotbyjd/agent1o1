import classNames from 'classnames';
import { useBrand } from '@/context/brand';

const SIZES = {
	sm: 'h-6 w-6 text-sm',
	md: 'h-10 w-10 text-xl',
	lg: 'h-16 w-16 text-3xl',
} as const;

interface IBrandMarkProps {
	size?: keyof typeof SIZES;
	className?: string;
}

/**
 * The assistant's mark: the server-provided icon, or its emoji on the brand
 * colour when no icon is set. Never hard-code the assistant's image.
 */
const BrandMark = ({ size = 'md', className }: IBrandMarkProps) => {
	const brand = useBrand();

	if (brand.icon_url) {
		return (
			<img
				src={brand.icon_url}
				alt={brand.name}
				className={classNames('shrink-0 rounded-full object-cover', SIZES[size], className)}
			/>
		);
	}

	return (
		<span
			role='img'
			aria-label={brand.name}
			className={classNames(
				'bg-assistant/15 inline-flex shrink-0 items-center justify-center rounded-full',
				SIZES[size],
				className,
			)}>
			{brand.emoji}
		</span>
	);
};

export default BrandMark;
