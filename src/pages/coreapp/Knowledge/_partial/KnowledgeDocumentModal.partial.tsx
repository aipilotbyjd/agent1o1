import { Copy, FileText, Loader2 } from 'lucide-react';
import { useKnowledgeDocument } from '@/api/modules/knowledge-base';
import { notify } from '@/api/core';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';

/**
 * The whole document a chunk came from, reassembled by the backend from every
 * chunk that shares its `source` (and collection) — what an agent's
 * read-document tool would get back.
 */
const KnowledgeDocumentModal = ({
	ws,
	doc,
	onClose,
}: {
	ws: string;
	/** `null` closes the modal. */
	doc: { source: string; collection: string } | null;
	onClose: () => void;
}) => {
	const { data, isLoading, isError } = useKnowledgeDocument(ws, {
		source: doc?.source ?? '',
		collection: doc?.collection,
	});

	const handleCopy = () => {
		if (!data?.text || !navigator.clipboard) return;
		navigator.clipboard.writeText(data.text);
		notify.success('Document copied');
	};

	return (
		<Modal isOpen={!!doc} setIsOpen={(open) => !open && onClose()} size='xl'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex min-w-0 items-center gap-3'>
					<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
						<FileText size={16} />
					</div>
					<div className='flex min-w-0 flex-col'>
						<span className='truncate text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{doc?.source}
						</span>
						<span className='mt-1 font-mono text-xs font-semibold text-zinc-400'>
							{doc?.collection}
							{data?.text ? ` · ${data.text.length.toLocaleString()} characters` : ''}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{isLoading ? (
					<div className='flex items-center justify-center gap-2 py-16 text-sm font-semibold text-zinc-400'>
						<Loader2 size={16} className='animate-spin' />
						Reassembling document…
					</div>
				) : isError || !data ? (
					<p className='py-16 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						This document could not be loaded.
					</p>
				) : (
					<div className='relative pb-2'>
						<button
							type='button'
							onClick={handleCopy}
							className='absolute top-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-600 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'>
							<Copy size={12} />
							Copy
						</button>
						<pre className='max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4 pr-24 font-sans text-xs leading-relaxed font-medium whitespace-pre-wrap text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300'>
							{data.text}
						</pre>
					</div>
				)}
			</ModalBody>
		</Modal>
	);
};

export default KnowledgeDocumentModal;
