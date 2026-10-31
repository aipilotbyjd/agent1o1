import { activateOnKey } from '@/utils/activateOnKey.util';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Flame, Search, TriangleAlert, Workflow, Zap } from 'lucide-react';
import { useWorkflowTemplates } from '@/api/modules/templates';
import type { TWorkflowTemplate } from '@/types/template.type';
import type { TReplaceGraphDto } from '@/types/workflow.type';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { templateGraphToCanvas } from '../../_helper/workflowApiTransform.helper';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import Modal from './Modal.partial';

const ALL_CATEGORIES = 'All';
const UNCATEGORIZED = 'Other';
const DEFAULT_COLOR = '#C4EE3D';

type TSort = 'popular' | 'newest' | 'name';

const SORT_OPTIONS: { value: TSort; label: string }[] = [
	{ value: 'popular', label: 'Most used' },
	{ value: 'newest', label: 'Newest' },
	{ value: 'name', label: 'A to Z' },
];

const categoryOf = (template: TWorkflowTemplate): string => template.category || UNCATEGORIZED;

const colorOf = (template: TWorkflowTemplate): string => template.color || DEFAULT_COLOR;

const graphOf = (template: TWorkflowTemplate): TReplaceGraphDto =>
	template.graph as unknown as TReplaceGraphDto;

const stepLabel = (type: string): string => getNodeDefinition(type)?.label ?? type;

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

const sorters: Record<TSort, (a: TWorkflowTemplate, b: TWorkflowTemplate) => number> = {
	popular: (a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name),
	newest: (a, b) => b.created_at.localeCompare(a.created_at),
	name: (a, b) => a.name.localeCompare(b.name),
};

const TemplateIcon = ({ color, size = 40 }: { color: string; size?: number }) => (
	<div
		className='flex shrink-0 items-center justify-center rounded-xl'
		style={{ width: size, height: size, backgroundColor: `${color}26`, color }}>
		<Workflow size={size * 0.5} />
	</div>
);

const SkeletonCard = () => (
	<div className='animate-pulse rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800'>
		<div className='mb-3 h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
		<div className='mb-2 h-3.5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800' />
		<div className='mb-1.5 h-2.5 w-full rounded bg-zinc-100 dark:bg-zinc-800/60' />
		<div className='h-2.5 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800/60' />
	</div>
);

const TemplateCard = ({
	template,
	selected,
	onSelect,
}: {
	template: TWorkflowTemplate;
	selected: boolean;
	onSelect: () => void;
}) => {
	const steps = graphOf(template).nodes.length;

	return (
		<div
			role='button'
			tabIndex={0}
			aria-pressed={selected}
			onClick={onSelect}
			onKeyDown={activateOnKey(onSelect)}
			className={[
				'group flex cursor-pointer flex-col rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] dark:bg-zinc-900',
				selected
					? 'border-primary-400 ring-primary-400/40 shadow-md ring-2'
					: 'hover:border-primary-300 dark:hover:border-primary-800/60 border-zinc-200 dark:border-zinc-800',
			].join(' ')}>
			<div className='mb-3 flex items-start justify-between gap-3'>
				<TemplateIcon color={colorOf(template)} />
				<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
					{categoryOf(template)}
				</span>
			</div>
			<div className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
				{template.name}
			</div>
			<p className='mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
				{template.description || 'No description'}
			</p>
			<div className='mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400'>
				<span>{plural(steps, 'step')}</span>
				{template.usage_count > 0 && (
					<span className='flex items-center gap-1 font-semibold text-orange-500'>
						<Flame size={11} />
						Used {template.usage_count}×
					</span>
				)}
			</div>
		</div>
	);
};

const TemplateDetail = ({
	template,
	replacesCanvas,
	onUse,
}: {
	template: TWorkflowTemplate;
	replacesCanvas: boolean;
	onUse: () => void;
}) => {
	const { nodes, edges } = graphOf(template);
	const color = colorOf(template);

	return (
		<aside className='flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 lg:sticky lg:top-0 dark:border-zinc-800 dark:bg-zinc-900/60'>
			<div className='flex items-start gap-3'>
				<TemplateIcon color={color} size={48} />
				<div className='min-w-0'>
					<div className='text-base leading-tight font-bold text-zinc-900 dark:text-zinc-100'>
						{template.name}
					</div>
					<div className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
						{categoryOf(template)}
					</div>
				</div>
			</div>

			{template.description && (
				<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-300'>
					{template.description}
				</p>
			)}

			<div className='grid grid-cols-3 gap-2 text-center'>
				{[
					{ label: 'Steps', value: nodes.length },
					{ label: 'Links', value: edges.length },
					{ label: 'Used', value: template.usage_count },
				].map((stat) => (
					<div
						key={stat.label}
						className='rounded-xl border border-zinc-200 bg-white py-2 dark:border-zinc-800 dark:bg-zinc-900'>
						<div className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
							{stat.value}
						</div>
						<div className='text-[10px] tracking-wide text-zinc-500 uppercase'>
							{stat.label}
						</div>
					</div>
				))}
			</div>

			<div>
				<div className='mb-2 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase'>
					What it does
				</div>
				<ol className='max-h-56 space-y-1.5 overflow-y-auto pr-1'>
					{nodes.map((node, index) => (
						<li
							key={node.key}
							className='flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-200'>
							<span
								className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold'
								style={{ backgroundColor: `${color}30`, color }}>
								{index + 1}
							</span>
							<span className='truncate'>{stepLabel(node.type)}</span>
						</li>
					))}
				</ol>
			</div>

			{replacesCanvas && (
				<div className='flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-snug text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>
					<TriangleAlert size={13} className='mt-px shrink-0' />
					<span>
						This replaces what is on your canvas now. You can undo it right after.
					</span>
				</div>
			)}

			<button
				type='button'
				onClick={onUse}
				className='bg-primary-400 text-primary-950 hover:bg-primary-300 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98]'>
				<Zap size={14} fill='currentColor' />
				Use this template
			</button>
		</aside>
	);
};

