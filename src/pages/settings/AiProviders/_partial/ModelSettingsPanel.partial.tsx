import { useMemo, useState } from 'react';
import classNames from 'classnames';
import { Check, Layers } from 'lucide-react';
import { useModelCatalog } from '@/api/modules/catalog';
import { useUpdateWorkspaceModelSettings, useWorkspaceModelSettings } from '@/api/modules/models';
import ModelPicker from '@/components/ai/model-picker/ModelPicker';
import ModelBadges from '@/components/ai/model-picker/ModelBadges';
import { brandLabel } from '@/components/ai/model-picker/modelPicker.helper';
import ProviderLogo from '@/components/ai/ProviderLogo';
import Spinner from '@/components/ui/Spinner';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';

/**
 * The workspace's default model and allowed-model list. The allow-list is
 * edited as a draft and saved in one go, so an admin can tick through it
 * without a request per checkbox.
 */
const ModelSettingsPanel = ({ ws }: { ws: string }) => {
	const { data: settings, isLoading } = useWorkspaceModelSettings(ws);
	const { data: models = [] } = useModelCatalog(ws);
	const update = useUpdateWorkspaceModelSettings(ws);
	const [draft, setDraft] = useState<string[] | null | undefined>(undefined);

	const allowed = draft === undefined ? (settings?.allowed_model_catalog_ids ?? null) : draft;
	const isDirty = draft !== undefined;
	const canManage = !!settings?.can_manage;

	const groups = useMemo(() => {
		const map = new Map<string, TModelCatalogEntry[]>();
		models.forEach((m) => map.set(m.brand, [...(map.get(m.brand) ?? []), m]));
		return [...map.entries()];
	}, [models]);

	if (isLoading || !settings) {
		return (
			<div className='flex justify-center py-16'>
				<Spinner color='primary' className='size-6' />
			</div>
		);
	}

	const toggle = (id: string) => {
		const current = allowed ?? models.map((m) => m.id);
		setDraft(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
	};

	const setBrand = (items: TModelCatalogEntry[], on: boolean) => {
		const ids = items.map((m) => m.id);
		const current = allowed ?? models.map((m) => m.id);
		setDraft(
			on ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
		);
	};

	const save = () => {
		const defaultId = settings.default_model_catalog_id;
		update.mutate(
			{
				allowed_model_catalog_ids: allowed,
				...(allowed && defaultId && !allowed.includes(defaultId)
					? { default_model_catalog_id: null }
					: {}),
			},
			{ onSuccess: () => setDraft(undefined) },
		);
	};

	return (
		<div className='space-y-6'>
			<section className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
				<h2 className='text-base font-black text-zinc-900 dark:text-zinc-100'>
					Default model
				</h2>
				<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					New agents, skills and workflow AI steps start on this model.
					{!canManage && ' Set by your workspace admins.'}
				</p>
				<ModelPicker
					ws={ws}
					value={settings.default_model_catalog_id}
					onChange={(id) => update.mutate({ default_model_catalog_id: id })}
					emptyOption={{
						label: 'No default',
						description: 'Each place picks its own starting model.',
					}}
					disabled={!canManage || update.isPending}
					className='mt-3 max-w-md'
				/>
			</section>

			<section className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
					<div>
						<h2 className='text-base font-black text-zinc-900 dark:text-zinc-100'>
							Allowed models
						</h2>
						<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Choose which models members can pick. Agents already on a model you turn
							off keep running until someone changes them.
						</p>
					</div>
					<div
						role='radiogroup'
						aria-label='Allowed models'
						className='flex shrink-0 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800'>
						{[
							{ label: 'All models', on: allowed === null },
							{ label: 'Only selected', on: allowed !== null },
						].map((option) => (
							<button
								key={option.label}
								type='button'
								role='radio'
								aria-checked={option.on}
								disabled={!canManage}
								onClick={() =>
									!option.on &&
									setDraft(
										option.label === 'All models'
											? null
											: models.map((m) => m.id),
									)
								}
								className={classNames(
									'rounded-lg px-3 py-1.5 text-xs font-bold transition',
									option.on
										? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
										: 'text-zinc-500',
								)}>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{allowed !== null && (
					<div className='mt-5 space-y-4'>
						{groups.map(([brand, items]) => {
							const onCount = items.filter((m) => allowed.includes(m.id)).length;
							return (
								<div key={brand}>
									<div className='mb-1.5 flex items-center justify-between'>
										<p className='flex items-center gap-2 text-xs font-black text-zinc-700 dark:text-zinc-200'>
											<ProviderLogo
												provider={brand}
												label={brandLabel(brand)}
												size='xs'
											/>
											{brandLabel(brand)}
											<span className='font-semibold text-zinc-400'>
												{onCount}/{items.length}
											</span>
										</p>
										{canManage && (
											<button
												type='button'
												onClick={() =>
													setBrand(items, onCount < items.length)
												}
												className='text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
												{onCount < items.length
													? 'Allow all'
													: 'Allow none'}
											</button>
										)}
									</div>
									<div className='grid gap-2 sm:grid-cols-2'>
										{items.map((model) => {
											const on = allowed.includes(model.id);
											return (
												<button
													key={model.id}
													type='button'
													role='checkbox'
													aria-checked={on}
													disabled={!canManage}
													onClick={() => toggle(model.id)}
													className={classNames(
														'flex items-start gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-default',
														on
															? 'border-primary-400 bg-primary-50/50 dark:border-primary-500/60 dark:bg-primary-950/20'
															: 'border-zinc-200 dark:border-zinc-700',
													)}>
													<span
														className={classNames(
															'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
															on
																? 'border-primary-500 bg-primary-400 text-primary-950'
																: 'border-zinc-300 dark:border-zinc-600',
														)}>
														{on && (
															<Check
																size={11}
																className='stroke-[3]'
															/>
														)}
													</span>
													<span className='min-w-0'>
														<span className='block text-sm font-bold text-zinc-900 dark:text-zinc-100'>
															{model.display_name}
														</span>
														<ModelBadges
															model={model}
															className='mt-1'
														/>
													</span>
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{canManage && isDirty && (
					<div className='mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
						<p className='flex items-center gap-1.5 text-xs font-medium text-zinc-500'>
							<Layers size={13} />
							{allowed === null
								? 'Every model will be allowed.'
								: `${allowed.length} of ${models.length} models allowed.`}
						</p>
						<div className='flex gap-2'>
							<button
								type='button'
								onClick={() => setDraft(undefined)}
								className={secondaryBtn}>
								Discard
							</button>
							<button
								type='button'
								onClick={save}
								disabled={
									update.isPending || (allowed !== null && allowed.length === 0)
								}
								className={primaryBtn}>
								Save
							</button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
};

export default ModelSettingsPanel;
