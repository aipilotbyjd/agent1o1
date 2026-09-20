import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useIngestKnowledge } from '@/api/modules/knowledge-base';

/** Mirrors `IngestKnowledgeRequest::rules()` — plain-text-like formats
 *  only, no PDF/Office extraction in this backend. */
const ALLOWED_EXTENSIONS = ['txt', 'md', 'markdown', 'csv', 'json', 'xml', 'yaml', 'yml', 'html', 'htm'];

interface IIngestKnowledgeDialogProps {
	ws: string;
	isOpen: boolean;
	defaultCollection?: string;
	onClose: () => void;
}

const IngestKnowledgeDialog = ({
	ws,
	isOpen,
	defaultCollection,
	onClose,
}: IIngestKnowledgeDialogProps) => {
	const ingestMutation = useIngestKnowledge(ws);

	const [mode, setMode] = useState<'text' | 'file'>('text');
	const [text, setText] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [source, setSource] = useState('');
	const [collection, setCollection] = useState(defaultCollection ?? '');

	if (!isOpen) return null;

	const reset = () => {
		setMode('text');
		setText('');
		setFile(null);
		setSource('');
		setCollection(defaultCollection ?? '');
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const canSubmit = mode === 'text' ? !!text.trim() : !!file;

	const handleSubmit = () => {
		if (!canSubmit) return;
		ingestMutation.mutate(
			{
				text: mode === 'text' ? text : undefined,
				file: mode === 'file' ? (file ?? undefined) : undefined,
				source: source.trim() || undefined,
				collection: collection.trim() || undefined,
			},
			{ onSuccess: () => handleClose() },
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
							Ingest knowledge
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Paste text or upload a file - it&apos;s chunked, embedded, and made searchable
							workspace-wide.
						</p>
					</div>
					<button
						onClick={handleClose}
						className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900'>
						<X size={16} />
					</button>
				</div>

				<div className='flex-1 space-y-5 px-6 py-5'>
					<div className='flex gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40'>
						<button
							type='button'
							onClick={() => setMode('text')}
							className={`h-8 flex-1 cursor-pointer rounded-lg text-xs font-bold transition-colors ${mode === 'text'
									? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white'
									: 'text-zinc-500 dark:text-zinc-400'
								}`}>
							Paste text
						</button>
						<button
							type='button'
							onClick={() => setMode('file')}
							className={`h-8 flex-1 cursor-pointer rounded-lg text-xs font-bold transition-colors ${mode === 'file'
									? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white'
									: 'text-zinc-500 dark:text-zinc-400'
								}`}>
							Upload file
						</button>
					</div>

					{mode === 'text' ? (
						<div>
							<label className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Text
							</label>
							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								rows={8}
								placeholder='Paste the document text…'
								className='block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
							/>
						</div>
					) : (
						<div>
							<label className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								File - {ALLOWED_EXTENSIONS.join(', ')} (max 5 MB)
							</label>
							<input
								type='file'
								accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
								onChange={(e) => setFile(e.target.files?.[0] ?? null)}
								className='block w-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500 outline-none file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-400 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-primary-950 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
							/>
						</div>
					)}

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Source
							</label>
							<input
								type='text'
								value={source}
								onChange={(e) => setSource(e.target.value)}
								placeholder='e.g. refund-policy.md'
								className='block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
							/>
							<p className='mt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
								Defaults to the filename when uploading a file.
							</p>
						</div>
						<div>
							<label className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Collection
							</label>
							<input
								type='text'
								value={collection}
								onChange={(e) => setCollection(e.target.value)}
								placeholder='default'
								className='block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-primary-500/80 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
							/>
							<p className='mt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
								Groups related documents. Defaults to &quot;default&quot;.
							</p>
						</div>
					</div>

					<button
						onClick={handleSubmit}
						disabled={ingestMutation.isPending || !canSubmit}
						className='flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-400 text-xs font-black text-primary-950 shadow-md shadow-primary-500/10 transition-all hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
						{ingestMutation.isPending ? 'Ingesting…' : 'Ingest'}
					</button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default IngestKnowledgeDialog;
