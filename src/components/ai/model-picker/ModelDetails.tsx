import { useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarClock, ExternalLink, KeyRound, Loader2, Play, Sparkles } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useTryModel } from '@/api/modules/models';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import type { TModelTrial } from '@/types/model-settings.type';
import formatDate from '@/utils/formatDate.util';
import ProviderLogo from '../ProviderLogo';
import ModelBadges from './ModelBadges';
import {
	brandLabel,
	connectProviderPath,
	formatContext,
	missingRequirements,
	speedLabels,
	unavailableText,
	type TModelRequirements,
} from './modelPicker.helper';

interface IModelDetailsProps {
	ws: string;
	model: TModelCatalogEntry;
	replacement: TModelCatalogEntry | undefined;
	requirements?: TModelRequirements;
	onSelect: (model: TModelCatalogEntry) => void;
}

const Fact = ({ label, value }: { label: string; value: string }) => (
	<div className='rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60'>
		<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase'>{label}</p>
		<p className='mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200'>{value}</p>
	</div>
);

const ModelDetails = ({ ws, model, replacement, requirements, onSelect }: IModelDetailsProps) => {
	const tryModel = useTryModel(ws);
	const [prompt, setPrompt] = useState('');
	const [trial, setTrial] = useState<TModelTrial | null>(null);
	const [trialError, setTrialError] = useState<string | null>(null);

	const missing = missingRequirements(model, requirements);
	const reason = unavailableText(model);

	const runTrial = async (e: FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;
		setTrial(null);
		setTrialError(null);
		try {
			setTrial(await tryModel.mutateAsync({ slug: model.slug, prompt: prompt.trim() }));
		} catch (error) {
			setTrialError(
				ApiError.is(error) ? error.message : 'The model did not answer. Try again.',
			);
		}
	};

	return (
		<div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5'>
			<div className='flex items-start gap-3'>
				<ProviderLogo provider={model.brand} label={brandLabel(model.brand)} size='lg' />
				<div className='min-w-0'>
					<h3 className='text-lg font-black text-zinc-900 dark:text-white'>
						{model.display_name}
					</h3>
					<p className='text-xs font-semibold text-zinc-400'>
						{brandLabel(model.brand)} · {model.slug}
					</p>
				</div>
			</div>

			{model.description && (
				<p className='text-sm font-medium text-zinc-600 dark:text-zinc-300'>
					{model.description}
				</p>
			)}

			<ModelBadges model={model} />

			{model.strengths.length > 0 && (
				<div>
					<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
						Best for
					</p>
					<div className='mt-1.5 flex flex-wrap gap-1.5'>
						{model.strengths.map((strength) => (
							<span
								key={strength}
								className='bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300 rounded-full px-2.5 py-0.5 text-[11px] font-bold'>
								{strength}
							</span>
						))}
					</div>
				</div>
			)}

			<div className='grid grid-cols-2 gap-2'>
				<Fact
					label='Context'
					value={formatContext(model.capabilities?.context_window) ?? '-'}
				/>
				<Fact label='Speed' value={model.speed ? speedLabels[model.speed] : '-'} />
				<Fact
					label='Per message'
					value={
						model.credits_per_message !== null
							? `≈ ${model.credits_per_message} credits`
							: '-'
					}
				/>
				<Fact
					label='Runs on'
					value={
						model.own_key
							? `Your ${model.own_key.label} key`
							: model.is_available
								? 'Our key (credits)'
								: '-'
					}
				/>
			</div>

			{model.own_key && (
				<p className='flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'>
					<KeyRound size={13} className='mt-0.5 shrink-0' />
					Tokens cost 0 credits on your key. Only the processing minimum is charged.
				</p>
			)}

			{model.retires_at && (
				<div className='flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'>
					<CalendarClock size={13} className='mt-0.5 shrink-0' />
					<span>
						Being retired on {formatDate(model.retires_at)}.
						{replacement && (
							<>
								{' '}
								<button
									type='button'
									onClick={() => onSelect(replacement)}
									disabled={!replacement.is_available}
									className='font-bold underline underline-offset-2 disabled:no-underline disabled:opacity-60'>
									Switch to {replacement.display_name}
								</button>
							</>
						)}
					</span>
				</div>
			)}

			{missing.length > 0 && (
				<p className='rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'>
					This model can't use {missing.join(' or ')}, which this needs.
				</p>
			)}

			{reason && (
				<div className='rounded-lg bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300'>
					{reason}.
					{model.connect_providers.map((provider) => (
						<a
							key={provider.key}
							href={connectProviderPath(ws, provider.key)}
							target='_blank'
							rel='noreferrer'
							className='text-primary-700 dark:text-primary-400 ms-2 inline-flex items-center gap-1 font-bold hover:underline'>
							Connect {provider.label}
							<ExternalLink size={11} />
						</a>
					))}
				</div>
			)}

			{model.is_available && (
				<form
					onSubmit={runTrial}
					className='mt-auto rounded-xl border border-zinc-100 p-3 dark:border-zinc-800'>
					<p className='flex items-center gap-1.5 text-xs font-black text-zinc-700 dark:text-zinc-200'>
						<Sparkles size={13} />
						Try this model
					</p>
					<div className='mt-2 flex gap-2'>
						<input
							aria-label='Sample prompt'
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							maxLength={1000}
							placeholder='Ask something you would ask your agent'
							className='focus:border-primary-400 h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-800 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
						/>
						<button
							type='submit'
							disabled={!prompt.trim() || tryModel.isPending}
							className='inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900'>
							{tryModel.isPending ? (
								<Loader2 size={13} className='animate-spin' />
							) : (
								<Play size={13} />
							)}
							Run
						</button>
					</div>
					<p className='mt-1.5 text-[10px] font-medium text-zinc-400'>
						A real call: charged like one message
						{model.credits_per_message !== null
							? ` (≈ ${model.credits_per_message} credits)`
							: ''}
						.
					</p>
					{trialError && (
						<p className='mt-2 text-xs font-medium text-red-600 dark:text-red-400'>
							{trialError}
						</p>
					)}
					{trial && (
						<div className='mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60'>
							<p className='max-h-40 overflow-y-auto text-xs whitespace-pre-wrap text-zinc-800 dark:text-zinc-200'>
								{trial.text}
							</p>
							<p className='mt-2 text-[10px] font-bold text-zinc-400'>
								{(trial.duration_ms / 1000).toFixed(1)}s ·{' '}
								{trial.prompt_tokens + trial.completion_tokens} tokens ·{' '}
								{trial.credits} credits
								{trial.served_by_own_key ? ' · your key' : ''}
							</p>
						</div>
					)}
				</form>
			)}
		</div>
	);
};

export default ModelDetails;
