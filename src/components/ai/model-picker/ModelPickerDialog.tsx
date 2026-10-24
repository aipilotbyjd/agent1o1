import { useMemo, useState } from 'react';
import classNames from 'classnames';
import { ArrowLeft, CalendarClock, Check, ExternalLink, Info, Search, Star } from 'lucide-react';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import ProviderLogo from '../ProviderLogo';
import ModelBadges from './ModelBadges';
import ModelCompare from './ModelCompare';
import ModelDetails from './ModelDetails';
import {
	MAX_COMPARE,
	brandLabel,
	connectProviderPath,
	filterLabels,
	isRecommended,
	matchesFilter,
	matchesSearch,
	missingRequirements,
	unavailableText,
	type TModelFilter,
	type TModelRequirements,
} from './modelPicker.helper';

export type TEmptyOption = { label: string; description?: string };

interface IModelPickerDialogProps {
	ws: string;
	models: TModelCatalogEntry[];
	selected: TModelCatalogEntry | null;
	emptyOption?: TEmptyOption;
	isEmptySelected: boolean;
	requirements?: TModelRequirements;
	favorites: string[];
	recent: string[];
	onToggleFavorite: (slug: string) => void;
	onSelect: (model: TModelCatalogEntry | null) => void;
	onClose: () => void;
}

const filters: TModelFilter[] = [
	'available',
	'own_key',
	'tools',
	'vision',
	'long_context',
	'fast',
	'low_cost',
];

