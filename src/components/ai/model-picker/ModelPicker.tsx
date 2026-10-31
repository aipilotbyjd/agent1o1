import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import classNames from 'classnames';
import { AlertTriangle, CalendarClock, ChevronDown, ExternalLink, Sparkles } from 'lucide-react';
import { useModelCatalog } from '@/api/modules/catalog';
import { useCurrentUser } from '@/api/modules/user';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import formatDate from '@/utils/formatDate.util';
import ProviderLogo from '../ProviderLogo';
import ModelBadges from './ModelBadges';
import ModelPickerDialog, { type TEmptyOption } from './ModelPickerDialog';
import {
	brandLabel,
	connectProviderPath,
	missingRequirements,
	unavailableText,
	type TModelRequirements,
} from './modelPicker.helper';
import useModelPrefs from './useModelPrefs';

interface IModelPickerProps {
	ws: string;
	/** The selected model's id or slug (see `valueKey`); null for none / the empty option. */
	value: string | null;
	valueKey?: 'id' | 'slug';
	onChange: (value: string | null, model: TModelCatalogEntry | null) => void;
	/** What the agent, skill or step needs, for "Recommended" and mismatch warnings. */
	requirements?: TModelRequirements;
	/** Offer "no specific model", e.g. the workspace default, or "same as the agent". */
	emptyOption?: TEmptyOption;
	label?: string;
	disabled?: boolean;
	compact?: boolean;
	className?: string;
}

/**
 * The one model picker every agent, skill and workflow AI step uses: search,
 * filters, favorites and recent, brand groups, capability and cost badges,
 * "runs on your key", why a model is unavailable (with a link to fix it),
 * details, a live trial and side-by-side compare.
 */
const ModelPicker = ({
	ws,
	value,
	valueKey = 'id',
	onChange,
	requirements,
	emptyOption,
	label = 'Model',
	disabled,
	compact,
	className,
}: IModelPickerProps) => {
	const { data: models = [], isLoading } = useModelCatalog(ws);
	const { data: user } = useCurrentUser();
	const prefs = useModelPrefs(user?.id ?? 'anonymous');
	const [isOpen, setIsOpen] = useState(false);

	const selected = useMemo(
		() => (value ? (models.find((m) => m[valueKey] === value) ?? null) : null),
		[models, value, valueKey],
	);
	const defaultModel = models.find((m) => m.is_default);
	const replacement = selected?.replacement_slug
		? models.find((m) => m.slug === selected.replacement_slug)
		: undefined;
	const missing = selected ? missingRequirements(selected, requirements) : [];
	const reason = selected ? unavailableText(selected) : null;
	const isUnknown = !!value && !isLoading && !selected;

	const pick = (model: TModelCatalogEntry | null) => {
		if (model) prefs.markUsed(model.slug);
		onChange(model ? model[valueKey] : null, model);
		setIsOpen(false);
	};

	const triggerName =
		selected?.display_name ??
		(value
			? isLoading
				? 'Loading…'
				: 'Model no longer available'
			: (emptyOption?.label ?? 'Select a model'));

	return (
		<div className={className}>
			<button
				type='button'
				disabled={disabled}
				onClick={() => setIsOpen(true)}
				aria-haspopup='dialog'
				className={classNames(
					'flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white text-left transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600',
					compact ? 'p-2' : 'p-3',
				)}>
				<div className='flex min-w-0 items-center gap-3'>
					{selected ? (
						<ProviderLogo
							provider={selected.brand}
							label={brandLabel(selected.brand)}
							size={compact ? 'xs' : 'sm'}
						/>
					) : (
						<div
							className={classNames(
								'flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
								compact ? 'h-6 w-6' : 'h-8 w-8',
							)}>
							<Sparkles size={compact ? 12 : 15} />
						</div>
					)}
					<div className='min-w-0'>
						{!compact && (
							<span className='block text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
								{label}
							</span>
						)}
						<span className='block truncate text-xs font-black text-zinc-800 dark:text-zinc-200'>
							{triggerName}
						</span>
						{!value && emptyOption && defaultModel && !compact && (
							<span className='block truncate text-[10px] font-semibold text-zinc-400'>
								Currently {defaultModel.display_name}
							</span>
						)}
						{selected && !compact && <ModelBadges model={selected} className='mt-1' />}
					</div>
				</div>
				<ChevronDown size={14} className='shrink-0 text-zinc-400' />
			</button>

			{(isUnknown || reason || missing.length > 0 || selected?.retires_at) && (
				<div className='mt-1.5 space-y-1'>
					{isUnknown && (
						<Warning>
							This model was removed from the catalog. Pick another one.
						</Warning>
					)}
					{reason && selected && (
						<Warning>
							{reason}.
							{selected.connect_providers[0] && (
								<a
									href={connectProviderPath(
										ws,
										selected.connect_providers[0].key,
									)}
									target='_blank'
									rel='noreferrer'
									className='ms-1 inline-flex items-center gap-0.5 font-bold underline underline-offset-2'>
									Connect {selected.connect_providers[0].label}
									<ExternalLink size={10} />
								</a>
							)}
						</Warning>
					)}
					{missing.length > 0 && (
						<Warning>
							{selected?.display_name} can't use {missing.join(' or ')}
							{missing.includes('tools') && requirements?.tools
								? ` - this agent has ${requirements.tools} tool${requirements.tools === 1 ? '' : 's'}`
								: ''}
							.
						</Warning>
					)}
					{selected?.retires_at && (
						<Warning icon='retire'>
							Being retired on {formatDate(selected.retires_at)}.
							{replacement && (
								<button
									type='button'
									disabled={!replacement.is_available}
									onClick={() => pick(replacement)}
									className='ms-1 font-bold underline underline-offset-2 disabled:no-underline disabled:opacity-60'>
									Switch to {replacement.display_name}
								</button>
							)}
						</Warning>
					)}
				</div>
			)}

			{isOpen && (
				<ModelPickerDialog
					ws={ws}
					models={models}
					selected={selected}
					emptyOption={emptyOption}
					isEmptySelected={!value}
					requirements={requirements}
					favorites={prefs.favorites}
					recent={prefs.recent}
					onToggleFavorite={prefs.toggleFavorite}
					onSelect={pick}
					onClose={() => setIsOpen(false)}
				/>
			)}
		</div>
	);
};

const Warning = ({
	children,
	icon = 'alert',
}: {
	children: ReactNode;
	icon?: 'alert' | 'retire';
}) => (
	<p className='flex items-start gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400'>
		{icon === 'retire' ? (
			<CalendarClock size={12} className='mt-0.5 shrink-0' />
		) : (
			<AlertTriangle size={12} className='mt-0.5 shrink-0' />
		)}
		<span>{children}</span>
	</p>
);

export default ModelPicker;
