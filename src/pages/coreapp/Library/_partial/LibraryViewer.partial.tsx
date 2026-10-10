import { createElement, useEffect } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Download,
	ExternalLink,
	Loader2,
	MessageSquare,
	X,
} from 'lucide-react';
import type { TLibraryItem } from '@/types/library.type';
import { fileExtension, fileIconFor, formatFileSize } from '@/utils/fileDisplay.util';

/**
 * One file, full screen: an image at its own size; any other file as its
 * icon, opened in a new tab when the browser can show it. ← and →
 * step through the gallery, Esc closes.
 */
const LibraryViewer = ({
	item,
	onClose,
	onPrevious,
	onNext,
	onDownload,
	isDownloading,
	onOpenChat,
}: {
	item: TLibraryItem;
	onClose: () => void;
	onPrevious?: () => void;
	onNext?: () => void;
	onDownload: () => void;
	isDownloading: boolean;
	onOpenChat?: () => void;
}) => {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
			if (event.key === 'ArrowLeft') onPrevious?.();
			if (event.key === 'ArrowRight') onNext?.();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose, onPrevious, onNext]);

	const Icon = fileIconFor(item.mime_type, item.filename);
	const navButton =
		'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20';

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-label={item.filename}
			className='fixed inset-0 z-50 flex flex-col bg-zinc-950/[0.98] backdrop-blur-md'>
			<header className='flex shrink-0 items-center gap-3 px-4 py-3 text-white sm:px-6'>
				<div className='min-w-0 flex-1'>
					<p className='truncate text-sm font-bold'>{item.filename}</p>
					<p className='truncate text-xs text-zinc-400'>
						{item.source === 'uploaded' ? 'Uploaded' : 'Made by'}{' '}
						{item.source === 'generated' && (item.agent?.name ?? 'an agent')}
						{item.source === 'uploaded' && item.agent && `to ${item.agent.name}`} ·{' '}
						{new Date(item.created_at).toLocaleString()} · {formatFileSize(item.size)}
					</p>
				</div>
				{onOpenChat && (
					<button
						type='button'
						onClick={onOpenChat}
						className='hidden h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-bold transition hover:bg-white/20 sm:flex'>
						<MessageSquare size={14} /> Open chat
					</button>
				)}
				<button
					type='button'
					onClick={onDownload}
					disabled={isDownloading}
					aria-label='Download'
					className='flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-bold transition hover:bg-white/20 disabled:opacity-60'>
					{isDownloading ? (
						<Loader2 size={14} className='animate-spin' />
					) : (
						<Download size={14} />
					)}
					<span className='hidden sm:inline'>Download</span>
				</button>
				<button
					type='button'
					onClick={onClose}
					aria-label='Close'
					className='flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10'>
					<X size={18} />
				</button>
			</header>

			<div className='relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16'>
				{onPrevious && (
					<button
						type='button'
						onClick={onPrevious}
						aria-label='Previous'
						className={`${navButton} left-3`}>
						<ChevronLeft size={20} />
					</button>
				)}

				{item.kind === 'image' && item.view_url ? (
					<img
						src={item.view_url}
						alt={item.filename}
						className='max-h-full max-w-full rounded-lg object-contain shadow-2xl'
					/>
				) : (
					<div className='flex flex-col items-center gap-4 text-center text-white'>
						<div className='flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10'>
							{createElement(Icon, { size: 40 })}
						</div>
						<p className='text-sm font-bold'>
							{fileExtension(item.filename) || 'File'}
						</p>
						{item.view_url ? (
							<a
								href={item.view_url}
								target='_blank'
								rel='noreferrer'
								className='flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-bold text-zinc-900 transition hover:bg-zinc-200'>
								<ExternalLink size={14} /> Open in new tab
							</a>
						) : (
							<p className='max-w-xs text-xs text-zinc-400'>
								This file can't be shown here. Download it to open it.
							</p>
						)}
					</div>
				)}

				{onNext && (
					<button
						type='button'
						onClick={onNext}
						aria-label='Next'
						className={`${navButton} right-3`}>
						<ChevronRight size={20} />
					</button>
				)}
			</div>
		</div>
	);
};

export default LibraryViewer;
