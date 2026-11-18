import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Bot,
	Check,
	FileText,
	Layers,
	Loader2,
	Search,
	Sparkles,
	Workflow as WorkflowIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTemplateCatalog } from '@/api/modules/templates';
import { useOnboardingStore } from '../../_hooks/useOnboardingStore.hook';
import { useOnboardingWorkspaceId } from '../../_hooks/useOnboardingWorkspace.hook';
import { isTemplateUsableInOnboarding } from '../../_helper/onboarding.helper';
import type { TTemplateCatalogItem, TTemplateType } from '@/types/template.type';

const TYPE_CHIPS: { value: TTemplateType | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'workflow', label: 'Workflows' },
	{ value: 'agent', label: 'Agents' },
	{ value: 'collection', label: 'Collections' },
	{ value: 'page', label: 'Pages' },
];

const TYPE_STYLE: Record<TTemplateType, { icon: LucideIcon; badge: string }> = {
	workflow: {
		icon: WorkflowIcon,
		badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
	},
	agent: {
		icon: Bot,
		badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
	},
	collection: {
		icon: Layers,
		badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
	},
	page: {
		icon: FileText,
		badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
	},
};

const useDebouncedValue = (value: string, delay: number) => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
};

/**
 * "Start from a template": every template the workspace can see, of every
 * type, in one list that loads more as it scrolls. Picking a card only
 * selects it; Continue creates it (see `useOnboardingSubmit`).
 */
const TemplateStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { templateSearch, templateType, selectedTemplate } = state;
	const workspaceId = useOnboardingWorkspaceId();
	const search = useDebouncedValue(templateSearch.trim(), 300);

	const params = useMemo(
		() => ({
			...(templateType !== 'all' ? { type: [templateType] } : {}),
			...(search ? { search } : {}),
		}),
		[templateType, search],
	);

	const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useTemplateCatalog(workspaceId, params);

	const templates = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
	const total = data?.pages[0]?.meta.total;

	const listRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasNextPage) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
			},
			{ root: listRef.current, rootMargin: '200px' },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const select = (template: TTemplateCatalogItem) => {
		if (!isTemplateUsableInOnboarding(template)) return;
		dispatch({
			type: 'SET_FIELD',
			payload: { selectedTemplate: selectedTemplate?.id === template.id ? null : template },
		});
	};

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					Start from a template
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					Pick a ready-made workflow, agent or collection and we'll set it up in your
					workspace. You can change everything later.
				</p>
			</div>

			<div className='space-y-3'>
				<div className='relative'>
					<Search className='absolute top-3 left-3 h-4 w-4 text-slate-400' />
					<input
						aria-label='Search templates'
						type='search'
						placeholder='Search templates...'
						value={templateSearch}
						onChange={(e) =>
							dispatch({
								type: 'SET_FIELD',
								payload: { templateSearch: e.target.value },
							})
						}
						className='focus:border-primary-500 h-10 w-full rounded-xl border border-slate-200/90 bg-white/50 pr-4 pl-9 text-xs font-semibold transition-all outline-none dark:border-zinc-800 dark:bg-zinc-950/40'
					/>
				</div>

				<div
					className='flex flex-wrap items-center gap-1.5'
					role='tablist'
					aria-label='Template type'>
					{TYPE_CHIPS.map((chip) => {
						const isActive = templateType === chip.value;
						return (
							<button
								key={chip.value}
								type='button'
								role='tab'
								aria-selected={isActive}
								onClick={() =>
									dispatch({
										type: 'SET_FIELD',
										payload: { templateType: chip.value },
									})
								}
								className={`h-7 rounded-full px-3 text-[11px] font-black transition-all ${
									isActive
										? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-950'
										: 'border border-slate-200 bg-white/60 text-slate-500 hover:text-slate-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400'
								}`}>
								{chip.label}
							</button>
						);
					})}
					{total !== undefined && (
						<span className='ml-auto text-[10px] font-bold text-slate-400'>
							{total} template{total === 1 ? '' : 's'}
						</span>
					)}
				</div>
			</div>

			<div
				ref={listRef}
				className='no-scrollbar max-h-[260px] space-y-2 overflow-y-auto pr-1'
				aria-busy={isLoading || isFetchingNextPage}>
				{isLoading &&
					Array.from({ length: 4 }, (_, i) => (
						<div
							key={i}
							className='h-[62px] animate-pulse rounded-xl border border-slate-100 bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-800/40'
						/>
					))}

				{isError && (
					<div className='flex flex-col items-center gap-2 py-8 text-xs font-bold text-slate-400'>
						Couldn't load templates.
						<button
							type='button'
							onClick={() => void refetch()}
							className='text-primary-600 hover:underline'>
							Try again
						</button>
					</div>
				)}

				{!isLoading && !isError && templates.length === 0 && (
					<div className='py-8 text-center text-xs font-bold text-slate-400'>
						{search ? `No templates match "${search}".` : 'No templates here yet.'}
					</div>
				)}

				{templates.map((template) => {
					const { icon: TypeIcon, badge } = TYPE_STYLE[template.type];
					const isSelected = selectedTemplate?.id === template.id;
					const isUsable = isTemplateUsableInOnboarding(template);
					return (
						<button
							key={`${template.type}-${template.id}`}
							type='button'
							disabled={!isUsable}
							aria-pressed={isSelected}
							onClick={() => select(template)}
							title={
								isUsable ? undefined : 'Add page templates from a workflow page.'
							}
							className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
								isSelected
									? 'border-primary-500 bg-primary-50/70 ring-primary-200 dark:bg-primary-950/20 dark:ring-primary-500/30 ring-2'
									: isUsable
										? 'border-slate-100 bg-white/40 hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:border-zinc-700'
										: 'cursor-not-allowed border-slate-100 bg-white/20 opacity-60 dark:border-zinc-800/80'
							}`}>
							<span
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badge}`}>
								<TypeIcon className='h-4 w-4' />
							</span>
							<span className='min-w-0 flex-1'>
								<span className='flex flex-wrap items-center gap-1.5'>
									<span className='truncate text-xs font-bold text-slate-900 dark:text-zinc-50'>
										{template.name}
									</span>
									<span
										className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase ${badge}`}>
										{template.type_label}
									</span>
									{template.is_featured && (
										<span className='flex items-center gap-0.5 text-[9px] font-black text-amber-600 uppercase dark:text-amber-400'>
											<Sparkles className='h-2.5 w-2.5' />
											Featured
										</span>
									)}
									{template.is_own && (
										<span className='text-[9px] font-black text-slate-400 uppercase'>
											Your team
										</span>
									)}
								</span>
								{template.description && (
									<span className='mt-0.5 line-clamp-2 block text-[10px] text-slate-500 dark:text-zinc-400'>
										{template.description}
									</span>
								)}
								<span className='mt-1 block text-[10px] font-semibold text-slate-400'>
									{[
										template.category,
										template.type === 'collection'
											? `${template.items_count} template${template.items_count === 1 ? '' : 's'}`
											: null,
										isUsable ? null : 'Added from a workflow page',
									]
										.filter(Boolean)
										.join(' · ')}
								</span>
							</span>
							{isSelected && (
								<span className='bg-primary-500 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white'>
									<Check className='h-3 w-3' />
								</span>
							)}
						</button>
					);
				})}

				{hasNextPage && <div ref={sentinelRef} className='h-1' />}

				{isFetchingNextPage && (
					<div className='flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-400'>
						<Loader2 className='h-4 w-4 animate-spin' />
						Loading more...
					</div>
				)}
			</div>
		</>
	);
};

export default TemplateStep;
