import { type NodeProps } from '@xyflow/react';
import type { TCanvasNode } from '../../../_types/canvas.type';

const StickyNote = ({ data, selected }: NodeProps<TCanvasNode>) => (
	<div
		className={[
			'w-[200px] rounded-2xl border p-4 text-left shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_28px_-8px_rgba(24,24,27,0.14)] transition hover:shadow-[0_2px_4px_rgba(24,24,27,0.05),0_22px_44px_-10px_rgba(24,24,27,0.22)]',
			'border-amber-300 bg-amber-100 text-amber-950',
			'dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
			selected ? 'ring-2 ring-amber-400/40' : '',
		].join(' ')}>
		<div className='text-xs font-black tracking-widest text-amber-700 uppercase dark:text-amber-400'>
			Note
		</div>
		<div className='mt-1.5 text-sm whitespace-pre-line'>
			{String(data.values.content ?? 'Add notes in the inspector.')}
		</div>
	</div>
);

export default StickyNote;
