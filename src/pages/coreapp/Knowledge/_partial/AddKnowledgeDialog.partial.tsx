import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, X } from 'lucide-react';
import {
	useCreateKnowledgeSource,
	useIngestKnowledge,
	useKnowledgeSourceApps,
	useUpdateKnowledgeSource,
} from '@/api/modules/knowledge-base';
import type { TKnowledgeSource, TKnowledgeSourceType } from '@/types/knowledge-base.type';
import {
	ALLOWED_EXTENSIONS,
	KNOWLEDGE_KINDS,
	hasRequiredSettings,
	type TKnowledgeKind,
} from '../_helper/knowledge.sources';
import KnowledgeSourceSettingsPartial from './KnowledgeSourceSettings.partial';

const inputClass =
	'block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100';
const labelClass = 'mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300';
const hintClass = 'mt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500';

interface IAddKnowledgeDialogProps {
	ws: string;
	isOpen: boolean;
	/** Which option is picked when the panel opens. */
	initialKind?: TKnowledgeKind;
	defaultCollection?: string;
	/** Opens the panel on this synced source, to edit it. */
	source?: TKnowledgeSource | null;
	/** Shared knowledge only, e.g. when adding for an agent: agents never see private knowledge. */
	sharedOnly?: boolean;
	/** Called with the collection the new knowledge went into. */
	onAdded?: (added: { collection: string; synced: boolean }) => void;
	onClose: () => void;
}

const STATUS_LABEL: Record<TKnowledgeSource['status'], { text: string; className: string }> = {
	pending: { text: 'Waiting to sync', className: 'text-zinc-500' },
	syncing: { text: 'Syncing…', className: 'text-sky-600 dark:text-sky-400' },
	ready: { text: 'Up to date', className: 'text-emerald-600 dark:text-emerald-400' },
	failed: { text: 'Sync failed', className: 'text-rose-600 dark:text-rose-400' },
};

const cleanConfig = (values: Record<string, string>) =>
	Object.fromEntries(
		Object.entries(values)
			.map(([key, value]) => [key, value.trim()])
			.filter(([, value]) => value),
	);

/**
 * The one way to add to the knowledge base: text or a file once, or a web
 * page or app kept in sync. Name, collection and privacy work the same for
 * every kind. Given a `source` it edits that one instead: only its name and
 * what it reads can change (changing what it reads drops its documents and
 * syncs it again); its kind, collection and privacy are fixed once added.
 */
