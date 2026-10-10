import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
	useCreateKnowledgeSource,
	useIngestKnowledge,
	useKnowledgeSourceApps,
} from '@/api/modules/knowledge-base';
import type { TKnowledgeSourceType } from '@/types/knowledge-base.type';
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
	onClose: () => void;
}

/**
 * The one way to add to the knowledge base: text or a file once, or a web
 * page or app kept in sync. Name, collection and privacy work the same for
 * every kind.
 */
const AddKnowledgeDialog = ({
	ws,
	isOpen,
	initialKind = 'text',
	defaultCollection,
	onClose,
}: IAddKnowledgeDialogProps) => {
	const ingest = useIngestKnowledge(ws);
	const createSource = useCreateKnowledgeSource(ws);

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
	const [syncedPick, setSyncedPick] = useState<{ kind: TKnowledgeKind; app: typeof app } | null>(
		null,
	);
	if (syncedPick?.kind !== kind || syncedPick.app !== app) {
		setSyncedPick({ kind, app });
		setCredentialId(app?.accounts[0]?.id);
		setConfig({});
		// A name filled in from the last pick belongs to that app.
		if (!nameTouched) setName('');
	}

	const openKey = isOpen ? `${initialKind}:${defaultCollection ?? ''}` : null;
	const [syncedOpenKey, setSyncedOpenKey] = useState<string | null>(null);
	if (syncedOpenKey !== openKey) {
		setSyncedOpenKey(openKey);
		if (isOpen) {
			setKind(initialKind);
			setCollection(defaultCollection ?? '');
		}
	}

	if (!isOpen) return null;

	const definition = KNOWLEDGE_KINDS[kind];
	const isPending = ingest.isPending || createSource.isPending;

	const canSubmit =
		kind === 'text'
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

		if (!definition.synced) {
			ingest.mutate(
				{
					text: kind === 'text' ? text : undefined,
					file: kind === 'file' ? (file ?? undefined) : undefined,
					source: name.trim() || undefined,
					collection: collection.trim() || undefined,
					private: isPrivate,
				},
				{ onSuccess: handleClose },
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
				config: Object.fromEntries(
					Object.entries(config)
						.map(([key, value]) => [key, value.trim()])
						.filter(([, value]) => value),
				),
			},
			{ onSuccess: handleClose },
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
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={handleClose}
				className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
			/>
			<motion.div
				initial={{ x: '100%' }}
				animate={{ x: 0 }}
				exit={{ x: '100%' }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950'>
				<div className='flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800'>
					<div>
						<h2 className='text-lg font-black tracking-tight text-zinc-900 dark:text-white'>
							Add knowledge
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Everything is chunked, embedded and made searchable. Apps are read with
							your connected account, read-only.
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

					<div>
						<label className={labelClass}>{definition.synced ? 'Name' : 'Title'}</label>
						<input
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
							<label className={labelClass}>Text</label>
							<textarea
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
							<label className={labelClass}>File</label>
							<input
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
								kind === 'url' || !apps
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

					<div>
						<label className={labelClass}>Collection</label>
						<input
							type='text'
							value={collection}
							onChange={(e) => setCollection(e.target.value)}
							placeholder={isPrivate ? 'personal' : 'default'}
							className={inputClass}
						/>
						<p className={hintClass}>Groups related documents.</p>
					</div>

					<label className='flex cursor-pointer items-start gap-2.5 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800'>
						<input
							type='checkbox'
							checked={isPrivate}
							onChange={(e) => setIsPrivate(e.target.checked)}
							className='mt-0.5'
						/>
						<span>
							<span className='block text-xs font-bold text-zinc-800 dark:text-zinc-200'>
								Private to me
							</span>
							<span className='block text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
								Only you and your personal assistant can search it. Shared knowledge
								reaches every agent and needs manage access.
							</span>
						</span>
					</label>

					<button
						onClick={handleSubmit}
						disabled={isPending || !canSubmit}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
						{isPending ? 'Adding…' : definition.synced ? 'Add and sync' : 'Add'}
					</button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AddKnowledgeDialog;
