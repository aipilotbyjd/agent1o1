import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Check, Loader2, Plug, Search } from 'lucide-react';
import { useKnowledgeSourceOptions } from '@/api/modules/knowledge-base';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';
import type { TKnowledgeSourceApp, TKnowledgeSourceType } from '@/types/knowledge-base.type';
import { KNOWLEDGE_KINDS } from '../_helper/knowledge.sources';

const inputClass =
	'block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100';
const labelClass = 'mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300';

const SEARCH_DELAY_MS = 300;

interface IKnowledgeSourceSettingsProps {
	ws: string;
	type: TKnowledgeSourceType;
	/** The app's accounts; `undefined` while loading. Not shown when editing. */
	app?: TKnowledgeSourceApp;
	credentialId: string | undefined;
	onCredentialChange?: (credentialId: string) => void;
	config: Record<string, string>;
	onConfigChange: (config: Record<string, string>) => void;
	/** Called with a picked item's name — the Add panel uses it as the default name. */
	onPicked?: (label: string) => void;
}

/**
 * What a synced source reads: for an app, the account and a folder, label,
 * repo or channel picked from it (with a typed search as the alternative);
 * for a web page, its URL. Shared by the Add and Edit panels.
 */
const KnowledgeSourceSettingsPartial = ({
	ws,
	type,
	app,
	credentialId,
	onCredentialChange,
	config,
	onConfigChange,
	onPicked,
}: IKnowledgeSourceSettingsProps) => {
	const { resolvePath } = useResolvePath();
	const definition = KNOWLEDGE_KINDS[type];
	const picker = definition.picker;

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => setSearch(''), [type]);

	const options = useKnowledgeSourceOptions(
		ws,
		picker ? type : null,
		credentialId,
		picker?.remoteSearch ? debouncedSearch : '',
	);

	const visibleOptions = (options.data ?? []).filter(
		(option) =>
			picker?.remoteSearch ||
			!search.trim() ||
			option.label.toLowerCase().includes(search.trim().toLowerCase()),
	);

	const setField = (key: string, value: string) => onConfigChange({ ...config, [key]: value });

	const pick = (value: string, label: string) => {
		if (!picker) return;
		const name = label.replace(/^#/, '');
		onConfigChange({
			...config,
			[picker.key]: value,
			...(picker.labelKey ? { [picker.labelKey]: name } : {}),
		});
		if (value) onPicked?.(name);
	};

	if (app && app.accounts.length === 0) {
		return (
			<div className='flex flex-col items-start gap-2 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700'>
				<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
					{app.expired
						? `Your ${definition.label} connection has expired`
						: `${definition.label} isn't connected`}
				</p>
				<p className='text-[11px] font-semibold text-zinc-500'>
					{app.expired
						? `Reconnect ${definition.label} in Apps, then come back to pick what to keep in sync.`
						: `Connect your ${definition.label} account, then come back to pick what to keep in sync.`}
				</p>
				<Link
					to={resolvePath(pages.workspace.subPages!.apps.to)}
					className='bg-primary-400 text-primary-950 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black'>
					<Plug size={13} />
					{app.expired ? 'Reconnect' : 'Connect'} {definition.label}
				</Link>
			</div>
		);
	}

	const selected = picker ? (config[picker.key] ?? '') : '';

	return (
		<div className='space-y-4'>
			{app && app.accounts.length > 1 && onCredentialChange && (
				<div>
					<label className={labelClass}>Account</label>
					<select
						value={credentialId}
						onChange={(e) => onCredentialChange(e.target.value)}
						className={inputClass}>
						{app.accounts.map((account) => (
							<option key={account.id} value={account.id}>
								{account.name}
								{account.shared ? ' (shared)' : ''}
							</option>
						))}
					</select>
				</div>
			)}

			{picker && (
				<div>
					<label className={labelClass}>{picker.label}</label>
					<div className='overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800'>
						<div className='relative border-b border-zinc-200 dark:border-zinc-800'>
							<Search size={13} className='absolute top-3 left-3 text-zinc-400' />
							<input
								type='search'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={picker.searchPlaceholder}
								aria-label={picker.searchPlaceholder}
								className='h-9 w-full bg-transparent pr-3 pl-8 text-xs font-semibold text-zinc-900 outline-none dark:text-zinc-100'
							/>
						</div>
						<ul
							className='max-h-52 overflow-y-auto py-1'
							role='listbox'
							aria-label={picker.label}>
							{picker.emptyLabel && (
								<OptionRow
									label={picker.emptyLabel}
									active={selected === ''}
									onSelect={() => pick('', '')}
								/>
							)}
							{options.isLoading || (!credentialId && !app) ? (
								<li className='flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-400'>
									<Loader2 size={12} className='animate-spin' /> Loading from{' '}
									{definition.label}…
								</li>
							) : options.isError ? (
								<li className='px-3 py-2 text-[11px] font-semibold text-rose-500'>
									Couldn&apos;t load from {definition.label}. Try reconnecting it
									in Apps.
								</li>
							) : visibleOptions.length === 0 ? (
								<li className='px-3 py-2 text-[11px] font-semibold text-zinc-400'>
									Nothing found.
								</li>
							) : (
								visibleOptions.map((option) => (
									<OptionRow
										key={option.value}
										label={option.label}
										hint={option.hint}
										active={selected === option.value}
										onSelect={() => pick(option.value, option.label)}
									/>
								))
							)}
						</ul>
					</div>
				</div>
			)}

			{definition.fields.length > 0 && (
				<div className='space-y-3'>
					{picker && definition.fieldsTitle && (
						<p className='text-[11px] font-bold tracking-wide text-zinc-400 uppercase'>
							{definition.fieldsTitle}
						</p>
					)}
					{definition.fields.map((field) => (
						<div key={field.key}>
							{!picker && <label className={labelClass}>{field.label}</label>}
							<input
								type='text'
								value={config[field.key] ?? ''}
								onChange={(e) => setField(field.key, e.target.value)}
								placeholder={field.placeholder}
								aria-label={field.label}
								className={inputClass}
							/>
							{field.hint && (
								<p className='mt-1 text-[10px] font-semibold text-zinc-400'>
									{field.hint}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const OptionRow = ({
	label,
	hint,
	active,
	onSelect,
}: {
	label: string;
	hint?: string | null;
	active: boolean;
	onSelect: () => void;
}) => (
	<li role='option' aria-selected={active}>
		<button
			type='button'
			onClick={onSelect}
			className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
				active ? 'bg-primary-400/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
			}`}>
			<span className='min-w-0 flex-1'>
				<span className='block truncate font-bold text-zinc-800 dark:text-zinc-200'>
					{label}
				</span>
				{hint && (
					<span className='block truncate text-[10px] font-semibold text-zinc-400'>
						{hint}
					</span>
				)}
			</span>
			{active && <Check size={13} className='text-primary-500 shrink-0' />}
		</button>
	</li>
);

export default KnowledgeSourceSettingsPartial;
