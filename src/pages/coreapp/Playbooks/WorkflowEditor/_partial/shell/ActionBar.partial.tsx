import { useReactFlow } from '@xyflow/react';
import { Bug, Grid2X2, LayoutGrid, Maximize2, Minus, Plus, Search, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';

const ToolButton = ({
	title,
	children,
	onClick,
	active,
	danger,
	className,
}: {
	title: string;
	children: ReactNode;
	onClick: () => void;
	active?: boolean;
	danger?: boolean;
	className?: string;
}) => (
	<button
		type='button'
		title={title}
		aria-label={title}
		onClick={onClick}
		className={[
			'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition',
			danger && active
				? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
				: active
					? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-500/20'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white',
			className,
		].filter(Boolean).join(' ')}>
		{children}
	</button>
);

const ActionBar = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();

	return (
		<motion.div
			initial={{ y: 16, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			className='dark:border-zinc-800 absolute right-5 bottom-5 z-10 flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-md shadow-zinc-200/50 dark:bg-[#07080b] dark:shadow-none max-w-[calc(100vw-40px)]'>
			<ToolButton title='Zoom out' onClick={() => reactFlow.zoomOut({ duration: 150 })}>
				<Minus size={14} />
			</ToolButton>
			<div className='text-zinc-650 flex min-w-[2.5rem] items-center justify-center text-[11px] font-bold dark:text-zinc-400'>
				{Math.round(reactFlow.getZoom() * 100)}%
			</div>
			<ToolButton title='Zoom in' onClick={() => reactFlow.zoomIn({ duration: 150 })}>
				<Plus size={14} />
			</ToolButton>
			<div className='mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800' />
			<ToolButton
				title='Fit view (⌘⇧F)'
				onClick={() => reactFlow.fitView({ padding: 0.18, duration: 240 })}>
				<Maximize2 size={13} />
			</ToolButton>
			<ToolButton
				title='Toggle minimap'
				active={state.ui.miniMapOpen}
				onClick={() => dispatch({ type: 'TOGGLE_MINIMAP' })}>
				<Grid2X2 size={13} />
			</ToolButton>
			<ToolButton
				title='Auto-layout (L)'
				onClick={() => dispatch({ type: 'AUTO_LAYOUT' })}
				className='hidden sm:flex'>
				<LayoutGrid size={13} />
			</ToolButton>
			<div className='hidden sm:block mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800' />
			<ToolButton
				title='Search canvas (⌘F)'
				active={state.ui.canvasSearchOpen}
				onClick={() =>
					dispatch({
						type: 'SET_CANVAS_SEARCH',
						open: !state.ui.canvasSearchOpen,
					})
				}
				className='hidden sm:flex'>
				<Search size={13} />
			</ToolButton>
			<ToolButton
				title='Step-through debug mode (⌘⇧D)'
				active={state.ui.stepMode}
				danger={state.ui.stepMode}
				onClick={() => dispatch({ type: 'SET_STEP_MODE', enabled: !state.ui.stepMode })}
				className='hidden sm:flex'>
				<Bug size={13} />
			</ToolButton>
			<ToolButton
				title='Command palette (⌘P)'
				onClick={() => dispatch({ type: 'SET_COMMAND_PALETTE', open: true })}
				className='hidden sm:flex'>
				<Sliders size={13} />
			</ToolButton>
		</motion.div>
	);
};

export default ActionBar;
