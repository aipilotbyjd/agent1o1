import classNames from 'classnames';
import anthropic from '@/assets/images/ai-providers/anthropic.svg';
import deepseek from '@/assets/images/ai-providers/deepseek.svg';
import fireworks from '@/assets/images/ai-providers/fireworks.svg';
import gemini from '@/assets/images/ai-providers/gemini.svg';
import groq from '@/assets/images/ai-providers/groq.svg';
import mistral from '@/assets/images/ai-providers/mistral.svg';
import openai from '@/assets/images/ai-providers/openai.svg';
import openrouter from '@/assets/images/ai-providers/openrouter.svg';
import together from '@/assets/images/ai-providers/together.svg';
import xai from '@/assets/images/ai-providers/xai.svg';
import alibaba from '@/assets/images/ai-providers/alibaba.svg';
import google from '@/assets/images/ai-providers/google.svg';
import meta from '@/assets/images/ai-providers/meta.svg';
import minimax from '@/assets/images/ai-providers/minimax.svg';
import moonshot from '@/assets/images/ai-providers/moonshot.svg';
import nvidia from '@/assets/images/ai-providers/nvidia.svg';
import zhipu from '@/assets/images/ai-providers/zhipu.svg';

/**
 * Keyed by AI provider (`config/byok.php`) and by model brand (the catalog's
 * `brand`), which overlap. `mono` logos are drawn in one dark colour and are
 * inverted in dark mode.
 */
const logos: Record<string, { src: string; mono: boolean }> = {
	openai: { src: openai, mono: true },
	anthropic: { src: anthropic, mono: true },
	gemini: { src: gemini, mono: false },
	mistral: { src: mistral, mono: false },
	deepseek: { src: deepseek, mono: false },
	xai: { src: xai, mono: true },
	groq: { src: groq, mono: true },
	openrouter: { src: openrouter, mono: true },
	fireworks: { src: fireworks, mono: false },
	together: { src: together, mono: false },
	google: { src: google, mono: false },
	meta: { src: meta, mono: false },
	moonshot: { src: moonshot, mono: false },
	zhipu: { src: zhipu, mono: false },
	minimax: { src: minimax, mono: false },
	alibaba: { src: alibaba, mono: false },
	nvidia: { src: nvidia, mono: false },
};

const sizes = {
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
	const logo = logos[provider];
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
