import { useState } from 'react';
import { Braces, Check, ChevronRight, Copy, ListTree, Table2 } from 'lucide-react';
import { notify } from '@/api/core';
import { PORT_TYPE_COLOR } from '../../_helper/builder.constants';
import { buildOutputToken, setTokenDragData } from '../../_helper/tokenDrag.helper';
import { countItems } from '../../_helper/runData.helper';

type TView = 'table' | 'json' | 'schema';

const VIEW_STORAGE_KEY = 'workflow-editor:data-view';
const MAX_TABLE_ROWS = 50;
const MAX_TABLE_COLUMNS = 24;
const MAX_CHILDREN = 100;

const views: { id: TView; label: string; icon: typeof Table2 }[] = [
	{ id: 'table', label: 'Table', icon: Table2 },
	{ id: 'json', label: 'JSON', icon: Braces },
	{ id: 'schema', label: 'Schema', icon: ListTree },
];

const readView = (): TView => {
	try {
		const saved = localStorage.getItem(VIEW_STORAGE_KEY);
		return saved === 'json' || saved === 'schema' ? saved : 'table';
	} catch {
		return 'table';
	}
};

const saveView = (view: TView) => {
	try {
		localStorage.setItem(VIEW_STORAGE_KEY, view);
	} catch {
		// Storage is optional; the view just resets next time.
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

const typeOf = (value: unknown) => {
	if (Array.isArray(value)) return 'list';
	if (value === null || value === undefined) return 'any';
	if (typeof value === 'object') return 'json';
	return typeof value as 'string' | 'number' | 'boolean';
};

const preview = (value: unknown) => {
	if (Array.isArray(value)) return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
	if (isRecord(value)) return `{${Object.keys(value).length} fields}`;
	return String(value);
};

const valueClass = (value: unknown) => {
	if (typeof value === 'string') return 'text-emerald-700 dark:text-emerald-400';
	if (typeof value === 'number') return 'text-amber-700 dark:text-amber-400';
	if (typeof value === 'boolean') return 'text-violet-700 dark:text-violet-400';
	if (value === null) return 'text-zinc-400 italic';
	return 'text-zinc-500 dark:text-zinc-400';
};

const pathKey = (base: string, key: string | number) =>
	typeof key === 'number' ? `${base}[${key}]` : base ? `${base}.${key}` : key;

const Cell = ({ value }: { value: unknown }) => {
	if (value === undefined) return <span className='text-zinc-300 dark:text-zinc-600'>—</span>;
	if (value !== null && typeof value === 'object') {
		const json = JSON.stringify(value);
		return (
			<span title={json} className='font-mono text-zinc-500 dark:text-zinc-400'>
				{json.length > 80 ? `${json.slice(0, 80)}…` : json}
			</span>
		);
	}
	return (
		<span className={typeof value === 'string' ? '' : valueClass(value)}>
			{value === null ? 'null' : String(value)}
		</span>
	);
};

const FieldTable = ({ value }: { value: Record<string, unknown> }) => (
	<div className='overflow-auto rounded-lg border border-zinc-200 dark:border-white/10'>
		<table className='w-full border-collapse text-left text-[11.5px]'>
			<thead className='sticky top-0 bg-zinc-50 dark:bg-zinc-900'>
				<tr>
					<th className='w-[35%] border-b border-zinc-200 px-2.5 py-1.5 font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300'>
						Field
					</th>
					<th className='border-b border-l border-zinc-200 px-2.5 py-1.5 font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300'>
						Value
					</th>
				</tr>
			</thead>
			<tbody>
				{Object.entries(value).map(([key, item]) => (
					<tr
						key={key}
						className='odd:bg-white even:bg-zinc-50/60 hover:bg-zinc-100/70 dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]'>
						<td className='border-t border-zinc-100 px-2.5 py-1.5 align-top font-medium break-all text-zinc-600 dark:border-white/[0.05] dark:text-zinc-300'>
							{key}
						</td>
						<td className='border-t border-l border-zinc-100 px-2.5 py-1.5 align-top break-all text-zinc-700 dark:border-white/[0.05] dark:text-zinc-200'>
							<Cell value={item} />
						</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

const TableView = ({ value }: { value: unknown }) => {
	if (isRecord(value)) return <FieldTable value={value} />;
	const rows = (Array.isArray(value) ? value : [value]).slice(0, MAX_TABLE_ROWS);
	const objectRows = rows.every(isRecord);
	const columns = objectRows
		? [...new Set(rows.flatMap((row) => Object.keys(row as object)))].slice(
				0,
				MAX_TABLE_COLUMNS,
			)
		: ['value'];
	const total = countItems(value);

	return (
		<div>
			<div className='overflow-auto rounded-lg border border-zinc-200 dark:border-white/10'>
				<table className='w-full border-collapse text-left text-[11.5px]'>
					<thead className='sticky top-0 bg-zinc-50 dark:bg-zinc-900'>
						<tr>
							<th className='w-8 border-b border-zinc-200 px-2 py-1.5 text-right font-medium text-zinc-400 dark:border-white/10'>
								#
							</th>
							{columns.map((column) => (
								<th
									key={column}
									className='border-b border-l border-zinc-200 px-2.5 py-1.5 font-semibold whitespace-nowrap text-zinc-600 dark:border-white/10 dark:text-zinc-300'>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, index) => (
							<tr
								key={index}
								className='odd:bg-white even:bg-zinc-50/60 hover:bg-zinc-100/70 dark:odd:bg-transparent dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]'>
								<td className='border-t border-zinc-100 px-2 py-1.5 text-right align-top text-zinc-400 tabular-nums dark:border-white/[0.05]'>
									{index + 1}
								</td>
								{columns.map((column) => (
									<td
										key={column}
										className='max-w-[260px] border-t border-l border-zinc-100 px-2.5 py-1.5 align-top break-words text-zinc-700 dark:border-white/[0.05] dark:text-zinc-200'>
										<Cell
											value={
												objectRows
													? (row as Record<string, unknown>)[column]
													: row
											}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{total > MAX_TABLE_ROWS && (
				<p className='mt-2 text-[11px] text-zinc-400'>
					Showing {MAX_TABLE_ROWS} of {total} items. Switch to JSON to see everything.
				</p>
			)}
		</div>
	);
};

const JsonNode = ({
	name,
	value,
	depth,
	last,
}: {
	name?: string | number;
	value: unknown;
	depth: number;
	last: boolean;
}) => {
	const isContainer = value !== null && typeof value === 'object';
	const [open, setOpen] = useState(depth < 3 && name !== 'headers');
	const label =
		name === undefined ? null : typeof name === 'number' ? null : (
			<>
				<span className='text-sky-700 dark:text-sky-300'>"{name}"</span>
				<span className='text-zinc-400'>: </span>
			</>
		);
	const comma = last ? '' : ',';

	if (!isContainer) {
		return (
			<div className='pl-4'>
				{label}
				<span className={`break-all ${valueClass(value)}`}>
					{JSON.stringify(value) ?? 'undefined'}
				</span>
				<span className='text-zinc-400'>{comma}</span>
			</div>
		);
	}

	const entries: [string | number, unknown][] = Array.isArray(value)
		? value.map((item, index) => [index, item])
		: Object.entries(value);
	const [openBracket, closeBracket] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];

	if (!entries.length) {
		return (
			<div className='pl-4'>
				{label}
				<span className='text-zinc-500'>
					{openBracket}
					{closeBracket}
				</span>
				<span className='text-zinc-400'>{comma}</span>
			</div>
		);
	}

	return (
		<div className='relative'>
			<button
				type='button'
				onClick={() => setOpen((prev) => !prev)}
				aria-expanded={open}
				className='group flex w-full items-start text-left'>
				<ChevronRight
					size={12}
					className={`mt-[3px] mr-1 h-3 w-3 shrink-0 text-zinc-400 transition-transform group-hover:text-zinc-700 dark:group-hover:text-zinc-200 ${open ? 'rotate-90' : ''}`}
				/>
				<span>
					{label}
					<span className='text-zinc-500'>{openBracket}</span>
					{!open && (
						<>
							<span className='mx-1 rounded bg-zinc-100 px-1 text-[10px] text-zinc-500 dark:bg-white/[0.06]'>
								{entries.length} {Array.isArray(value) ? 'items' : 'keys'}
							</span>
							<span className='text-zinc-500'>{closeBracket}</span>
							<span className='text-zinc-400'>{comma}</span>
						</>
					)}
				</span>
			</button>
			{open && (
				<>
					<div className='ml-[5px] border-l border-zinc-200 pl-2 dark:border-white/10'>
						{entries.slice(0, MAX_CHILDREN).map(([key, item], index, list) => (
							<JsonNode
								key={key}
								name={key}
								value={item}
								depth={depth + 1}
								last={index === list.length - 1 && entries.length <= MAX_CHILDREN}
							/>
						))}
						{entries.length > MAX_CHILDREN && (
							<div className='pl-4 text-zinc-400'>
								… {entries.length - MAX_CHILDREN} more
							</div>
						)}
					</div>
					<div className='pl-4'>
						<span className='text-zinc-500'>{closeBracket}</span>
						<span className='text-zinc-400'>{comma}</span>
					</div>
				</>
			)}
		</div>
	);
};

const JsonView = ({ value }: { value: unknown }) => (
	<div className='overflow-auto rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 font-mono text-[11.5px] leading-[1.6] dark:border-white/10 dark:bg-black/20'>
		<div className='-ml-4'>
			<JsonNode value={value} depth={0} last />
		</div>
	</div>
);

const SchemaRow = ({
	name,
	value,
	path,
	depth,
	nodeId,
}: {
	name: string;
	value: unknown;
	path: string;
	depth: number;
	nodeId?: string;
}) => {
	const type = typeOf(value);
	const color = PORT_TYPE_COLOR[type] ?? PORT_TYPE_COLOR.any;
	const sample = Array.isArray(value) ? value[0] : value;
	const children: [string | number, unknown][] = Array.isArray(value)
		? value.length && sample !== null && typeof sample === 'object'
			? [[0, sample]]
			: []
		: isRecord(value)
			? Object.entries(value)
			: [];
	const draggable = Boolean(nodeId) && /^[\w.[\]]+$/.test(path);

	return (
		<li>
			<div className='flex items-center gap-2 py-1' style={{ paddingLeft: depth * 14 }}>
				<span
					draggable={draggable}
					onDragStart={(event) =>
						nodeId &&
						setTokenDragData(event.dataTransfer, buildOutputToken(nodeId, path))
					}
					title={
						draggable
							? `Drag into a field to use ${buildOutputToken(nodeId!, path)}`
							: ''
					}
					className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
					style={{ borderColor: `${color}40`, backgroundColor: `${color}12`, color }}>
					<span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: color }} />
					{name}
				</span>
				{children.length === 0 && (
					<span
						className={`min-w-0 truncate font-mono text-[11px] ${valueClass(sample)}`}>
						{Array.isArray(value)
							? preview(value)
							: value === null
								? 'null'
								: String(sample)}
					</span>
				)}
				{children.length > 0 && (
					<span className='text-[10.5px] text-zinc-400'>{preview(value)}</span>
				)}
			</div>
			{children.length > 0 && (
				<ul>
					{children.slice(0, MAX_CHILDREN).map(([key, item]) => (
						<SchemaRow
							key={key}
							name={typeof key === 'number' ? `[${key}]` : key}
							value={item}
							path={pathKey(path, key)}
							depth={depth + 1}
							nodeId={nodeId}
						/>
					))}
				</ul>
			)}
		</li>
	);
};

const SchemaView = ({ value, nodeId }: { value: unknown; nodeId?: string }) => {
	const root = Array.isArray(value) ? value[0] : value;
	const rootPath = Array.isArray(value) ? '[0]' : '';
	if (!isRecord(root))
		return (
			<div className='rounded-lg border border-zinc-200 p-3 font-mono text-[11.5px] dark:border-white/10'>
				<span className={valueClass(root)}>{JSON.stringify(root)}</span>
			</div>
		);
	return (
		<div className='rounded-lg border border-zinc-200 p-2.5 dark:border-white/10'>
			{nodeId && (
				<p className='mb-2 px-0.5 text-[10.5px] text-zinc-400'>
					Drag a field into any input to reference it.
				</p>
			)}
			<ul>
				{Object.entries(root).map(([key, item]) => (
					<SchemaRow
						key={key}
						name={key}
						value={item}
						path={pathKey(rootPath, key)}
						depth={0}
						nodeId={nodeId}
					/>
				))}
			</ul>
		</div>
	);
};

const CopyJsonButton = ({ value }: { value: unknown }) => {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type='button'
			title='Copy as JSON'
			aria-label='Copy as JSON'
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
					setCopied(true);
					setTimeout(() => setCopied(false), 1400);
				} catch {
					notify.error('Could not copy the data');
				}
			}}
			className='flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'>
			{copied ? <Check size={13} className='text-emerald-500' /> : <Copy size={13} />}
		</button>
	);
};

/** Real step data the way workflow tools show it: as a table, raw JSON, or a field schema. */
const DataInspector = ({
	value,
	nodeId,
	emptyLabel = 'No data was returned.',
	maxHeight = 'max-h-80',
}: {
	value: unknown;
	/** Enables dragging schema fields into inputs as `{{nodes.<id>.<path>}}`. */
	nodeId?: string;
	emptyLabel?: string;
	maxHeight?: string;
}) => {
	const [view, setView] = useState<TView>(readView);
	const isEmpty =
		value === undefined ||
		value === null ||
		(Array.isArray(value) && !value.length) ||
		(isRecord(value) && !Object.keys(value).length);

	if (isEmpty)
		return (
			<div className='rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400 dark:border-white/10'>
				{emptyLabel}
			</div>
		);

	const isPrimitive = typeof value !== 'object';
	const activeView = isPrimitive ? 'json' : view;
	const items = countItems(value);

	return (
		<div>
			<div className='mb-2 flex items-center justify-between gap-2'>
				{isPrimitive ? (
					<span className='text-[11px] text-zinc-400'>Single value</span>
				) : (
					<div
						role='tablist'
						aria-label='Data view'
						className='inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-white/[0.05]'>
						{views.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								type='button'
								role='tab'
								aria-selected={activeView === id}
								onClick={() => {
									setView(id);
									saveView(id);
								}}
								className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${activeView === id ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
								<Icon size={12} />
								{label}
							</button>
						))}
					</div>
				)}
				<div className='flex items-center gap-1'>
					<span className='text-[11px] text-zinc-400 tabular-nums'>
						{items} item{items === 1 ? '' : 's'}
					</span>
					<CopyJsonButton value={value} />
				</div>
			</div>
			<div className={`${maxHeight} overflow-auto`}>
				{activeView === 'table' ? (
					<TableView value={value} />
				) : activeView === 'schema' ? (
					<SchemaView value={value} nodeId={nodeId} />
				) : (
					<JsonView value={value} />
				)}
			</div>
		</div>
	);
};

export default DataInspector;
