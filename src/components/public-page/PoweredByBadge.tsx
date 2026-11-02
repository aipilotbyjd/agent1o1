import { FC } from 'react';
import type { TPageBranding } from '@/types/public-page.type';

interface IPoweredByBadgeProps {
	branding: TPageBranding;
	isDark: boolean;
	onClick?: () => void;
}

/**
 * The "Made with Agent1o1" badge at the foot of a public workflow page.
 * Its link (from the API) is signup with the page creator's referral
 * code, so a visitor who clicks through and signs up is credited to
 * them. Opens in a new tab so the visitor keeps their result.
 */
const PoweredByBadge: FC<IPoweredByBadgeProps> = ({ branding, isDark, onClick }) => {
	if (!branding.show || !branding.url) return null;

	return (
		<div className='flex justify-center py-8'>
			<a
				href={branding.url}
				target='_blank'
				rel='noopener'
				onClick={onClick}
				data-testid='powered-by-badge'
				className={
					isDark
						? 'group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-300 shadow-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white'
						: 'group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900'
				}>
				<span aria-hidden='true'>⚡</span>
				<span>
					Made with <span className='font-semibold'>Agent1o1</span>
				</span>
				<span
					className={
						isDark
							? 'border-s border-white/15 ps-2 font-medium text-white'
							: 'border-s border-zinc-200 ps-2 font-medium text-zinc-900'
					}>
					Build your own free →
				</span>
			</a>
		</div>
	);
};

export default PoweredByBadge;