const ModelPickerDialog = ({
	ws,
	models,
	selected,
	emptyOption,
	isEmptySelected,
	requirements,
	favorites,
	recent,
	onToggleFavorite,
	onSelect,
	onClose,
}: IModelPickerDialogProps) => {
	const [query, setQuery] = useState('');
	const [active, setActive] = useState<TModelFilter[]>([]);
	const [focusedId, setFocusedId] = useState<string | null>(selected?.id ?? null);
	const [mobileDetails, setMobileDetails] = useState(false);
	const [compareIds, setCompareIds] = useState<string[]>([]);
	const [isComparing, setIsComparing] = useState(false);

	const bySlug = useMemo(() => new Map(models.map((m) => [m.slug, m])), [models]);
	const visible = useMemo(
		() =>
			models.filter(
				(m) => matchesSearch(m, query) && active.every((f) => matchesFilter(m, f)),
			),
		[models, query, active],
	);
	const isFiltering = query.trim() !== '' || active.length > 0;

	const sections = useMemo(() => {
		const list: { title: string; brand?: string; models: TModelCatalogEntry[] }[] = [];
		if (!isFiltering) {
			const favs = favorites
				.map((s) => bySlug.get(s))
				.filter((m): m is TModelCatalogEntry => !!m);
			const recents = recent
				.map((s) => bySlug.get(s))
				.filter((m): m is TModelCatalogEntry => !!m && !favorites.includes(m.slug));
			if (favs.length) list.push({ title: 'Favorites', models: favs });
			if (recents.length) list.push({ title: 'Recently used', models: recents });
		}
		const groups = new Map<string, TModelCatalogEntry[]>();
		visible.forEach((m) => groups.set(m.brand, [...(groups.get(m.brand) ?? []), m]));
		[...groups.entries()]
			.sort(
				([, a], [, b]) =>
					Number(b.some((m) => m.is_available)) - Number(a.some((m) => m.is_available)),
			)
			.forEach(([brand, items]) =>
				list.push({ title: brandLabel(brand), brand, models: items }),
			);
		return list;
	}, [visible, favorites, recent, bySlug, isFiltering]);

	const focused = models.find((m) => m.id === focusedId) ?? selected ?? visible[0] ?? null;
	const compareModels = compareIds
		.map((id) => models.find((m) => m.id === id))
		.filter((m): m is TModelCatalogEntry => !!m);

	const toggleFilter = (filter: TModelFilter) =>
		setActive((prev) =>
			prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
		);

	const toggleCompare = (id: string) =>
		setCompareIds((prev) =>
			prev.includes(id)
				? prev.filter((x) => x !== id)
				: prev.length < MAX_COMPARE
					? [...prev, id]
					: prev,
		);

	const choose = (model: TModelCatalogEntry) => {
		if (!model.is_available) {
			setFocusedId(model.id);
			setMobileDetails(true);
			return;
		}
		onSelect(model);
	};

	return (
		<>
			<Modal isOpen setIsOpen={(open) => !open && onClose()} size='xl'>
				<ModalHeader setIsOpen={onClose}>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Choose a model
					</span>
				</ModalHeader>
				<ModalBody className='p-0!'>
					<div className='border-b border-zinc-100 px-5 pb-3 dark:border-zinc-800'>
						<div className='relative'>
							<Search
								size={14}
								className='absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400'
							/>
							<input
								aria-label='Search models'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder='Search by name, provider or strength…'
								className='focus:border-primary-400 h-10 w-full rounded-xl border border-zinc-200 bg-white ps-9 pe-3 text-sm text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
							/>
						</div>
						<div
							className='mt-2.5 flex flex-wrap gap-1.5'
							role='group'
							aria-label='Filters'>
							{filters.map((filter) => (
								<button
									key={filter}
									type='button'
									aria-pressed={active.includes(filter)}
									onClick={() => toggleFilter(filter)}
									className={classNames(
										'rounded-full border px-2.5 py-1 text-[11px] font-bold transition',
										active.includes(filter)
											? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
											: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300',
									)}>
									{filterLabels[filter]}
								</button>
							))}
						</div>
					</div>

					<div className='flex h-[min(60vh,560px)]'>
						<div
							className={classNames(
								'min-w-0 flex-1 overflow-y-auto px-3 py-3 md:max-w-[55%] md:border-e md:border-zinc-100 md:dark:border-zinc-800',
								mobileDetails && 'hidden md:block',
							)}>
							{emptyOption && !isFiltering && (
								<button
									type='button'
									onClick={() => onSelect(null)}
									className={classNames(
										'mb-2 flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition',
										isEmptySelected
											? 'bg-primary-50 dark:bg-primary-950/30'
											: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
									)}>
									<div>
										<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
											{emptyOption.label}
										</p>
										{emptyOption.description && (
											<p className='text-[11px] font-medium text-zinc-400'>
												{emptyOption.description}
											</p>
										)}
									</div>
									{isEmptySelected && (
										<Check size={15} className='text-primary-600 mt-0.5' />
									)}
								</button>
							)}

							{sections.length === 0 && (
								<p className='px-3 py-10 text-center text-sm font-medium text-zinc-400'>
									No models match. Try another search or clear a filter.
								</p>
							)}

							{sections.map((section) => (
								<div key={section.title} className='mb-3'>
									<p className='mb-1 flex items-center gap-1.5 px-3 text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
										{section.title}
									</p>
									{section.models.map((model) => {
										const isSelected = selected?.id === model.id;
										const recommended = isRecommended(model, requirements);
										const missing = missingRequirements(model, requirements);
										const reason = unavailableText(model);
										const inCompare = compareIds.includes(model.id);
										return (
											<div
												key={`${section.title}-${model.id}`}
												onMouseEnter={() => setFocusedId(model.id)}
												className={classNames(
													'group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition',
													isSelected
														? 'bg-primary-50 dark:bg-primary-950/30'
														: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
													focused?.id === model.id &&
														!isSelected &&
														'bg-zinc-50 dark:bg-zinc-800/60',
												)}>
												<button
													type='button'
													onClick={() => choose(model)}
													className={classNames(
														'flex min-w-0 flex-1 items-start gap-2.5 text-left',
														!model.is_available && 'opacity-60',
													)}>
													<ProviderLogo
														provider={model.brand}
														label={brandLabel(model.brand)}
														size='xs'
													/>
													<span className='min-w-0 flex-1'>
														<span className='flex flex-wrap items-center gap-1.5'>
															<span className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
																{model.display_name}
															</span>
															{model.is_default && (
																<span className='rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'>
																	Default
																</span>
															)}
															{recommended && (
																<span className='bg-primary-100 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold'>
																	Recommended
																</span>
															)}
															{model.retires_at && (
																<span className='inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
																	<CalendarClock size={10} />
																	Retiring
																</span>
															)}
															{isSelected && (
																<Check
																	size={14}
																	className='text-primary-600'
																/>
															)}
														</span>
														<ModelBadges
															model={model}
															className='mt-1'
														/>
														{reason ? (
															<span className='mt-1 block text-[11px] font-medium text-zinc-500'>
																{reason}
															</span>
														) : missing.length > 0 ? (
															<span className='mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-400'>
																Can't use {missing.join(' or ')}
															</span>
														) : null}
													</span>
												</button>
												<div className='flex shrink-0 items-center gap-0.5'>
													{model.connect_providers[0] && (
														<a
															href={connectProviderPath(
																ws,
																model.connect_providers[0].key,
															)}
															target='_blank'
															rel='noreferrer'
															className='text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold'>
															Connect
															<ExternalLink size={10} />
														</a>
													)}
													<button
														type='button'
														aria-label={
															favorites.includes(model.slug)
																? `Unstar ${model.display_name}`
																: `Star ${model.display_name}`
														}
														aria-pressed={favorites.includes(
															model.slug,
														)}
														onClick={() => onToggleFavorite(model.slug)}
														className='rounded-lg p-1.5 text-zinc-300 hover:text-amber-500'>
														<Star
															size={14}
															className={
																favorites.includes(model.slug)
																	? 'fill-amber-400 text-amber-400'
																	: ''
															}
														/>
													</button>
													<label
														className='flex cursor-pointer items-center rounded-lg p-1.5'
														title='Compare'>
														<input
															type='checkbox'
															aria-label={`Compare ${model.display_name}`}
															checked={inCompare}
															disabled={
																!inCompare &&
																compareIds.length >= MAX_COMPARE
															}
															onChange={() => toggleCompare(model.id)}
															className='h-3.5 w-3.5 accent-zinc-900'
														/>
													</label>
													<button
														type='button'
														aria-label={`Details for ${model.display_name}`}
														onClick={() => {
															setFocusedId(model.id);
															setMobileDetails(true);
														}}
														className='rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 md:hidden'>
														<Info size={14} />
													</button>
												</div>
											</div>
										);
									})}
								</div>
							))}
						</div>

						<div
							className={classNames(
								'min-w-0 flex-1 flex-col',
								mobileDetails ? 'flex' : 'hidden md:flex',
							)}>
							{mobileDetails && (
								<button
									type='button'
									onClick={() => setMobileDetails(false)}
									className='m-3 mb-0 inline-flex shrink-0 items-center gap-1 self-start text-xs font-bold text-zinc-500 md:hidden'>
									<ArrowLeft size={12} />
									All models
								</button>
							)}
							{focused ? (
								<ModelDetails
									key={focused.id}
									ws={ws}
									model={focused}
									replacement={
										focused.replacement_slug
											? bySlug.get(focused.replacement_slug)
											: undefined
									}
									requirements={requirements}
									onSelect={onSelect}
								/>
							) : (
								<p className='p-6 text-sm text-zinc-400'>
									Hover a model to see its details.
								</p>
							)}
						</div>
					</div>

					{compareIds.length > 0 && (
						<div className='flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800'>
							<p className='text-xs font-bold text-zinc-600 dark:text-zinc-300'>
								{compareIds.length} selected to compare
								{compareIds.length === MAX_COMPARE ? ' (max)' : ''}
							</p>
							<div className='flex gap-2'>
								<button
									type='button'
									onClick={() => setCompareIds([])}
									className='rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-500'>
									Clear
								</button>
								<button
									type='button'
									disabled={compareIds.length < 2}
									onClick={() => setIsComparing(true)}
									className='rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
									Compare
								</button>
							</div>
						</div>
					)}
				</ModalBody>
			</Modal>

			{isComparing && (
				<ModelCompare
					models={compareModels}
					onSelect={(model) => {
						setIsComparing(false);
						onSelect(model);
					}}
					onClose={() => setIsComparing(false)}
				/>
			)}
		</>
	);
};

export default ModelPickerDialog;
