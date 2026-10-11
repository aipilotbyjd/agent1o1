import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import type { TNodeChange } from '../../_helper/versionDiff.helper';
import ApiNodeIcon from '../library/NodeIcon.partial';
import { getNodeAccentColor, tintStyle } from '../library/library.util';

export type TVersionPreviewNodeData = {
	defKey: string;
	change?: TNodeChange;
	selected?: boolean;
};

export type TVersionPreviewNode = Node<TVersionPreviewNodeData, 'versionStep'>;

const changeStyles: Record<TNodeChange, { ring: string; badge: string; label: string }> = {
	added: {
		ring: 'ring-2 ring-emerald-500/70 dark:ring-emerald-400/60',
		badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
		label: 'New',
	},
	changed: {
		ring: 'ring-2 ring-amber-500/70 dark:ring-amber-400/60',
		badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
		label: 'Updated',
	},
};

const hiddenHandle = '!h-2 !w-2 !min-w-0 !border-0 !bg-zinc-300 dark:!bg-zinc-600';

/**
 * A step as it was in a published version — name and app only. The editing
 * node is deliberately not reused: its fields write straight into the draft.
 */
const VersionPreviewNode = ({ id, data }: NodeProps<TVersionPreviewNode>) => {
	const def = getNodeDefinition(data.defKey);
	const accent = getNodeAccentColor(id, undefined, def?.colorHex);
	const change = data.change ? changeStyles[data.change] : null;
	const brand = (def?.key.split('.')[0] ?? def?.category ?? 'step')
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

	return (
		<div
			className={[
				'w-[240px] cursor-pointer rounded-2xl border bg-white p-3.5 shadow-sm transition dark:bg-zinc-900',
				data.selected
					? 'border-primary-500 dark:border-primary-400'
					: 'border-zinc-200 dark:border-white/10',
				change?.ring ?? '',
			].join(' ')}>
			<Handle
				type='target'
				position={Position.Top}
				isConnectable={false}
				className={hiddenHandle}
			/>
			<div className='flex items-center gap-3'>
				<div
					className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'
					style={tintStyle(accent)}>
					<ApiNodeIcon icon={def?.icon} size={17} />
				</div>
				<div className='min-w-0 flex-1'>
					<p className='truncate text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
						{brand}
					</p>
					<p className='truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{def?.label ?? data.defKey}
					</p>
				</div>
				{change && (
					<span
						className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${change.badge}`}>
						{change.label}
					</span>
				)}
			</div>
			<Handle
				type='source'
				position={Position.Bottom}
				isConnectable={false}
				className={hiddenHandle}
			/>
		</div>
	);
};

export default VersionPreviewNode;
