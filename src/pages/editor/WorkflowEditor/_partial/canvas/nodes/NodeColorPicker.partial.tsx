import { Palette, X } from 'lucide-react';
import { useState } from 'react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';

const PRESET_COLORS = [
	{ label: 'Default', value: null },
	{ label: 'Violet', value: '#8b5cf6' },
	{ label: 'Rose', value: '#f43f5e' },
	{ label: 'Amber', value: '#f59e0b' },
	{ label: 'Emerald', value: '#10b981' },
	{ label: 'Sky', value: '#0ea5e9' },
	{ label: 'Fuchsia', value: '#d946ef' },
	{ label: 'Orange', value: '#f97316' },
	{ label: 'Cyan', value: '#06b6d4' },
	{ label: 'Lime', value: '#84cc16' },
	{ label: 'Slate', value: '#64748b' },
	{ label: 'Red', value: '#ef4444' },
];

const NodeColorPicker = ({ nodeId, currentColor }: { nodeId: string; currentColor?: string }) => {
	const { dispatch } = useWorkflowEditor();
	const [open, setOpen] = useState(false);

	return (
		<div className='relative'>
			<button
				type='button'
				title='Change node color'
				onClick={(e) => {
					e.stopPropagation();
					setOpen((prev) => !prev);
				}}
				className='flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200'>
				<Palette size={13} />
			</button>

			{open && (
				<div
					className='absolute top-8 right-0 z-50 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
					onClick={(e) => e.stopPropagation()}>
					<div className='mb-2 flex items-center justify-between px-1'>
						<span className='text-[11px] font-bold text-zinc-500'>Node color</span>
						<button
							type='button'
							onClick={() => setOpen(false)}
							className='flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white'>
							<X size={11} />
						</button>
					</div>
					<div className='grid grid-cols-4 gap-1.5'>
						{PRESET_COLORS.map((preset) => (
							<button
								key={preset.label}
								type='button'
								title={preset.label}
								onClick={() => {
									dispatch({
										type: 'SET_NODE_COLOR',
										id: nodeId,
										color: preset.value,
									});
									setOpen(false);
								}}
								className={[
									'h-8 w-full rounded-lg border-2 transition hover:scale-105',
									currentColor === preset.value
										? 'border-primary-500 ring-2 ring-primary-500/30'
										: 'border-transparent',
									preset.value === null ? 'bg-zinc-100 dark:bg-zinc-700' : '',
								].join(' ')}
								style={preset.value ? { backgroundColor: preset.value } : {}}>
								{preset.value === null && (
									<X size={12} className='mx-auto text-zinc-400' />
								)}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default NodeColorPicker;
