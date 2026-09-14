import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileUp } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { notify } from '@/api/core';
import { useIngestKnowledge } from '@/api/modules/knowledge-base';
import type { TKnowledgeCollection } from '@/types/knowledge-base.type';

// ============================================================
// Ingest
// ------------------------------------------------------------
// POST .../knowledge-base takes exactly one of `text` or `file`
// (multipart) and chunks + embeds it server-side. `collection`
// groups what gets ingested; `source` labels where it came from.
// ============================================================

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500';
const labelClass = 'mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300';

interface IIngestKnowledgeModalProps {
	ws: string;
	open: boolean;
	collections: TKnowledgeCollection[];
	onClose: () => void;
}

const IngestKnowledgeModal = ({ ws, open, collections, onClose }: IIngestKnowledgeModalProps) => {
	const ingest = useIngestKnowledge(ws);
	const fileRef = useRef<HTMLInputElement>(null);

	const [mode, setMode] = useState<'text' | 'file'>('text');
	const [text, setText] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [source, setSource] = useState('');
	const [collection, setCollection] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (!open) return;
		setMode('text');
		setText('');
		setFile(null);
		setSource('');
		setCollection('');
		setError('');
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (mode === 'text' && !text.trim()) {
			setError('Paste some text to ingest');
			return;
		}
		if (mode === 'file' && !file) {
			setError('Choose a file to ingest');
			return;
		}

		try {
			const result = await ingest.mutateAsync({
				...(mode === 'text' ? { text: text.trim() } : { file: file! }),
				source: source.trim() || (mode === 'file' ? file?.name : undefined),
				collection: collection.trim() || undefined,
			});
			notify.success(
				`Ingested ${result.chunks_count} chunk${result.chunks_count === 1 ? '' : 's'}.`,
			);
			onClose();
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} size='sm' isScrollable>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<BookOpen size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Add knowledge
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							Text is chunked and embedded so agents can search it.
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={handleSubmit} className='grid gap-4 pt-2'>
					<div className='flex gap-2'>
						{(['text', 'file'] as const).map((value) => (
							<button
								key={value}
								type='button'
								onClick={() => setMode(value)}
								className={`h-9 flex-1 cursor-pointer rounded-xl text-xs font-bold transition ${
									mode === value
										? 'bg-primary-400 text-primary-950'
										: 'border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'
								}`}>
								{value === 'text' ? 'Paste text' : 'Upload file'}
							</button>
						))}
					</div>

					{mode === 'text' ? (
						<div>
							<label className={labelClass} htmlFor='kb-text'>
								Text
							</label>
							<textarea
								id='kb-text'
								rows={7}
								placeholder='Paste the content you want agents to be able to look up…'
								className={`${inputClass} h-auto py-3`}
								value={text}
								onChange={(e) => {
									setText(e.target.value);
									setError('');
								}}
							/>
						</div>
					) : (
						<div>
							<label className={labelClass}>File</label>
							<button
								type='button'
								onClick={() => fileRef.current?.click()}
								className='flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-xs font-semibold text-zinc-400 transition hover:border-primary-400 hover:text-primary-500 dark:border-zinc-700'>
								<FileUp size={18} />
								{file ? file.name : 'Choose a file'}
							</button>
							<input
								ref={fileRef}
								type='file'
								className='hidden'
								onChange={(e) => {
									setFile(e.target.files?.[0] ?? null);
									setError('');
								}}
							/>
						</div>
					)}

					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className={labelClass} htmlFor='kb-collection'>
								Collection{' '}
								<span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<input
								id='kb-collection'
								list='kb-collections'
								className={inputClass}
								placeholder='default'
								value={collection}
								onChange={(e) => setCollection(e.target.value)}
							/>
							<datalist id='kb-collections'>
								{collections.map((c) => (
									<option key={c.collection} value={c.collection} />
								))}
							</datalist>
						</div>
						<div>
							<label className={labelClass} htmlFor='kb-source'>
								Source <span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<input
								id='kb-source'
								className={inputClass}
								placeholder='handbook.pdf'
								value={source}
								onChange={(e) => setSource(e.target.value)}
							/>
						</div>
					</div>

					{error && <p className='text-xs font-semibold text-red-500'>{error}</p>}

					<div className='flex justify-end gap-2.5 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={ingest.isPending}
							className='inline-flex h-11 items-center justify-center rounded-xl bg-primary-400 px-5 text-sm font-bold text-primary-950 shadow-sm transition hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'>
							{ingest.isPending ? 'Ingesting…' : 'Add to knowledge base'}
						</button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
};

export default IngestKnowledgeModal;
