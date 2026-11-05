import classNames from 'classnames';
import { aiLogoFor } from './providerLogos';

const sizes = {
	xxs: { box: 'h-4 w-4 rounded', img: 'h-2.5 w-2.5', text: 'text-[8px]' },
	xs: { box: 'h-6 w-6 rounded-md', img: 'h-3.5 w-3.5', text: 'text-[10px]' },
	sm: { box: 'h-8 w-8 rounded-lg', img: 'h-4 w-4', text: 'text-xs' },
	md: { box: 'h-10 w-10 rounded-xl', img: 'h-5 w-5', text: 'text-sm' },
	lg: { box: 'h-12 w-12 rounded-2xl', img: 'h-6 w-6', text: 'text-base' },
};

interface IProviderLogoProps {
	/** A provider key or a model brand. */
	provider: string;
	label: string;
	size?: keyof typeof sizes;
}

const ProviderLogo = ({ provider, label, size = 'md' }: IProviderLogoProps) => {
	const logo = aiLogoFor(provider);
	const s = sizes[size];

	return (
		<div
			className={classNames(
				'flex shrink-0 items-center justify-center border border-zinc-100 bg-white shadow-xs dark:border-zinc-700 dark:bg-zinc-800',
				s.box,
			)}>
			{logo ? (
				<img
					src={logo.src}
					alt={`${label} logo`}
					className={classNames(s.img, logo.mono && 'dark:invert')}
				/>
			) : (
				<span className={classNames('font-black text-zinc-500', s.text)}>
					{label.charAt(0)}
				</span>
			)}
		</div>
	);
};

export default ProviderLogo;
