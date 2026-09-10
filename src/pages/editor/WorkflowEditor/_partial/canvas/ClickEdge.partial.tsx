import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TCanvasEdge } from '../../_types/canvas.type';

const ClickEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style,
	selected,
	data,
}: EdgeProps<TCanvasEdge>) => {
	const { dispatch } = useWorkflowEditor();
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		borderRadius: 16,
	});

	const stroke = (style?.stroke as string) ?? 'rgb(139 92 246)';
	const arrowId = `edge-arrow-${id}`;
	const glowId = `edge-glow-${id}`;
	const pathId = `edge-path-${id}`;
	const isEmphasized = Boolean(selected || data?.isActive);
	const strokeWidth = isEmphasized ? 7 : 5;
	const dotDelays = [0, 0.55, 1.1];

	return (
		<>
			<defs>
				<marker
					id={arrowId}
					viewBox='0 0 20 20'
					refX='15'
					refY='10'
					markerWidth='13'
					markerHeight='13'
					markerUnits='userSpaceOnUse'
					orient='auto-start-reverse'>
					<path
						d='M3 4 L16 10 L3 16'
						fill='none'
						stroke={stroke}
						strokeWidth='3.5'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</marker>
				<filter id={glowId} x='-75%' y='-75%' width='250%' height='250%'>
					<feGaussianBlur stdDeviation='5' result='blur' />
					<feMerge>
						<feMergeNode in='blur' />
						<feMergeNode in='SourceGraphic' />
					</feMerge>
				</filter>
			</defs>

			{/* Hidden reference path — flow dots travel along this exact geometry */}
			<path id={pathId} d={edgePath} fill='none' stroke='none' />

			{/* Soft glowing halo behind the line for depth */}
			<path
				d={edgePath}
				fill='none'
				stroke={stroke}
				strokeWidth={strokeWidth + 10}
				strokeLinecap='round'
				opacity={isEmphasized ? 0.22 : 0.12}
				className='pointer-events-none blur-[4px] transition-opacity duration-150'
			/>

			{/* Solid colored base line — thickens and glows when selected or actively running */}
			<BaseEdge
				path={edgePath}
				markerEnd={`url(#${arrowId})`}
				style={{
					...style,
					stroke,
					strokeWidth,
					strokeLinecap: 'round',
					filter: isEmphasized ? `url(#${glowId})` : undefined,
					transition: 'stroke-width 150ms ease, filter 150ms ease',
				}}
				interactionWidth={24}
			/>

			{/* Big flowing data pulses travelling along the connection */}
			{dotDelays.map((delay) => (
				<g key={delay} className='pointer-events-none'>
					<circle r={isEmphasized ? 11 : 9} fill={stroke} opacity={0.3} className='blur-[3px]'>
						<animateMotion dur='1.8s' repeatCount='indefinite' begin={`-${delay}s`} rotate='auto'>
							<mpath href={`#${pathId}`} />
						</animateMotion>
					</circle>
					<circle r={isEmphasized ? 6 : 5} fill={stroke} opacity={0.9}>
						<animateMotion dur='1.8s' repeatCount='indefinite' begin={`-${delay}s`} rotate='auto'>
							<mpath href={`#${pathId}`} />
						</animateMotion>
					</circle>
					<circle r={isEmphasized ? 3 : 2.5} fill='white'>
						<animateMotion dur='1.8s' repeatCount='indefinite' begin={`-${delay}s`} rotate='auto'>
							<mpath href={`#${pathId}`} />
						</animateMotion>
					</circle>
				</g>
			))}

			<EdgeLabelRenderer>
				<div
					className={[
						'nodrag nopan absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 transition-opacity duration-150',
						selected ? 'opacity-100' : 'opacity-0 hover:opacity-100',
					].join(' ')}
					style={{
						transform: `translate(${labelX}px, ${labelY}px)`,
						pointerEvents: 'all',
					}}>
					<span
						title={
							data?.issue ? String(data.issue) : String(data?.label ?? 'Connection')
						}
						className={[
							'rounded-full border bg-white px-2 py-0.5 text-[10px] font-black shadow dark:bg-zinc-900',
							data?.issue
								? 'border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-300'
								: 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-300',
							data?.isActive ? 'ring-2 ring-emerald-400/40' : '',
						].join(' ')}
						style={{
							borderColor: data?.labelColor ? String(data.labelColor) : undefined,
						}}>
						{data?.issue ? '!' : String(data?.label ?? 'flow')}
					</span>
					<button
						type='button'
						onClick={() => dispatch({ type: 'REMOVE_EDGE', id })}
						title='Remove connection'
						className={[
							'h-5 w-5 rounded-full border text-[10px] leading-none shadow transition',
							'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100',
							'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
							selected ? 'ring-2 ring-primary-400/50' : '',
						].join(' ')}>
						x
					</button>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default ClickEdge;