const AddKnowledgeDialog = ({
	ws,
	isOpen,
	initialKind = 'text',
	defaultCollection,
	source,
	sharedOnly = false,
	onAdded,
	onClose,
}: IAddKnowledgeDialogProps) => {
	const ingest = useIngestKnowledge(ws);
	const createSource = useCreateKnowledgeSource(ws);
	const updateSource = useUpdateKnowledgeSource(ws);
	const editing = source ?? null;

	const [kind, setKind] = useState<TKnowledgeKind>(initialKind);
	const [name, setName] = useState('');
	const [text, setText] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [config, setConfig] = useState<Record<string, string>>({});
	const [collection, setCollection] = useState(defaultCollection ?? '');
	const [isPrivate, setIsPrivate] = useState(false);
	const [credentialId, setCredentialId] = useState<string | undefined>(undefined);
	const [nameTouched, setNameTouched] = useState(false);
	const { data: apps } = useKnowledgeSourceApps(ws, isOpen);

	const app = apps?.find((candidate) => candidate.type === kind);

	// Each app starts on the member's first account, with nothing picked.
	// A source being edited keeps its own account and settings.
	const [syncedPick, setSyncedPick] = useState<{ kind: TKnowledgeKind; app: typeof app } | null>(
		null,
	);
	if (!editing && (syncedPick?.kind !== kind || syncedPick.app !== app)) {
		setSyncedPick({ kind, app });
		setCredentialId(app?.accounts[0]?.id);
		setConfig({});
		// A name filled in from the last pick belongs to that app.
		if (!nameTouched) setName('');
	}

	const openKey = isOpen
		? editing
			? `edit:${editing.id}`
			: `${initialKind}:${defaultCollection ?? ''}`
		: null;
	const [syncedOpenKey, setSyncedOpenKey] = useState<string | null>(null);
	if (syncedOpenKey !== openKey) {
		setSyncedOpenKey(openKey);
		if (isOpen && editing) {
			setKind(editing.type);
			setName(editing.name);
			setConfig(editing.config ?? {});
			setCollection(editing.collection);
			setIsPrivate(editing.private);
			setCredentialId(editing.credential_id ?? undefined);
			setNameTouched(true);
		} else if (isOpen) {
			setKind(initialKind);
			setCollection(defaultCollection ?? '');
		}
	}

	if (!isOpen) return null;

	const definition = KNOWLEDGE_KINDS[kind];
	const isPending = ingest.isPending || createSource.isPending || updateSource.isPending;
	const configChanged =
		!!editing &&
		JSON.stringify(cleanConfig(config)) !== JSON.stringify(cleanConfig(editing.config));

	const canSubmit = editing
		? !!name.trim() &&
			hasRequiredSettings(definition, config) &&
			(name.trim() !== editing.name || configChanged)
		: kind === 'text'
			? !!text.trim()
			: kind === 'file'
				? !!file
				: !!name.trim() &&
					hasRequiredSettings(definition, config) &&
					(kind === 'url' || (!!app && app.accounts.length > 0));

	const handleClose = () => {
		setName('');
		setText('');
		setFile(null);
		setConfig({});
		setIsPrivate(false);
		setNameTouched(false);
		onClose();
	};

	const handleSubmit = () => {
		if (!canSubmit) return;

		if (editing) {
			updateSource.mutate(
				{
					id: editing.id,
					payload: {
						name: name.trim(),
						...(configChanged ? { config: cleanConfig(config) } : {}),
					},
				},
				{ onSuccess: handleClose },
			);

			return;
		}

		// Mirrors the backend's default when no collection is named.
		const addedTo = collection.trim() || (isPrivate ? 'personal' : 'default');
		const handleAdded = () => {
			onAdded?.({ collection: addedTo, synced: definition.synced });
			handleClose();
		};

		if (!definition.synced) {
			ingest.mutate(
				{
					text: kind === 'text' ? text : undefined,
					file: kind === 'file' ? (file ?? undefined) : undefined,
					source: name.trim() || undefined,
					collection: collection.trim() || undefined,
					private: isPrivate,
				},
				{ onSuccess: handleAdded },
			);

			return;
		}

		createSource.mutate(
			{
				type: kind as TKnowledgeSourceType,
				name: name.trim(),
				collection: collection.trim() || undefined,
				private: isPrivate,
				credential_id: kind === 'url' ? undefined : credentialId,
				config: cleanConfig(config),
			},
			{ onSuccess: handleAdded },
		);
	};

	const kindButton = (key: TKnowledgeKind) => {
		const { label, description, icon: Icon } = KNOWLEDGE_KINDS[key];
		const active = kind === key;

		return (
			<button
				key={key}
				type='button'
				onClick={() => setKind(key)}
				disabled={!!editing}
				aria-pressed={active}
				className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
					active
						? 'border-primary-400 bg-primary-400/10'
						: 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60'
				}`}>
				<Icon
					size={15}
					className={`mt-0.5 shrink-0 ${active ? 'text-primary-500' : 'text-zinc-400'}`}
				/>
				<span className='min-w-0'>
					<span className='block text-xs font-bold text-zinc-900 dark:text-white'>
						{label}
					</span>
					<span className='block truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						{description}
					</span>
				</span>
			</button>
		);
	};

	return (
		<AnimatePresence>
			<motion.div
				key='backdrop'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={handleClose}
				className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
			/>
			<motion.div
				key='panel'
				initial={{ x: '100%' }}
				animate={{ x: 0 }}
				exit={{ x: '100%' }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950'>
				<div className='flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800'>
					<div>
						<h2 className='text-lg font-black tracking-tight text-zinc-900 dark:text-white'>
							{editing ? 'Edit source' : 'Add knowledge'}
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							{editing
								? 'Rename it or change what it reads. It keeps syncing on its own.'
								: 'Everything is chunked, embedded and made searchable. Apps are read with your connected account, read-only.'}
						</p>
					</div>
					<button
						aria-label='Close'
						onClick={handleClose}
						className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900'>
						<X size={16} />
					</button>
				</div>

				<div className='flex-1 space-y-5 px-6 py-5'>
					{editing ? (
						<div className='space-y-2'>
							<p className={labelClass}>Source</p>
							<div className='grid grid-cols-2 items-center gap-2'>
								{kindButton(editing.type)}
								<div className='text-[11px] font-semibold'>
									<p className={STATUS_LABEL[editing.status].className}>
										{STATUS_LABEL[editing.status].text}
									</p>
									<p className='text-zinc-400 dark:text-zinc-500'>
										{editing.documents_count} document
										{editing.documents_count === 1 ? '' : 's'}
										{editing.last_synced_at
											? ` · synced ${formatDistanceToNow(new Date(editing.last_synced_at), { addSuffix: true })}`
											: ''}
									</p>
								</div>
							</div>
							{editing.last_error && (
								<p className='flex items-start gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold break-words text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'>
									<AlertTriangle size={12} className='mt-0.5 shrink-0' />
									<span className='line-clamp-3'>{editing.last_error}</span>
								</p>
							)}
						</div>
					) : (
						<div className='space-y-2'>
							<p className={labelClass}>Add once</p>
							<div className='grid grid-cols-2 gap-2'>
								{(['text', 'file'] as const).map(kindButton)}
							</div>
							<p className={`${labelClass} pt-2`}>Keep in sync</p>
							<div className='grid grid-cols-2 gap-2'>
								{(Object.keys(KNOWLEDGE_KINDS) as TKnowledgeKind[])
									.filter((key) => KNOWLEDGE_KINDS[key].synced)
									.map(kindButton)}
							</div>
						</div>
					)}

					<div>
						<label className={labelClass}>{definition.synced ? 'Name' : 'Title'}</label>
						<input
							aria-label={
								kind === 'file' ? 'Defaults to the filename' : 'e.g. Pricing docs'
							}
							type='text'
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setNameTouched(true);
							}}
							placeholder={
								kind === 'file' ? 'Defaults to the filename' : 'e.g. Pricing docs'
							}
							className={inputClass}
						/>
					</div>

					{kind === 'text' && (
						<div>
							<label htmlFor='addknowledgedialog-text' className={labelClass}>
								Text
							</label>
							<textarea
								id='addknowledgedialog-text'
								aria-label='Paste the document text…'
								value={text}
								onChange={(e) => setText(e.target.value)}
								rows={8}
								placeholder='Paste the document text…'
								className='focus:border-primary-500/80 block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
							/>
						</div>
					)}

					{kind === 'file' && (
						<div>
							<label htmlFor='addknowledgedialog-file' className={labelClass}>
								File
							</label>
							<input
								id='addknowledgedialog-file'
								type='file'
								accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
								onChange={(e) => setFile(e.target.files?.[0] ?? null)}
								className='file:bg-primary-400 file:text-primary-950 block w-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500 outline-none file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-black dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
							/>
							<p className={hintClass}>{ALLOWED_EXTENSIONS.join(', ')} · max 5 MB</p>
						</div>
					)}

					{definition.synced && (
						<KnowledgeSourceSettingsPartial
							ws={ws}
							type={kind as TKnowledgeSourceType}
							app={
								kind === 'url' || !apps || editing
									? undefined
									: (app ?? {
											type: kind as TKnowledgeSourceType,
											accounts: [],
											expired: false,
										})
							}
							credentialId={credentialId}
							onCredentialChange={setCredentialId}
							config={config}
							onConfigChange={setConfig}
							onPicked={(label: string) => {
								if (!nameTouched) setName(label);
							}}
						/>
					)}

					{configChanged && editing && (
						<p className='flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'>
							<AlertTriangle size={12} className='mt-0.5 shrink-0' />
							Saving removes its {editing.documents_count} current document
							{editing.documents_count === 1 ? '' : 's'} and reads it again from the
							new settings.
						</p>
					)}

					<div>
						<label htmlFor='addknowledgedialog-collection' className={labelClass}>
							Collection
						</label>
						<input
							id='addknowledgedialog-collection'
							aria-label={isPrivate ? 'personal' : 'default'}
							type='text'
							value={collection}
							onChange={(e) => setCollection(e.target.value)}
							placeholder={isPrivate ? 'personal' : 'default'}
							disabled={!!editing}
							className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
						/>
						<p className={hintClass}>
							{editing
								? 'Fixed once added. To move it, add it again in another collection.'
								: 'Groups related documents.'}
						</p>
					</div>

					{!sharedOnly && (
						<label
							className={`flex items-start gap-2.5 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 ${
								editing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
							}`}>
							<input
								type='checkbox'
								checked={isPrivate}
								onChange={(e) => setIsPrivate(e.target.checked)}
								disabled={!!editing}
								className='mt-0.5'
							/>
							<span>
								<span className='block text-xs font-bold text-zinc-800 dark:text-zinc-200'>
									Private to me
								</span>
								<span className='block text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
									Only you and your personal assistant can search it. Shared
									knowledge reaches every agent and needs manage access.
								</span>
							</span>
						</label>
					)}

					<button
						onClick={handleSubmit}
						disabled={isPending || !canSubmit}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
						{isPending
							? editing
								? 'Saving…'
								: 'Adding…'
							: editing
								? configChanged
									? 'Save and sync again'
									: 'Save'
								: definition.synced
									? 'Add and sync'
									: 'Add'}
					</button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AddKnowledgeDialog;
