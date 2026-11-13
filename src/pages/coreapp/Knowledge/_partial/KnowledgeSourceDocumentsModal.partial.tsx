import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useKnowledgeSourceDocuments } from '@/api/modules/knowledge-base';
import type { TKnowledgeSource } from '@/types/knowledge-base.type';

/** The documents a synced source brought into the knowledge base; open one to read it whole. */
const KnowledgeSourceDocumentsModal = ({
	ws,
	source,
	onClose,
	onOpenDocument,
}: {
	ws: string;
	/** `null` closes the modal. */
	source: TKnowledgeSource | null;
	onClose: () => void;
	onOpenDocument: (doc: { source: string; collection: string }) => void;
}) => {
	const { data: documents = [], isLoading } = useKnowledgeSourceDocuments(ws, source?.id ?? '');

	return (
		<Modal isOpen={!!source} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex min-w-0 flex-col'>
					<span className='truncate text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{source?.name}
					</span>
					<span className='mt-1 text-xs font-semibold text-zinc-400'>
						{documents.length} documents
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				{isLoading ? (
					<div className='flex items-center justify-center gap-2 py-12 text-sm font-semibold text-zinc-400'>
						<Loader2 size={16} className='animate-spin' />
						Loading…
					</div>
				) : documents.length === 0 ? (
					<p className='py-12 text-center text-sm font-semibold text-zinc-500'>
						Nothing synced yet.
					</p>
				) : (
					<ul className='flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto'>
						{documents.map((doc) => (
							<li
								key={doc.external_id}
								className='flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800'>
								<FileText size={13} className='shrink-0 text-zinc-400' />
								<button
									type='button'
									onClick={() =>
										source &&
										doc.title &&
										onOpenDocument({
											source: doc.title,
											collection: source.collection,
										})
									}
									className='min-w-0 flex-1 truncate text-left text-xs font-bold text-zinc-800 hover:underline dark:text-zinc-200'>
									{doc.title ?? 'Untitled'}
								</button>
								<span className='shrink-0 text-[10px] font-semibold text-zinc-400'>
									{doc.chunks_count} chunks
								</span>
								{doc.url && (
									<a
										href={doc.url}
										target='_blank'
										rel='noreferrer'
										aria-label='Open original'
										className='shrink-0 text-zinc-400 hover:text-zinc-700'>
										<ExternalLink size={12} />
									</a>
								)}
							</li>
						))}
					</ul>
				)}
			</ModalBody>
		</Modal>
	);
};

export default KnowledgeSourceDocumentsModal;
