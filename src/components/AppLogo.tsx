import useDarkMode from '@/hooks/useDarkMode';

/**
 * The product mark.
 *
 * The two source PNGs have their background baked in — the light art sits on white,
 * the dark art on near-black — so each one is only correct on its own theme, and the
 * mark is always clipped to a rounded tile rather than drawn onto a bare surface.
 * The `-256` files are the trimmed, normalised versions of the originals in /public:
 * cropped to the mark and padded so it fills the same fraction of the frame in both
 * themes, which the raw exports did not (58% vs 53%).
 */
const AppLogo = ({
	className = 'size-8',
	rounded = 'rounded-lg',
	alt = 'agent1o1',
	variant = 'auto',
}: {
	className?: string;
	rounded?: string;
	alt?: string;
	/**
	 * 'auto' follows the app theme. Pin it when the surface does not: the auth card
	 * is `bg-white` with no dark variant, so the dark mark would sit there as a black
	 * square once the rest of the app is in dark mode.
	 */
	variant?: 'auto' | 'light' | 'dark';
}) => {
	const { isDarkTheme } = useDarkMode();
	const useDark = variant === 'auto' ? isDarkTheme : variant === 'dark';

	return (
		<img
			src={useDark ? '/a-logo-dark-256.png' : '/a-logo-light-256.png'}
			alt={alt}
			width={256}
			height={256}
			className={`${className} ${rounded} shrink-0 object-cover`}
		/>
	);
};

export default AppLogo;
