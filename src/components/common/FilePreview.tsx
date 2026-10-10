import { createElement, useEffect, useMemo, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import {
	fileIconFor,
	fileSolidToneFor,
	fileTypeLabel,
	isImageFile,
} from '@/utils/fileDisplay.util';

/** A local `File` as an image URL for its thumbnail, revoked when it changes or unmounts. */
export const useObjectUrl = (file: File | null | undefined) => {
	const url = useMemo(
		() => (file && isImageFile(file.type, file.name) ? URL.createObjectURL(file) : null),
		[file],
	);

	useEffect(
		() => () => {
			if (url) URL.revokeObjectURL(url);
		},
		[url],
	);

	return url;
};

type TFilePreviewProps = {
	filename: string;
	mimeType?: string | null;
	size?: number | null;
	/** Shown as a thumbnail for an image; without one an image gets its icon. */
	previewUrl?: string | null;
	/** Smaller line under the name, in place of the file's type. */
	caption?: ReactNode;
	onClick?: () => void;
	onRemove?: () => void;
	removeDisabled?: boolean;
	busy?: boolean;
	title?: string;
	/** `large` shows an image at a readable size, as in a sent message. */
	imageSize?: 'thumb' | 'large';
};

/**
 * One file the way every chat surface shows it, as ChatGPT does: an image as
 * a square thumbnail, anything else as a small card with a solid coloured type
 * icon, its name and its type ("PDF", "Spreadsheet"). Used by the composer, sent messages, files
 * an agent made, and the attach panel, so a file looks the same wherever it is.
 */
const FilePreview = ({
	filename,
	mimeType,
	previewUrl,
	caption,
	onClick,
	onRemove,
	removeDisabled,
	busy,
	title,
	imageSize = 'thumb',
}: TFilePreviewProps) => {
	const isImage = isImageFile(mimeType, filename) && !!previewUrl;
	const Icon = fileIconFor(mimeType, filename);
	const details = caption ?? fileTypeLabel(mimeType, filename);

	const body = isImage ? (
		<img
			src={previewUrl ?? ''}
			alt={filename}
			className={
				imageSize === 'large'
					? 'block max-h-64 w-auto max-w-full object-cover'
					: 'h-full w-full object-cover'
			}
		/>
	) : (
		<span className='flex h-full min-w-0 items-center gap-3 px-2'>
			<span
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${fileSolidToneFor(mimeType, filename)}`}>
				{createElement(Icon, { size: 18 })}
			</span>
			<span className='min-w-0 text-left'>
				<span className='block truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100'>
					{filename}
				</span>
				<span className='block truncate text-xs text-zinc-500 dark:text-zinc-400'>
					{details}
				</span>
			</span>
		</span>
	);

	const frame = `relative block shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
		!isImage ? 'h-14 w-60 max-w-full' : imageSize === 'large' ? 'max-w-64' : 'h-14 w-14'
	}`;

	return (
		<div className='group relative max-w-full' title={title ?? filename}>
			{onClick ? (
				<button
					type='button'
					onClick={onClick}
					className={`${frame} transition hover:border-zinc-300 dark:hover:border-zinc-600`}>
					{body}
				</button>
			) : (
				<span className={frame}>{body}</span>
			)}

			{busy && (
				<span className='absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 dark:bg-black/50'>
					<Loader2 size={16} className='animate-spin text-zinc-500' />
				</span>
			)}

			{onRemove && (
				<button
					type='button'
					onClick={onRemove}
					disabled={removeDisabled}
					aria-label={`Remove ${filename}`}
					className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100'>
					<X size={11} strokeWidth={3} />
				</button>
			)}
		</div>
	);
};

/** A `File` not yet uploaded, with a thumbnail made from its own bytes. */
export const LocalFilePreview = ({
	file,
	...props
}: { file: File } & Omit<TFilePreviewProps, 'filename' | 'mimeType' | 'size' | 'previewUrl'>) => {
	const url = useObjectUrl(file);
	return (
		<FilePreview
			filename={file.name}
			mimeType={file.type}
			size={file.size}
			previewUrl={url}
			{...props}
		/>
	);
};

export default FilePreview;
