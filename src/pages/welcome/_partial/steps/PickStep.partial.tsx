import { useState } from 'react';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useTemplateCatalog } from '@/api/modules/templates';
import type { TRecommendedTemplate } from '@/types/dashboard.type';
import StepHeading from '../shared/StepHeading.partial';
import WizardButton from '../shared/WizardButton.partial';
import { useConnectorNames } from '../../_hooks/useConnectorNames.hook';

type TPickable = { id: string; name: string };

type TProps = {
	ws: string;
	description: string;
	recommended: TRecommendedTemplate[];
	/** The template being set up, while it is. */
	busyTemplateId: string | null;
	isBuilding: boolean;
	onPickTemplate: (template: TPickable) => void;
	onBuildFromDescription: () => void;
	onExploreAlone: () => void;
};

const MORE_TEMPLATES = 9;

/**
 * "Pick a starting point": the user's own description, handed to the AI
 * builder, or a proven template. Templates that can show a sample run come
 * first and say so, since the next step runs the pick on example data.
 */
const PickStep = ({
	ws,
	description,
	recommended,
	busyTemplateId,
	isBuilding,
	onPickTemplate,
	onBuildFromDescription,
	onExploreAlone,
}: TProps) => {
	const appName = useConnectorNames();
	const [isBrowsing, setIsBrowsing] = useState(false);
	const [search, setSearch] = useState('');
	const catalog = useTemplateCatalog(isBrowsing ? ws : '', {
		type: ['workflow'],
		search: search.trim() || undefined,
		per_page: MORE_TEMPLATES,
	});
	const isBusy = busyTemplateId !== null || isBuilding;
	// One page is enough here: searching narrows it, and the full library is a click away later.
	const moreTemplates = catalog.data?.pages[0]?.items ?? [];

	return (
		<div className='flex flex-col gap-8'>
			<StepHeading
				title='Pick a starting point'
				description='Each template runs on example data first, so nothing is sent until you say so.'
			/>

			{description.trim() && (
				<div className='flex flex-col gap-4 rounded-2xl bg-zinc-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-700'>
					<div className='min-w-0'>
						<p className='text-primary-400 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase'>
							<Sparkles className='size-3.5' />
							Build from your description
						</p>
						<p className='mt-2 line-clamp-2 text-lg font-extrabold'>{description}</p>
						<p className='mt-1 text-sm text-zinc-400'>
							The AI builder drafts it in the editor, where you can review each step.
						</p>
					</div>
					<WizardButton
						onClick={onBuildFromDescription}
						disabled={isBusy}
						isLoading={isBuilding}
						className='shrink-0'
						icon={!isBuilding ? <ArrowRight className='size-4' /> : undefined}>
						Build it
					</WizardButton>
				</div>
			)}

			{recommended.length > 0 && (
				<section aria-labelledby='recommended-heading' className='flex flex-col gap-3'>
					<h2
						id='recommended-heading'
						className='text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
						{description.trim() ? 'Or start from a proven template' : 'Picked for you'}
					</h2>
					<div className='grid gap-4 md:grid-cols-3'>
						{recommended.map((template) => (
							<button
								key={template.id}
								type='button'
								disabled={isBusy}
								onClick={() => onPickTemplate(template)}
								className='group hover:border-primary-500 focus-visible:ring-primary-500 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900'>
								{template.has_sample && (
									<span className='bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-200 self-start rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide uppercase'>
										Runs on example data
									</span>
								)}
								<span className='text-base font-extrabold'>{template.name}</span>
								{template.description && (
									<span className='line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400'>
										{template.description}
									</span>
								)}
								<span className='mt-auto flex items-center justify-between gap-2 pt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
									<span className='truncate'>
										{template.apps.length > 0
											? template.apps.map(appName).join(' · ')
											: 'No apps needed'}
									</span>
									<span className='text-primary-700 dark:text-primary-300 flex shrink-0 items-center gap-1'>
										{busyTemplateId === template.id
											? 'Setting up…'
											: 'Use this'}
										<ArrowRight className='size-3.5 transition-transform group-hover:translate-x-0.5' />
									</span>
								</span>
							</button>
						))}
					</div>
				</section>
			)}

			{isBrowsing ? (
				<section aria-labelledby='more-heading' className='flex flex-col gap-3'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<h2
							id='more-heading'
							className='text-xs font-black tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
							All workflow templates
						</h2>
						<label className='flex h-10 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 sm:w-72 dark:border-zinc-700 dark:bg-zinc-900'>
							<Search className='size-4 text-zinc-400' aria-hidden='true' />
							<span className='sr-only'>Search templates</span>
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder='Search templates'
								className='w-full border-0 bg-transparent p-0 text-sm font-medium focus:ring-0 focus:outline-none'
							/>
						</label>
					</div>
					{catalog.isLoading ? (
						<p className='py-6 text-center text-sm text-zinc-500'>Loading templates…</p>
					) : moreTemplates.length === 0 ? (
						<p className='py-6 text-center text-sm text-zinc-500'>
							No templates match “{search}”.
						</p>
					) : (
						<ul className='grid gap-3 md:grid-cols-3'>
							{moreTemplates.map((template) => (
								<li key={template.id}>
									<button
										type='button'
										disabled={isBusy}
										onClick={() => onPickTemplate(template)}
										className='hover:border-primary-500 focus-visible:ring-primary-500 flex h-full w-full flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900'>
										<span className='text-sm font-extrabold'>
											{template.name}
										</span>
										{template.category && (
											<span className='text-xs font-semibold text-zinc-500'>
												{template.category}
											</span>
										)}
									</button>
								</li>
							))}
						</ul>
					)}
				</section>
			) : null}

			<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800'>
				<WizardButton variant='ghost' onClick={onExploreAlone} disabled={isBusy}>
					I'll explore on my own
				</WizardButton>
				{!isBrowsing && (
					<WizardButton variant='dark' onClick={() => setIsBrowsing(true)}>
						See all templates
					</WizardButton>
				)}
			</div>
		</div>
	);
};

export default PickStep;
