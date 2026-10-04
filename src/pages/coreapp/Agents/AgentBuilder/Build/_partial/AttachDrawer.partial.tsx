import { useEffect, useState } from 'react';
import { Check, ChevronRight, Loader2, Upload, X } from 'lucide-react';
import { notify } from '@/api/core';
import { LibraryService, useLibrary } from '@/api/modules/library';
import { fileIconFor, fileSolidToneFor } from '@/utils/fileDisplay.util';
import type { TLibraryItem } from '@/types/library.type';

const RECENT_COUNT = 12;

/**
 * What the composer's paperclip opens: a panel docked to the top of the chat
 * box, sharing its border, with an upload from this computer and the recent
 * files from the Library to attach again in one click. A Library file is
 * fetched and attached like a fresh upload, so the message carries it the
 * same way either way.
 */
const AttachDrawer = ({
	ws,
	onClose,
	onUpload,
	onAttach,
	canAttach,
	onOpenLibrary,
}: {
	ws: string;
	onClose: () => void;
	onUpload: () => void;
	onAttach: (file: File) => void;
	/** Whether a file of this name may be attached to a message. */
	canAttach: (filename: string) => boolean;
	onOpenLibrary: () => void;
}) => {
	const { data, isLoading } = useLibrary(ws, { per_page: RECENT_COUNT });
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [attachedIds, setAttachedIds] = useState<string[]>([]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	const recent = (data?.pages[0]?.items ?? []).filter((item) => canAttach(item.filename));

	const attach = async (item: TLibraryItem) => {
		if (loadingId || attachedIds.includes(item.id)) return;
		setLoadingId(item.id);
		try {
			onAttach(await LibraryService.fetchFile(ws, item));
			setAttachedIds((ids) => [...ids, item.id]);
		} catch {
			notify.error(`Could not attach ${item.filename}.`);
		} finally {
			setLoadingId(null);
		}
	};

	return (
		<div className='rounded-t-2xl border border-b-0 border-zinc-200 bg-zinc-50/80 px-3 pt-3 pb-2 dark:border-zinc-800 dark:bg-zinc-900/80'>
			<div className='mb-2 flex items-center justify-between'>
				<span className='text-[11px] font-black tracking-wide text-zinc-400 uppercase'>
					Add to your message
				</span>
				<button
					type='button'
					onClick={onClose}
					aria-label='Close'
					className='flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-200'>
					<X size={14} />
				</button>
			</div>

			<button
				type='button'
				onClick={onUpload}
				className='flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white dark:hover:bg-white/5'>
				<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-2xs dark:bg-zinc-800 dark:text-zinc-300'>
					<Upload size={16} />
				</span>
				<span className='min-w-0'>
					<span className='block text-[13px] font-bold text-zinc-800 dark:text-zinc-100'>
						Upload from computer
					</span>
					<span className='block text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
						Images, PDFs and text files, up to 25 MB
					</span>
				</span>
			</button>

			<div className='mt-2 flex items-center justify-between px-2'>
				<span className='text-[11px] font-bold text-zinc-500 dark:text-zinc-400'>
					Recent from Library
				</span>
				<button
					type='button'
					onClick={onOpenLibrary}
					className='flex items-center gap-0.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
					See all <ChevronRight size={12} />
				</button>
			</div>

			<div className='no-scrollbar mt-1.5 flex gap-2 overflow-x-auto px-2 pb-1'>
				{isLoading ? (
					Array.from({ length: 6 }, (_, index) => (
						<div
							key={index}
							className='h-16 w-16 shrink-0 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800'
						/>
					))
				) : recent.length === 0 ? (
					<p className='py-3 text-[11px] font-medium text-zinc-400'>
						Files you send or agents make will show up here.
					</p>
				) : (
					recent.map((item) => {
						const Icon = fileIconFor(item.mime_type, item.filename);
						const isAttached = attachedIds.includes(item.id);
						return (
							<button
								key={item.id}
								type='button'
								onClick={() => void attach(item)}
								title={
									isAttached
										? `${item.filename} (attached)`
										: `Attach ${item.filename}`
								}
								className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition dark:bg-zinc-800 ${
									isAttached
										? 'border-primary-400 ring-primary-400/40 ring-2'
										: 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
								}`}>
								{item.kind === 'image' && item.view_url ? (
									<img
										src={item.view_url}
										alt={item.filename}
										className='h-full w-full object-cover'
									/>
								) : (
									<span className='flex h-full w-full flex-col items-center justify-center gap-1 px-1'>
										<span
											className={`flex h-7 w-7 items-center justify-center rounded-lg ${fileSolidToneFor(item.mime_type, item.filename)}`}>
											<Icon size={14} />
										</span>
										<span className='w-full truncate text-center text-[9px] font-semibold text-zinc-500 dark:text-zinc-400'>
											{item.filename}
										</span>
									</span>
								)}
								{(loadingId === item.id || isAttached) && (
									<span className='absolute inset-0 flex items-center justify-center bg-black/40 text-white'>
										{loadingId === item.id ? (
											<Loader2 size={16} className='animate-spin' />
										) : (
											<Check size={18} strokeWidth={3} />
										)}
									</span>
								)}
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

export default AttachDrawer;
