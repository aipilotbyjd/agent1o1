import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, GripVertical, Link2, Search, X } from 'lucide-react';
import { PORT_TYPE_COLOR } from '../../../_helper/builder.constants';
import { buildOutputToken, setTokenDragData } from '../../../_helper/tokenDrag.helper';
import type { TNodePort } from '../../../_types/node.type';

/** One value flowing into this node — an upstream node's output port. */
export type TIncomingInput = {
	/** Unique key (`sourceId:portId`). */
	id: string;
	/** Id of the upstream node the value comes from. */
	sourceId: string;
	/** The upstream node's output port that feeds this node. */
	port: TNodePort;
	/** Label of the upstream node the value comes from. */
	sourceLabel: string;
	/** Accent color identifying the upstream node, so its inputs read apart from other sources. */
	sourceColor: string;
};

type Props = {
	/** Id of the node these ports belong to — the source of dragged output tokens. */
	nodeId: string;
	/** This node's own accent color — tints its Outputs section. */
	nodeColor: string;
	/** Outputs from other nodes wired into this node's inputs. */
	incoming: TIncomingInput[];
	outputs: TNodePort[];
};

/** Show the filter box once a list crosses this many items. */
const FILTER_THRESHOLD = 6;

const portLabel = (port: TNodePort) =>
	port.name.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const portColor = (port: TNodePort) => PORT_TYPE_COLOR[port.type] ?? PORT_TYPE_COLOR.any;

/** Group incoming inputs by their upstream node, preserving first-seen order. */
const groupBySource = (incoming: TIncomingInput[]) => {
	const groups: {
		sourceId: string;
		sourceLabel: string;
		sourceColor: string;
		items: TIncomingInput[];
	}[] = [];
	for (const item of incoming) {
		let group = groups.find((entry) => entry.sourceId === item.sourceId);
		if (!group) {
			group = {
				sourceId: item.sourceId,
				sourceLabel: item.sourceLabel,
				sourceColor: item.sourceColor,
				items: [],
			};
			groups.push(group);
		}
		group.items.push(item);
	}
	return groups;
};

/** Small colour-coded dot marking a port's data type. */
const PortTypeDot = ({ color }: { color: string }) => (
	<span className='relative flex size-2.5 shrink-0'>
		<span
			className='absolute inset-0 rounded-full opacity-40 blur-[3px]'
			style={{ backgroundColor: color }}
		/>
		<span
			className='relative size-2.5 rounded-full ring-2 ring-inset'
			style={{ backgroundColor: color, ['--tw-ring-color' as string]: `${color}55` }}
		/>
	</span>
);

/** Pill badge showing a port's data type in its own colour. */
const TypeBadge = ({ port }: { port: TNodePort }) => {
	const color = portColor(port);
	return (
		<span
			className='shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase'
			style={{ color, backgroundColor: `${color}1f` }}>
			{port.type}
		</span>
	);
};

/** Compact search field used to filter long input/output lists. */
const FilterBox = ({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (next: string) => void;
	placeholder: string;
}) => (
	<div className='relative flex items-center'>
		<Search size={12} className='absolute left-2.5 text-zinc-400 dark:text-zinc-500' />
		<input
			value={value}
			onChange={(event) => onChange(event.target.value)}
			onPointerDown={(event) => event.stopPropagation()}
			placeholder={placeholder}
			className='nodrag w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-7 pl-8 text-[11px] font-medium text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200 dark:focus:bg-zinc-900'
		/>
		{value && (
			<button
				type='button'
				onClick={() => onChange('')}
				className='absolute right-2 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200'>
				<X size={12} />
			</button>
		)}
	</div>
);

