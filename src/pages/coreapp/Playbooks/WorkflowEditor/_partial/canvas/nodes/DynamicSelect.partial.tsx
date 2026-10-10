import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useNodeOptions } from '@/api/modules/nodes';
import { useWorkspaceContext } from '@/context/workspace';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import type { TNodeOption } from '@/types/node.type';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import type { TNodeField } from '../../../_types/node.type';
import ExpressionInput from './ExpressionInput.partial';

type Props = {
	field: TNodeField;
	value: unknown;
	onChange: (value: unknown) => void;
	compact?: boolean;
	nodeId?: string;
	className: string;
};

const SEARCH_DEBOUNCE_MS = 300;

const isTemplate = (value: unknown) => typeof value === 'string' && value.includes('{{');

const isBlank = (value: unknown) =>
	value === undefined ||
	value === null ||
	value === '' ||
	(Array.isArray(value) && value.length === 0);

/** The selected values as strings, whatever shape the config stores them in. */
const toSelection = (value: unknown, multiple: boolean): string[] => {
	if (isBlank(value)) return [];
	if (Array.isArray(value)) return value.map(String);
	if (multiple && typeof value === 'string') {
		return value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [String(value)];
};

const errorText = (error: unknown) => {
	if (!error) return undefined;
	if (!ApiError.is(error)) return 'Could not load options.';
	return Object.values(error.fieldErrors())[0] ?? error.message;
};

/**
 * A node field whose choices come from the connected account or the workspace
 * — spreadsheets, sheet tabs, Slack channels, repos, labels, agents… — loaded
 * from `POST /nodes/options` with whatever the node already has filled in.
 * Fields that allow it keep a manual mode (an id, or a `{{variable}}` from an
 * earlier step) next to the list.
 */
const DynamicSelect = ({ field, value, onChange, compact, nodeId, className }: Props) => {
	const dynamic = field.dynamic!;
	const listboxId = useId();
	const { state } = useWorkflowEditor();
	const { activeWorkspaceId } = useWorkspaceContext();
	const node = state.nodes.find((item) => item.id === nodeId);
	const nodeValues = (node?.data.values ?? {}) as Record<string, unknown>;
	const siblingLabel = (key: string) =>
		node?.data.definition?.fields.find((item) => item.key === key)?.label ??
		key.replace(/_/g, ' ');

	const [open, setOpen] = useState(false);
	const [manual, setManual] = useState(() => isTemplate(value));
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [activeIndex, setActiveIndex] = useState(-1);
	const rootRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(rootRef, () => setOpen(false));

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [search]);

	// A `{{variable}}` set from outside (the assistant, an import) can't be a list choice.
	const [checkedValue, setCheckedValue] = useState(value);
	if (checkedValue !== value) {
		setCheckedValue(value);
		if (isTemplate(value)) setManual(true);
	}

	const missingDependency = dynamic.dependsOn.find((key) => isBlank(nodeValues[key]));
	const templatedDependency = dynamic.dependsOn.find((key) => isTemplate(nodeValues[key]));
	const blockedReason = missingDependency
		? `Choose ${siblingLabel(missingDependency).toLowerCase()} first`
		: templatedDependency
			? `${siblingLabel(templatedDependency)} comes from an earlier step — enter this manually`
			: undefined;

	// Only what the list depends on goes to the server, so typing in another
	// field doesn't change the (structurally hashed) query key and refetch.
	const config = Object.fromEntries(
		['credential_id', ...dynamic.dependsOn, ...dynamic.uses]
			.filter((key) => !isBlank(nodeValues[key]) && !isTemplate(nodeValues[key]))
			.map((key) => [key, nodeValues[key]]),
	);

	const selection = toSelection(value, dynamic.multiple);
	const query = useNodeOptions(
		activeWorkspaceId,
		{
			type: node?.data.defKey ?? '',
			field: field.key,
			config,
			search: open ? debouncedSearch || undefined : undefined,
		},
		// Load when opened, or up front to put a name to a saved value.
		!!node && !blockedReason && (open || (!manual && selection.length > 0)),
	);

	const options = useMemo(
		() => query.data?.pages.flatMap((page) => page.options) ?? [],
		[query.data],
	);
	const labelFor = (selected: string) =>
		options.find((option) => String(option.value) === selected)?.label ?? selected;

	// The highlighted row resets whenever the list changes under it.
	const [highlightSource, setHighlightSource] = useState({ options, open });
	if (highlightSource.options !== options || highlightSource.open !== open) {
		setHighlightSource({ options, open });
		setActiveIndex(-1);
	}

	/** Saves the selection in the config's own shape; empty removes the key. */
	const emit = (values: string[]) => {
		if (values.length === 0) {
			onChange(undefined);
		} else if (dynamic.valueType === 'array') {
			onChange(values);
		} else if (dynamic.multiple) {
			onChange(values.join(','));
		} else if (dynamic.valueType === 'integer' && /^\d+$/.test(values[0])) {
			onChange(Number(values[0]));
		} else {
			onChange(values[0]);
		}
	};

	const close = () => {
		setOpen(false);
		setSearch('');
	};

	const pick = (option: TNodeOption) => {
		const picked = String(option.value);
		if (!dynamic.multiple) {
			emit([picked]);
			close();
			return;
		}
		emit(
			selection.includes(picked)
				? selection.filter((item) => item !== picked)
				: [...selection, picked],
		);
	};

	const pickTyped = () => {
		const typed = search.trim();
		if (!typed || !dynamic.allowCustom) return;
		if (dynamic.multiple) {
			emit(selection.includes(typed) ? selection : [...selection, typed]);
			setSearch('');
		} else {
			emit([typed]);
			close();
		}
	};

	const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				setActiveIndex((index) => Math.min(index + 1, options.length - 1));
				break;
			case 'ArrowUp':
				event.preventDefault();
				setActiveIndex((index) => Math.max(index - 1, 0));
				break;
			case 'Enter':
				event.preventDefault();
				if (activeIndex >= 0 && options[activeIndex]) pick(options[activeIndex]);
				else pickTyped();
				break;
			case 'Escape':
				close();
				break;
		}
	};

	const switchToManual = () => {
		close();
		setManual(true);
	};

	if (manual && dynamic.allowCustom) {
		return (
			<div className='flex flex-col gap-1'>
				{nodeId ? (
					<ExpressionInput
						field={field}
						value={value}
						onChange={onChange}
						compact={compact}
						nodeId={nodeId}
						className={className}
					/>
				) : (
					<input
						value={String(value ?? '')}
						onChange={(event) => onChange(event.target.value)}
						placeholder={field.placeholder}
						aria-label={field.label}
						className={className}
					/>
				)}
				<button
					type='button'
					onClick={() => {
						setManual(false);
						if (isTemplate(value)) emit([]);
					}}
					className='text-primary-600 dark:text-primary-400 self-start text-[10px] font-semibold hover:underline'>
					Choose from list
				</button>
			</div>
		);
	}

	const textSize = compact ? 'text-[11px]' : 'text-sm';
	const summary = selection.length
		? selection.map(labelFor).join(', ')
		: (blockedReason ?? field.placeholder ?? `Select ${field.label.toLowerCase()}…`);
	const error = errorText(query.error);

	return (
		<div ref={rootRef} className='relative flex flex-col gap-1'>
			<div
				className={[
					'nodrag flex w-full items-center gap-1 rounded-lg border bg-white shadow-xs transition dark:bg-zinc-900',
					open
						? 'border-primary-400 ring-primary-400/20 ring-2'
						: 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600',
				].join(' ')}>
				<button
					type='button'
					role='combobox'
					aria-haspopup='listbox'
					aria-expanded={open}
					aria-controls={open ? listboxId : undefined}
					aria-label={field.label}
					disabled={!!blockedReason}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={() => (open ? close() : setOpen(true))}
					className={[
						'flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed',
						compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
					].join(' ')}>
					<span
						className={[
							'flex-1 truncate font-semibold',
							textSize,
							selection.length ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400',
						].join(' ')}>
						{summary}
					</span>
					{query.isFetching && !open && (
						<Loader2 size={12} className='shrink-0 animate-spin text-zinc-400' />
					)}
				</button>
				{selection.length > 0 && (
					<button
						type='button'
						aria-label={`Clear ${field.label}`}
						onPointerDown={(event) => event.stopPropagation()}
						onClick={() => emit([])}
						className='shrink-0 p-0.5 text-zinc-400 hover:text-rose-500'>
						<X size={12} />
					</button>
				)}
				<ChevronDown
					size={13}
					aria-hidden
					className={`mr-2 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</div>

			{blockedReason && dynamic.allowCustom && selection.length === 0 && (
				<button
					type='button'
					onClick={switchToManual}
					className='text-primary-600 dark:text-primary-400 self-start text-[10px] font-semibold hover:underline'>
					Enter manually
				</button>
			)}

			{open && (
				<div
					onPointerDown={(event) => event.stopPropagation()}
					className='nodrag nowheel absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40'>
					<div className='flex items-center gap-1.5 border-b border-zinc-100 px-2.5 py-1.5 dark:border-zinc-800'>
						<Search size={12} aria-hidden className='shrink-0 text-zinc-400' />
						<input
							autoFocus
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							onKeyDown={onSearchKeyDown}
							placeholder='Search…'
							aria-label={`Search ${field.label}`}
							aria-controls={listboxId}
							aria-activedescendant={
								activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
							}
							className='w-full bg-transparent text-[11px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100'
						/>
						{query.isFetching && (
							<Loader2 size={12} className='shrink-0 animate-spin text-zinc-400' />
						)}
					</div>

					<div
						id={listboxId}
						role='listbox'
						aria-label={field.label}
						aria-multiselectable={dynamic.multiple || undefined}
						className='max-h-56 overflow-y-auto p-1'>
						{error ? (
							<div
								role='alert'
								className='flex items-start gap-1.5 px-2 py-2 text-[11px] text-rose-600 dark:text-rose-400'>
								<AlertCircle size={12} className='mt-px shrink-0' />
								<span>{error}</span>
							</div>
						) : query.isLoading ? (
							<div className='px-2 py-2 text-[11px] text-zinc-400'>Loading…</div>
						) : options.length === 0 ? (
							<div className='px-2 py-2 text-[11px] text-zinc-400'>
								{debouncedSearch
									? `No results for “${debouncedSearch}”`
									: 'Nothing to choose from'}
							</div>
						) : null}

						{options.map((option, index) => {
							const selected = selection.includes(String(option.value));
							return (
								<div
									key={String(option.value)}
									id={`${listboxId}-${index}`}
									role='option'
									aria-selected={selected}
									onMouseEnter={() => setActiveIndex(index)}
									onClick={() => pick(option)}
									className={[
										'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition',
										selected
											? 'bg-primary-50 dark:bg-primary-950/30'
											: index === activeIndex
												? 'bg-zinc-100 dark:bg-zinc-800'
												: '',
									].join(' ')}>
									<span className='flex min-w-0 flex-1 flex-col'>
										<span className='truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100'>
											{option.label}
										</span>
										{option.description && (
											<span className='truncate text-[9px] text-zinc-400'>
												{option.description}
											</span>
										)}
									</span>
									{selected && (
										<Check size={13} className='text-primary-600 shrink-0' />
									)}
								</div>
							);
						})}

						{query.hasNextPage && !error && (
							<button
								type='button'
								disabled={query.isFetchingNextPage}
								onClick={() => query.fetchNextPage()}
								className='w-full rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold text-zinc-500 hover:bg-zinc-50 disabled:opacity-60 dark:hover:bg-zinc-800'>
								{query.isFetchingNextPage ? 'Loading…' : 'Load more'}
							</button>
						)}
					</div>

					{dynamic.allowCustom && (
						<div className='flex flex-col border-t border-zinc-100 dark:border-zinc-800'>
							{search.trim() && (
								<button
									type='button'
									onClick={pickTyped}
									className='truncate px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
									Use “{search.trim()}”
								</button>
							)}
							<button
								type='button'
								onClick={switchToManual}
								className='text-primary-600 dark:text-primary-400 px-3 py-1.5 text-left text-[11px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800'>
								Enter an ID or use a variable
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default DynamicSelect;
