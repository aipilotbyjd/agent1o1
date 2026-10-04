import { Info } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

type Props = {
	text: string;
	size?: number;
	className?: string;
};

/**
 * Hover hint for node headers and field labels. Tooltip renders through a portal,
 * so it escapes the node's bounds instead of being clipped by the canvas.
 */
const NodeHelpTip = ({ text, size = 11, className }: Props) => {
	if (!text) return null;

	return (
		<Tooltip
			text={
				<span className='block text-[10px] leading-snug font-medium text-zinc-700 dark:text-zinc-200'>
					{text}
				</span>
			}
			className='bg-zinc-50/95 dark:bg-zinc-950/95'>
			<span
				className={`nodrag flex shrink-0 text-zinc-400 transition hover:text-primary-500 ${className ?? ''}`}
				onPointerDown={(event) => event.stopPropagation()}
				onClick={(event) => event.stopPropagation()}>
				<Info size={size} />
			</span>
		</Tooltip>
	);
};

export default NodeHelpTip;
