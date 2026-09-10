import { HUE_TO_CLASSES } from '../../_helper/builder.constants';
import type { TNodeDefinition } from '../../_types/node.type';

const NodeCategorySection = ({
	label,
	color,
	nodes,
	onAdd,
}: {
	label: string;
	color: string;
	nodes: TNodeDefinition[];
	onAdd: (node: TNodeDefinition) => void;
}) => {
	if (!nodes.length) return null;
	const hue = HUE_TO_CLASSES[color] ?? HUE_TO_CLASSES.zinc;

	return (
		<div className='px-3 py-3'>
			<div className='mb-1 flex items-center justify-between px-1'>
				<span className='text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase dark:text-zinc-600'>
					{label}
				</span>
				<span
					className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${hue.darkBg} ${hue.darkText}`}>
					{nodes.length}
				</span>
			</div>
			<div className='space-y-1'>
				{nodes.map((node) => (
					<button
						key={node.key}
						type='button'
						draggable
						onDragStart={(event) => {
							event.dataTransfer.setData('application/x-node-def', node.key);
							event.dataTransfer.setData(
								'application/x-node-definition',
								JSON.stringify(node),
							);
							event.dataTransfer.effectAllowed = 'move';
						}}
						onClick={() => onAdd(node)}
						className='group flex w-full cursor-grab items-center gap-2 rounded-lg border border-transparent p-2 text-left transition hover:border-zinc-200 hover:bg-zinc-50 active:cursor-grabbing dark:hover:border-white/10 dark:hover:bg-white/[0.05]'>
						<span
							className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[10px] font-black ${hue.darkBg} ${hue.darkText} ${hue.darkBorder}`}>
							{node.icon}
						</span>
						<span className='min-w-0 flex-1'>
							<span className='block truncate text-sm font-semibold text-zinc-950 dark:text-zinc-200'>
								{node.label}
							</span>
							<span className='line-clamp-1 text-xs text-zinc-500'>
								{node.description}
							</span>
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default NodeCategorySection;