/** Rounded count badge next to a section title. */
const CountBadge = ({ count, tone }: { count: number; tone: 'in' | 'out' | 'muted' }) => {
	const classes =
		tone === 'in'
			? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
			: tone === 'out'
				? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
				: 'bg-zinc-200/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
	return (
		<span
			className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${classes}`}>
			{count}
		</span>
	);
};

/**
 * Full-height side panel mirroring Gumloop, showing Inputs and Outputs together.
 * Inputs are grouped by their source node (each collapsible); outputs are
 * draggable tokens tinted by port type. Each section filters and scrolls
 * independently so a long list never floods the canvas.
 */
const NodeIOPanel = ({ nodeId, nodeColor, incoming, outputs }: Props) => {
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
	const [inputQuery, setInputQuery] = useState('');
	const [outputQuery, setOutputQuery] = useState('');

	const toggleGroup = (sourceId: string) =>
		setCollapsed((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }));

	const filteredIncoming = useMemo(() => {
		const query = inputQuery.trim().toLowerCase();
		if (!query) return incoming;
		return incoming.filter(
			({ port, sourceLabel }) =>
				port.name.toLowerCase().includes(query) ||
				sourceLabel.toLowerCase().includes(query) ||
				port.type.toLowerCase().includes(query),
		);
	}, [incoming, inputQuery]);

	const filteredOutputs = useMemo(() => {
		const query = outputQuery.trim().toLowerCase();
		if (!query) return outputs;
		return outputs.filter(
			(port) =>
				port.name.toLowerCase().includes(query) || port.type.toLowerCase().includes(query),
		);
	}, [outputs, outputQuery]);

	const groups = useMemo(() => groupBySource(filteredIncoming), [filteredIncoming]);

	return (
		<div className='pointer-events-none absolute top-0 left-[348px] z-10 flex w-[380px] flex-col'>
			{/* Transparent hover bridge so moving from node → panel keeps the reveal open */}
			<span className='pointer-events-auto absolute top-0 -left-6 h-full w-6' />
			{/* Connector nub linking the panel back to the node */}
			<span className='pointer-events-none absolute top-7 -left-[26px] h-px w-[26px] bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700' />

			<div className='pointer-events-auto flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/50'>
				{/* ── INPUTS ─────────────────────────────── */}
				<section className='flex flex-col gap-2.5 p-3.5'>
					<div className='flex items-center gap-2'>
						<span className='flex size-6 items-center justify-center rounded-lg bg-sky-500/12 text-sky-500'>
							<ArrowDownToLine size={13} />
						</span>
						<span className='text-[12px] font-bold text-zinc-800 dark:text-zinc-100'>Inputs</span>
						<CountBadge count={incoming.length} tone='in' />
					</div>

					{incoming.length === 0 ? (
						<EmptyState
							icon={<Link2 size={16} />}
							title='No inputs connected'
							hint='Wire another node’s output into this node to feed it data.'
						/>
					) : (
						<>
							{incoming.length > FILTER_THRESHOLD && (
								<FilterBox value={inputQuery} onChange={setInputQuery} placeholder='Filter inputs…' />
							)}
							{groups.length === 0 ? (
								<NoMatch query={inputQuery} />
							) : (
								<div className='nowheel flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1'>
									{groups.map((group) => {
										const isCollapsed = collapsed[group.sourceId];
										return (
											<div key={group.sourceId} className='flex flex-col gap-1.5'>
												<button
													type='button'
													onClick={() => toggleGroup(group.sourceId)}
													className='sticky top-0 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 py-1 pr-1 pl-0.5 text-left backdrop-blur-sm transition hover:bg-zinc-50 dark:bg-zinc-950/95 dark:hover:bg-zinc-900'>
													<ChevronRight
														size={13}
														className={`shrink-0 text-zinc-400 transition-transform dark:text-zinc-500 ${
															isCollapsed ? '' : 'rotate-90'
														}`}
													/>
													<span
														className='h-2 w-2 shrink-0 rounded-full'
														style={{ backgroundColor: group.sourceColor }}
													/>
													<span className='truncate text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
														{group.sourceLabel}
													</span>
													<CountBadge count={group.items.length} tone='muted' />
													<span className='h-px flex-1 bg-zinc-100 dark:bg-zinc-800' />
												</button>

												{!isCollapsed && (
													<div className='grid grid-cols-2 gap-1.5'>
														{group.items.map(({ id, port }) => (
															<PortRow
																key={id}
																port={port}
																sourceId={group.sourceId}
																color={group.sourceColor}
																title={`Drag "${portLabel(port)}" from "${group.sourceLabel}" into a field — ${port.name}: ${port.type}`}
															/>
														))}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</>
					)}
				</section>

				{/* Divider between the two halves */}
				<div className='h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800' />

				{/* ── OUTPUTS ────────────────────────────── */}
				<section className='relative flex flex-col gap-2.5 p-3.5'>
					<span className='pointer-events-none absolute -top-10 -right-8 size-24 rounded-full bg-primary-500/10 blur-2xl' />
					<div className='flex items-center gap-2'>
						<span className='flex size-6 items-center justify-center rounded-lg bg-primary-500/12 text-primary-500'>
							<ArrowUpFromLine size={13} />
						</span>
						<span className='text-[12px] font-bold text-zinc-800 dark:text-zinc-100'>Outputs</span>
						<CountBadge count={outputs.length} tone='out' />
						<span className='ml-auto text-[9px] font-medium text-zinc-400 dark:text-zinc-500'>
							produced values
						</span>
					</div>

					{outputs.length === 0 ? (
						<EmptyState
							icon={<Link2 size={16} />}
							title='No outputs'
							hint='This node doesn’t produce any values.'
						/>
					) : (
						<>
							{outputs.length > FILTER_THRESHOLD && (
								<FilterBox
									value={outputQuery}
									onChange={setOutputQuery}
									placeholder='Filter outputs…'
								/>
							)}
							{filteredOutputs.length === 0 ? (
								<NoMatch query={outputQuery} />
							) : (
								<div className='nowheel grid max-h-[300px] grid-cols-2 gap-1.5 overflow-y-auto pr-1'>
									{filteredOutputs.map((port) => (
										<div
											key={port.id}
											title={`${port.name}: ${port.type}`}
											className='relative flex items-center gap-2 overflow-hidden rounded-xl border py-2 pr-2.5 pl-3 transition'
											style={{ borderColor: `${nodeColor}40`, backgroundColor: `${nodeColor}12` }}>
											<span
												className='absolute inset-y-0 left-0 w-1'
												style={{ backgroundColor: nodeColor }}
											/>
											<PortTypeDot color={nodeColor} />
											<span className='flex-1 truncate text-[11px] font-semibold text-zinc-700 dark:text-zinc-100'>
												{portLabel(port)}
											</span>
											<TypeBadge port={port} />
										</div>
									))}
								</div>
							)}
						</>
					)}
				</section>
			</div>
		</div>
	);
};

/** A draggable input row — drags the upstream value as a token into a field. */
const PortRow = ({
	port,
	sourceId,
	color,
	title,
}: {
	port: TNodePort;
	sourceId: string;
	color: string;
	title: string;
}) => {
	return (
		<div
			draggable
			onDragStart={(event) =>
				setTokenDragData(event.dataTransfer, buildOutputToken(sourceId, port.name))
			}
			title={title}
			className='nodrag group/in relative flex cursor-grab items-center gap-1.5 overflow-hidden rounded-xl border bg-zinc-50/60 py-2 pr-2.5 pl-3 transition-all duration-150 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:cursor-grabbing dark:bg-zinc-900/40'
			style={{ borderColor: `${color}33` }}>
			<span className='absolute inset-y-0 left-0 w-1' style={{ backgroundColor: color }} />
			<GripVertical
				size={12}
				className='shrink-0 text-zinc-400 opacity-40 transition group-hover/in:opacity-100 dark:text-zinc-500'
			/>
			<PortTypeDot color={color} />
			<span className='flex-1 truncate text-[11px] font-semibold text-zinc-700 dark:text-zinc-200'>
				{portLabel(port)}
			</span>
			<TypeBadge port={port} />
		</div>
	);
};

/** Centered empty state for a section with nothing to show. */
const EmptyState = ({
	icon,
	title,
	hint,
}: {
	icon: React.ReactNode;
	title: string;
	hint: string;
}) => (
	<div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-4 text-center dark:border-zinc-800'>
		<span className='flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800/70 dark:text-zinc-500'>
			{icon}
		</span>
		<span className='text-[11px] font-bold text-zinc-700 dark:text-zinc-300'>{title}</span>
		<p className='max-w-[200px] text-[10px] leading-normal font-medium text-zinc-400 dark:text-zinc-500'>
			{hint}
		</p>
	</div>
);

/** Shown when a filter query matches nothing. */
const NoMatch = ({ query }: { query: string }) => (
	<p className='px-0.5 py-2 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500'>
		Nothing matches “{query}”.
	</p>
);

export default NodeIOPanel;