const TemplateLibraryDialog = () => {
	const { state, dispatch } = useWorkflowEditor();
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
	const [sort, setSort] = useState<TSort>('popular');
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const isOpen = state.ui.templateLibraryOpen;
	const {
		data: templates = [],
		isLoading,
		isError,
	} = useWorkflowTemplates(isOpen ? (state.workflow.workspaceId ?? '') : '');

	const close = () => {
		dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: false });
		setSearch('');
		setActiveCategory(ALL_CATEGORIES);
		setSelectedId(null);
	};

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: false });
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isOpen, dispatch]);

	const categories = useMemo(() => {
		const counts = new Map<string, number>();
		templates.forEach((template) => {
			counts.set(categoryOf(template), (counts.get(categoryOf(template)) ?? 0) + 1);
		});
		return [
			{ name: ALL_CATEGORIES, count: templates.length },
			...Array.from(counts, ([name, count]) => ({ name, count })),
		];
	}, [templates]);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return templates
			.filter((template) => {
				const matchesCategory =
					activeCategory === ALL_CATEGORIES || categoryOf(template) === activeCategory;
				const matchesSearch =
					!query ||
					template.name.toLowerCase().includes(query) ||
					(template.description ?? '').toLowerCase().includes(query);
				return matchesCategory && matchesSearch;
			})
			.sort(sorters[sort]);
	}, [templates, search, activeCategory, sort]);

	if (!isOpen) return null;

	const selected = templates.find((template) => template.id === selectedId) ?? null;

	const applyTemplate = (template: TWorkflowTemplate) => {
		const { nodes, edges } = templateGraphToCanvas(graphOf(template));
		dispatch({ type: 'APPLY_TEMPLATE', name: template.name, nodes, edges });
		close();
	};

	return (
		<Modal title='Workflow Templates' onClose={close} size='2xl'>
			<div
				className={
					selected ? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]' : 'grid gap-5'
				}>
				<div className='min-w-0 space-y-4'>
					<div className='flex flex-col gap-2 sm:flex-row'>
						{/* Search */}
						<div className='relative flex-1'>
							<Search
								size={14}
								className='absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400'
							/>
							<input
								aria-label='Search templates…'
								type='text'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder='Search templates…'
								className='focus:border-primary-400 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-sm outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
							/>
						</div>
						<select
							aria-label='Sort templates'
							value={sort}
							onChange={(e) => setSort(e.target.value as TSort)}
							className='focus:border-primary-400 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'>
							{SORT_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Category chips */}
					<div className='-mx-5 flex [scrollbar-width:none] scrollbar-none items-center gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
						{categories.map((category) => (
							<button
								key={category.name}
								type='button'
								onClick={() => setActiveCategory(category.name)}
								className={[
									'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition',
									activeCategory === category.name
										? 'bg-primary-400 text-primary-950'
										: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
								].join(' ')}>
								{category.name}
								<span className='text-[10px] opacity-60'>{category.count}</span>
							</button>
						))}
					</div>

					{isLoading && (
						<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
							{Array.from({ length: 6 }, (_, index) => (
								<SkeletonCard key={index} />
							))}
						</div>
					)}

					{isError && (
						<div className='py-10 text-center text-sm text-red-500'>
							Couldn&apos;t load templates. Try again in a moment.
						</div>
					)}

					{!isLoading && !isError && templates.length === 0 && (
						<div className='flex flex-col items-center gap-2 py-12 text-center'>
							<TemplateIcon color={DEFAULT_COLOR} size={48} />
							<div className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
								No templates yet
							</div>
							<p className='max-w-xs text-xs text-zinc-500 dark:text-zinc-400'>
								Save a workflow as a template and it will show up here for you and
								your team.
							</p>
						</div>
					)}

					{!isLoading && templates.length > 0 && filtered.length === 0 && (
						<div className='py-10 text-center text-sm text-zinc-400'>
							No templates match your search
						</div>
					)}

					{filtered.length > 0 && (
						<>
							<div className='text-[11px] text-zinc-500'>
								{plural(filtered.length, 'template')}
							</div>
							{/* Template grid */}
							<div
								className={[
									'grid gap-3 sm:grid-cols-2',
									selected ? '' : 'xl:grid-cols-3',
								].join(' ')}>
								{filtered.map((template) => (
									<TemplateCard
										key={template.id}
										template={template}
										selected={template.id === selectedId}
										onSelect={() => setSelectedId(template.id)}
									/>
								))}
							</div>
						</>
					)}
				</div>

				{selected && (
					<div className='min-w-0'>
						<TemplateDetail
							template={selected}
							replacesCanvas={state.nodes.length > 0}
							onUse={() => applyTemplate(selected)}
						/>
						<button
							type='button'
							onClick={() => setSelectedId(null)}
							className='mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
							<ArrowRight size={11} className='rotate-180' />
							Back to all templates
						</button>
					</div>
				)}
			</div>
		</Modal>
	);
};

export default TemplateLibraryDialog;
