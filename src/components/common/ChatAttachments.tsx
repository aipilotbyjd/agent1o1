import { Upload } from 'lucide-react';
import { useDownloadArtifact } from '@/api/modules/artifacts';
import FilePreview, { LocalFilePreview } from '@/components/common/FilePreview';
import { isImageFile } from '@/utils/fileDisplay.util';
import type { TChatAttachment } from '@/utils/chatAttachments.util';

/** Files picked for the next message, above the composer. */
export const ChatAttachmentTray = ({
	files,
	busy,
	onRemove,
}: {
	files: File[];
	busy: boolean;
	onRemove: (file: File) => void;
}) => {
	if (files.length === 0) return null;
	return (
		<div className='flex flex-wrap gap-2 pt-1.5 pr-1.5' aria-live='polite'>
			{files.map((file) => (
				<LocalFilePreview
					key={`${file.name}-${file.size}-${file.lastModified}`}
					file={file}
					onRemove={() => onRemove(file)}
					removeDisabled={busy}
				/>
			))}
		</div>
	);
};

/** Files a member sent with a message, above its bubble. Downloadable once the
 *  turn is stored and the artifact has an id. */
export const MessageAttachments = ({
	attachments,
	files,
	ws,
}: {
	attachments: TChatAttachment[];
	/** The files as sent from this tab: thumbnails before the stored copies exist. */
	files?: File[];
	ws: string;
}) => {
	const downloadMutation = useDownloadArtifact(ws);

	return (
		<div className='mb-1.5 flex flex-wrap justify-end gap-2'>
			{attachments.map((file, index) => {
				const local = files?.[index];
				const { id, previewUrl } = file;
				// An image opens full size; any other stored file downloads.
				const open =
					previewUrl && isImageFile(file.mimeType, file.filename)
						? () => window.open(previewUrl, '_blank', 'noopener,noreferrer')
						: id
							? () =>
									downloadMutation.mutate({
										artifactId: id,
										filename: file.filename,
									})
							: undefined;
				return local && !previewUrl ? (
					<LocalFilePreview
						key={`${file.filename}-${index}`}
						file={local}
						onClick={open}
						imageSize='large'
					/>
				) : (
					<FilePreview
						key={id ?? `${file.filename}-${index}`}
						imageSize='large'
						filename={file.filename}
						mimeType={file.mimeType}
						size={file.size}
						previewUrl={previewUrl}
						onClick={open}
						busy={
							downloadMutation.isPending &&
							downloadMutation.variables?.artifactId === id
						}
					/>
				);
			})}
		</div>
	);
};

/** Covers a chat while files are dragged over it (`useFileDrop`). Ignores the
 *  pointer, so the drop still lands on the chat underneath. `className` places
 *  it (an `inset-*`). */
export const FileDropOverlay = ({ hint, className }: { hint: string; className: string }) => (
	<div
		aria-hidden='true'
		className={`border-primary-400 pointer-events-none absolute z-50 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white/90 text-center backdrop-blur-sm dark:bg-zinc-950/90 ${className}`}>
		<span className='bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 flex h-11 w-11 items-center justify-center rounded-xl'>
			<Upload size={20} />
		</span>
		<span className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
			Drop files to attach
		</span>
		<span className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>{hint}</span>
	</div>
);
